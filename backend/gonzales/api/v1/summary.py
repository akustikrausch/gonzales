"""
Summary endpoint for AI agents and LLMs.

Provides a structured, human-readable summary of the current
internet connection status and statistics.
"""

from enum import Enum
from typing import Literal

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.config import settings
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.services.measurement_service import measurement_service
from gonzales.services.outage_service import outage_service
from gonzales.services.statistics_service import statistics_service

router = APIRouter(prefix="/summary", tags=["summary"])


class ConnectionStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    POOR = "poor"
    OUTAGE = "outage"
    UNKNOWN = "unknown"


class AlertType(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Alert(BaseModel):
    type: AlertType
    message: str


class LatestTestSummary(BaseModel):
    timestamp: str
    download_mbps: float = Field(..., description="Download speed in Mbps")
    upload_mbps: float = Field(..., description="Upload speed in Mbps")
    ping_ms: float = Field(..., description="Latency in milliseconds")
    meets_threshold: bool = Field(..., description="Whether speeds meet configured thresholds")


class Statistics7d(BaseModel):
    avg_download: float
    avg_upload: float
    avg_ping: float
    reliability_percent: float = Field(..., description="Percentage of tests meeting thresholds")
    outage_count: int
    test_count: int


class SummaryResponse(BaseModel):
    """
    AI-friendly summary of internet connection status.

    Use this endpoint to get a quick overview of the current
    internet connection quality and recent statistics.
    """

    status: ConnectionStatus = Field(..., description="Overall connection health status")
    summary: str = Field(..., description="Human-readable summary text for LLMs")
    latest_test: LatestTestSummary | None = Field(None, description="Most recent speed test result")
    statistics_7d: Statistics7d | None = Field(None, description="Statistics for the last 7 days")
    alerts: list[Alert] = Field(default_factory=list, description="Active alerts and notifications")
    recommendations: list[str] = Field(default_factory=list, description="AI-generated recommendations")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "summary": "Internet connection is performing well. Current speed: 95.2 Mbps down, 42.1 Mbps up, 12ms ping.",
                "latest_test": {
                    "timestamp": "2024-02-04T10:30:00Z",
                    "download_mbps": 95.2,
                    "upload_mbps": 42.1,
                    "ping_ms": 12.0,
                    "meets_threshold": True
                },
                "statistics_7d": {
                    "avg_download": 92.5,
                    "avg_upload": 40.8,
                    "avg_ping": 14.2,
                    "reliability_percent": 98.5,
                    "outage_count": 0,
                    "test_count": 168
                },
                "alerts": [],
                "recommendations": ["Your connection is stable. No action needed."]
            }
        }
    }


def _determine_status(
    latest: LatestTestSummary | None,
    stats: Statistics7d | None,
    outage_active: bool
) -> ConnectionStatus:
    """Determine overall connection status."""
    if outage_active:
        return ConnectionStatus.OUTAGE
    if not latest:
        return ConnectionStatus.UNKNOWN
    if not latest.meets_threshold:
        return ConnectionStatus.POOR
    if stats and stats.reliability_percent < 90:
        return ConnectionStatus.DEGRADED
    return ConnectionStatus.HEALTHY


def _generate_summary(
    status: ConnectionStatus,
    latest: LatestTestSummary | None,
    stats: Statistics7d | None,
    threshold_down: float,
    threshold_up: float
) -> str:
    """Generate human-readable summary text."""
    if status == ConnectionStatus.OUTAGE:
        return "Internet connection is currently experiencing an outage. Tests are failing."

    if status == ConnectionStatus.UNKNOWN:
        return "No speed test data available yet. Run a test to check your connection."

    if not latest:
        return "No recent test data available."

    speed_desc = f"{latest.download_mbps:.1f} Mbps down, {latest.upload_mbps:.1f} Mbps up, {latest.ping_ms:.0f}ms ping"

    if status == ConnectionStatus.HEALTHY:
        base = f"Internet connection is performing well. Current speed: {speed_desc}."
        if latest.download_mbps > threshold_down * 1.2:
            base += f" This exceeds your configured threshold of {threshold_down:.0f} Mbps by {((latest.download_mbps / threshold_down) - 1) * 100:.0f}%."
        return base

    if status == ConnectionStatus.DEGRADED:
        return f"Internet connection is degraded. Current speed: {speed_desc}. Reliability has dropped below 90% in the last 7 days."

    if status == ConnectionStatus.POOR:
        return f"Internet connection is below expectations. Current speed: {speed_desc}. This is below your configured threshold of {threshold_down:.0f} Mbps download."

    return f"Current speed: {speed_desc}."


