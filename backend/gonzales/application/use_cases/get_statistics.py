"""
Get Statistics Use Case - Retrieve and compute measurement statistics.

This use case orchestrates:
1. Fetching measurements from the repository
2. Computing various statistical aggregations
3. Calculating compliance metrics
4. Generating trend analysis
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Protocol
from statistics import mean, median, stdev

from gonzales.domain.entities import MeasurementEntity


class MeasurementRepositoryPort(Protocol):
    """Protocol for measurement access."""
    async def get_by_time_range(
        self, start: datetime, end: datetime, limit: Optional[int] = None
    ) -> list[MeasurementEntity]: ...
    async def count(self) -> int: ...
    async def get_total_data_bytes(self) -> int: ...


class ConfigPort(Protocol):
    """Protocol for configuration access."""
    def get(self, key: str, default=None): ...


@dataclass
class PercentileValues:
    """Percentile breakdown for a metric."""
    p5: float = 0.0
    p25: float = 0.0
    p50: float = 0.0
    p75: float = 0.0
    p95: float = 0.0


@dataclass
class SpeedStatistics:
    """Statistics for a speed metric."""
    min: float = 0.0
    max: float = 0.0
    avg: float = 0.0
    median: float = 0.0
    stddev: float = 0.0
    percentiles: PercentileValues = field(default_factory=PercentileValues)


@dataclass
class SlaCompliance:
    """SLA compliance metrics."""
    total_tests: int = 0
    download_compliant: int = 0
    upload_compliant: int = 0
    download_compliance_pct: float = 0.0
    upload_compliance_pct: float = 0.0


@dataclass
class GetStatisticsInput:
    """Input for statistics retrieval."""
    days: int = 30
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@dataclass
class GetStatisticsOutput:
    """Output containing computed statistics."""
    total_tests: int = 0
    download: Optional[SpeedStatistics] = None
    upload: Optional[SpeedStatistics] = None
    ping: Optional[SpeedStatistics] = None
    sla: Optional[SlaCompliance] = None
    download_violations: int = 0
    upload_violations: int = 0
    download_threshold_mbps: float = 0.0
    upload_threshold_mbps: float = 0.0
    tolerance_percent: float = 0.0
    effective_download_threshold_mbps: float = 0.0
    effective_upload_threshold_mbps: float = 0.0
    total_data_used_bytes: int = 0


class GetStatisticsUseCase:
    """
    Use case for retrieving measurement statistics.

    Computes aggregate statistics, percentiles, and compliance metrics
    for speed test measurements over a specified time period.
    """

    def __init__(
        self,
        measurements: MeasurementRepositoryPort,
        config: Optional[ConfigPort] = None,
    ):
        self._measurements = measurements
        self._config = config

    async def execute(self, input_data: GetStatisticsInput) -> GetStatisticsOutput:
        """
        Compute statistics for the specified period.

        Args:
            input_data: Time range and options

        Returns:
            GetStatisticsOutput with all computed statistics
        """
        # Determine time range
        end = input_data.end_date or datetime.utcnow()
        start = input_data.start_date or (end - timedelta(days=input_data.days))

        # Fetch measurements
        measurements = await self._measurements.get_by_time_range(start, end)

        if not measurements:
            return GetStatisticsOutput(
                download_threshold_mbps=self._get_config("download_threshold_mbps", 100.0),
                upload_threshold_mbps=self._get_config("upload_threshold_mbps", 50.0),
                tolerance_percent=self._get_config("tolerance_percent", 15.0),
            )

        # Extract metric arrays
        downloads = [m.download_mbps for m in measurements]
        uploads = [m.upload_mbps for m in measurements]
        pings = [m.ping_latency_ms for m in measurements]

        # Compute statistics
        download_stats = self._compute_speed_stats(downloads)
        upload_stats = self._compute_speed_stats(uploads)
        ping_stats = self._compute_speed_stats(pings)

        # Compute compliance
        dl_threshold = self._get_config("download_threshold_mbps", 100.0)
        ul_threshold = self._get_config("upload_threshold_mbps", 50.0)
        tolerance = self._get_config("tolerance_percent", 15.0)

        effective_dl = dl_threshold * (1 - tolerance / 100)
        effective_ul = ul_threshold * (1 - tolerance / 100)

        dl_violations = sum(1 for m in measurements if m.below_download_threshold)
        ul_violations = sum(1 for m in measurements if m.below_upload_threshold)

        sla = SlaCompliance(
            total_tests=len(measurements),
            download_compliant=len(measurements) - dl_violations,
            upload_compliant=len(measurements) - ul_violations,
            download_compliance_pct=100 * (len(measurements) - dl_violations) / len(measurements),
            upload_compliance_pct=100 * (len(measurements) - ul_violations) / len(measurements),
        )

        # Get total data usage
        total_data = await self._measurements.get_total_data_bytes()

        return GetStatisticsOutput(
            total_tests=len(measurements),
            download=download_stats,
            upload=upload_stats,
            ping=ping_stats,
            sla=sla,
            download_violations=dl_violations,
            upload_violations=ul_violations,
            download_threshold_mbps=dl_threshold,
            upload_threshold_mbps=ul_threshold,
            tolerance_percent=tolerance,
            effective_download_threshold_mbps=effective_dl,
            effective_upload_threshold_mbps=effective_ul,
            total_data_used_bytes=total_data,
        )

    def _compute_speed_stats(self, values: list[float]) -> SpeedStatistics:
        """Compute statistics for a list of values."""
        if not values:
            return SpeedStatistics()

        sorted_values = sorted(values)
        n = len(sorted_values)

        return SpeedStatistics(
            min=min(values),
            max=max(values),
            avg=mean(values),
            median=median(values),
            stddev=stdev(values) if n > 1 else 0.0,
            percentiles=PercentileValues(
                p5=self._percentile(sorted_values, 5),
                p25=self._percentile(sorted_values, 25),
                p50=self._percentile(sorted_values, 50),
                p75=self._percentile(sorted_values, 75),
                p95=self._percentile(sorted_values, 95),
            ),
        )

    def _percentile(self, sorted_values: list[float], p: int) -> float:
        """Calculate percentile from sorted values."""
        if not sorted_values:
            return 0.0
        n = len(sorted_values)
        k = (n - 1) * p / 100
        f = int(k)
        c = f + 1
        if c >= n:
            return sorted_values[-1]
        return sorted_values[f] + (sorted_values[c] - sorted_values[f]) * (k - f)

    def _get_config(self, key: str, default):
        """Get config value with fallback."""
        if self._config:
            return self._config.get(key, default)
        return default
