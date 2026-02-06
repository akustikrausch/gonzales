"""Schemas for root-cause analysis API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProblemFingerprint(BaseModel):
    """A detected network problem with classification and confidence."""

    category: str  # dns, local_network, isp_backbone, isp_lastmile, server, time_based, connection
    severity: str  # critical, warning, info
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    description: str
    evidence: list[str] = Field(default_factory=list, description="Supporting evidence")
    first_detected: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    occurrence_count: int = 1


class HopCorrelation(BaseModel):
    """Correlation between a network hop and speed performance."""

    hop_number: int
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    avg_latency_ms: float
    latency_correlation: float = Field(
        description="Pearson correlation with download speed (-1 to 1)"
    )
    packet_loss_pct: float = 0.0
    is_bottleneck: bool = False
    is_local: bool = False


class LayerScores(BaseModel):
    """Health scores for each network layer (0-100, higher = healthier)."""

    dns_score: float = Field(ge=0, le=100)
    local_network_score: float = Field(ge=0, le=100)
    isp_backbone_score: float = Field(ge=0, le=100)
    isp_lastmile_score: float = Field(ge=0, le=100)
    server_score: float = Field(ge=0, le=100)


class TimePattern(BaseModel):
    """Detected time-based performance pattern."""

    pattern_type: str  # peak_degradation, night_improvement, weekend_variation
    peak_hours: list[int] = Field(default_factory=list)
    peak_avg_download_mbps: float
    offpeak_avg_download_mbps: float
    degradation_pct: float
    confidence: float = Field(ge=0.0, le=1.0)


class ConnectionImpact(BaseModel):
    """Impact analysis of connection type on performance."""

    has_significant_difference: bool
    best_connection: str
    worst_connection: str
    download_gap_pct: float
    recommendation: str


class Recommendation(BaseModel):
    """Actionable recommendation based on analysis."""

    priority: int = Field(ge=1, description="Priority (1 = highest)")
    category: str  # dns, local_network, isp, server, general
    title: str
    description: str
    expected_impact: str
    difficulty: str  # easy, moderate, advanced


class RootCauseAnalysis(BaseModel):
    """Complete root-cause analysis result."""

    analysis_timestamp: datetime
    data_window_days: int
    measurement_count: int
    topology_count: int

    # Primary diagnosis
    primary_cause: Optional[ProblemFingerprint] = None
    secondary_causes: list[ProblemFingerprint] = Field(default_factory=list)

    # Layer breakdown
    layer_scores: LayerScores

    # Hop correlations (if topology data available)
    hop_correlations: list[HopCorrelation] = Field(default_factory=list)

    # Time patterns
    time_pattern: Optional[TimePattern] = None

    # Connection comparison
    connection_impact: Optional[ConnectionImpact] = None

    # Actionable recommendations
    recommendations: list[Recommendation] = Field(default_factory=list)

    # Overall health score
    network_health_score: float = Field(ge=0, le=100)


class RootCauseRequest(BaseModel):
    """Request parameters for root-cause analysis."""

    days: int = Field(default=30, ge=7, le=90, description="Analysis window in days")
    min_confidence: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Minimum confidence for fingerprints"
    )