def _generate_alerts(
    latest: LatestTestSummary | None,
    stats: Statistics7d | None,
    outage_active: bool
) -> list[Alert]:
    """Generate alerts based on current status."""
    alerts = []

    if outage_active:
        alerts.append(Alert(
            type=AlertType.CRITICAL,
            message="Network outage detected. Speed tests are failing."
        ))

    if latest and not latest.meets_threshold:
        alerts.append(Alert(
            type=AlertType.WARNING,
            message="Current speed is below your configured threshold."
        ))

    if stats:
        if stats.reliability_percent < 80:
            alerts.append(Alert(
                type=AlertType.WARNING,
                message=f"Network reliability is only {stats.reliability_percent:.1f}% over the last 7 days."
            ))
        if stats.outage_count > 0:
            alerts.append(Alert(
                type=AlertType.INFO,
                message=f"{stats.outage_count} outage(s) detected in the last 7 days."
            ))

    return alerts


def _generate_recommendations(
    status: ConnectionStatus,
    latest: LatestTestSummary | None,
    stats: Statistics7d | None
) -> list[str]:
    """Generate actionable recommendations."""
    recommendations = []

    if status == ConnectionStatus.HEALTHY:
        recommendations.append("Your connection is stable. No action needed.")

    if status == ConnectionStatus.OUTAGE:
        recommendations.append("Check your router and modem. Contact your ISP if the issue persists.")

    if status == ConnectionStatus.POOR and latest:
        if latest.ping_ms > 100:
            recommendations.append("High latency detected. This may affect video calls and gaming.")
        recommendations.append("Consider running tests at different times to identify patterns.")

    if stats and stats.reliability_percent < 95:
        recommendations.append("Schedule important video calls during peak performance hours.")

    return recommendations if recommendations else ["Monitor your connection for any changes."]


def _format_as_markdown(response: SummaryResponse) -> str:
    """Format summary as markdown for LLM context."""
    status_emoji = {
        ConnectionStatus.HEALTHY: "✓",
        ConnectionStatus.DEGRADED: "⚠",
        ConnectionStatus.POOR: "✗",
        ConnectionStatus.OUTAGE: "🔴",
        ConnectionStatus.UNKNOWN: "?"
    }

    lines = [
        f"## Internet Status: {response.status.value.title()} {status_emoji.get(response.status, '')}",
        ""
    ]

    if response.latest_test:
        t = response.latest_test
        lines.extend([
            f"**Latest Test** ({t.timestamp}):",
            f"- Download: {t.download_mbps:.1f} Mbps {'✓' if t.meets_threshold else '✗'}",
            f"- Upload: {t.upload_mbps:.1f} Mbps",
            f"- Ping: {t.ping_ms:.0f} ms",
            ""
        ])

    if response.statistics_7d:
        s = response.statistics_7d
        lines.extend([
            "**7-Day Statistics:**",
            f"- Average Download: {s.avg_download:.1f} Mbps",
            f"- Average Upload: {s.avg_upload:.1f} Mbps",
            f"- Reliability: {s.reliability_percent:.1f}%",
            f"- Tests: {s.test_count}",
            f"- Outages: {s.outage_count}",
            ""
        ])

    if response.alerts:
        lines.append("**Alerts:**")
        for alert in response.alerts:
            icon = {"critical": "🔴", "warning": "⚠️", "info": "ℹ️"}.get(alert.type.value, "•")
            lines.append(f"- {icon} {alert.message}")
        lines.append("")

    if response.recommendations:
        lines.append("**Recommendations:**")
        for rec in response.recommendations:
            lines.append(f"- {rec}")

    return "\n".join(lines)


@router.get(
    "",
    response_model=SummaryResponse,
    summary="Get Connection Summary",
    description="""
    Returns a structured, AI-friendly summary of the current internet connection status.

    **Use Cases:**
    - Quick status check for AI agents
    - Context for LLM conversations about internet quality
    - Dashboard overview data

    **Query Parameters:**
    - `format`: Response format (`json` or `markdown`)
    - `verbose`: Include additional details

    **Response includes:**
    - Overall connection status (healthy, degraded, poor, outage)
    - Human-readable summary text
    - Latest test results
    - 7-day statistics
    - Active alerts
    - Recommendations
    """,
    response_description="Structured summary of internet connection status"
)
@limiter.limit(RATE_LIMITS["read"])
async def get_summary(
    request: Request,
    format: Literal["json", "markdown"] = Query("json", description="Response format"),
    session: AsyncSession = Depends(get_db)
):
    """
    Get a comprehensive summary of internet connection status.

    Designed for AI agents and LLMs to quickly understand the current
    state of the monitored internet connection.
    """
    from datetime import datetime, timedelta, timezone

    # Get latest measurement
    latest_measurement = await measurement_service.get_latest(session)

    # Get 7-day statistics
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=7)

    basic_stats = await statistics_service.compute_basic(
        session,
        start_date=start_date,
        end_date=end_date
    )

    # Get outages
    outages = await outage_service.detect_outages(
        session,
        start_date=start_date,
        end_date=end_date
    )

    # Calculate effective thresholds
    tolerance = settings.tolerance_percent / 100
    effective_download = settings.download_threshold_mbps * (1 - tolerance)
    effective_upload = settings.upload_threshold_mbps * (1 - tolerance)

    # Build latest test summary
    latest_test = None
    if latest_measurement:
        meets_threshold = (
            latest_measurement.download_mbps >= effective_download and
            latest_measurement.upload_mbps >= effective_upload
        )
        latest_test = LatestTestSummary(
            timestamp=latest_measurement.timestamp.isoformat(),
            download_mbps=round(latest_measurement.download_mbps, 1),
            upload_mbps=round(latest_measurement.upload_mbps, 1),
            ping_ms=round(latest_measurement.ping_latency_ms, 1),
            meets_threshold=meets_threshold
        )

    # Build 7-day statistics
    stats_7d = None
    if basic_stats and basic_stats.total_tests > 0:
        compliant_tests = basic_stats.total_tests - basic_stats.download_violations
        reliability = (compliant_tests / basic_stats.total_tests) * 100 if basic_stats.total_tests > 0 else 0

        stats_7d = Statistics7d(
            avg_download=round(basic_stats.download.avg, 1) if basic_stats.download else 0,
            avg_upload=round(basic_stats.upload.avg, 1) if basic_stats.upload else 0,
            avg_ping=round(basic_stats.ping.avg, 1) if basic_stats.ping else 0,
            reliability_percent=round(reliability, 1),
            outage_count=len(outages),
            test_count=basic_stats.total_tests
        )

    # Check for active outage
    from gonzales.services.scheduler_service import scheduler_service
    outage_active = scheduler_service.outage_status.get("outage_active", False)

    # Determine status
    status = _determine_status(latest_test, stats_7d, outage_active)

    # Generate summary text
    summary_text = _generate_summary(
        status, latest_test, stats_7d,
        settings.download_threshold_mbps,
        settings.upload_threshold_mbps
    )

    # Generate alerts
    alerts = _generate_alerts(latest_test, stats_7d, outage_active)

    # Generate recommendations
    recommendations = _generate_recommendations(status, latest_test, stats_7d)

    response = SummaryResponse(
        status=status,
        summary=summary_text,
        latest_test=latest_test,
        statistics_7d=stats_7d,
        alerts=alerts,
        recommendations=recommendations
    )

    # Return markdown if requested
    if format == "markdown":
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content=_format_as_markdown(response),
            media_type="text/markdown"
        )

    return response
