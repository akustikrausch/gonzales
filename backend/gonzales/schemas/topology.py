"""Schemas for network topology analysis."""
from datetime import datetime

from pydantic import BaseModel


class NetworkHopOut(BaseModel):
    """Single hop in a traceroute."""

    hop_number: int
    ip_address: str | None
    hostname: str | None
    latency_ms: float | None
    packet_loss_pct: float
    is_local: bool
    is_timeout: bool
    status: str  # "ok", "high_latency", "packet_loss", "timeout"

    @classmethod
    def get_status(cls, latency_ms: float | None, packet_loss_pct: float, is_timeout: bool) -> str:
        """Determine status based on metrics."""
        if is_timeout:
            return "timeout"
        if packet_loss_pct > 5:
            return "packet_loss"
        if latency_ms is not None and latency_ms > 50:
            return "high_latency"
        return "ok"


class NetworkTopologyOut(BaseModel):
    """Complete traceroute result."""

    id: int | None = None
    timestamp: datetime
    target_host: str
    total_hops: int
    total_latency_ms: float
    hops: list[NetworkHopOut]
    bottleneck_hop: int | None  # Hop number with highest latency
    local_network_ok: bool
    diagnosis: str


class TopologyHistoryEntry(BaseModel):
    """Summary entry for topology history."""

    id: int
    timestamp: datetime
    target_host: str
    total_hops: int
    total_latency_ms: float
    local_network_ok: bool


class TopologyHistoryOut(BaseModel):
    """Paginated topology history."""

    entries: list[TopologyHistoryEntry]
    total: int


class NetworkDiagnosisOut(BaseModel):
    """Aggregated network diagnosis based on recent topology analyses."""

    total_analyses: int
    local_network_issues: int
    local_network_health_pct: float
    avg_total_hops: float
    avg_total_latency_ms: float
    common_bottleneck_hops: list[int]
    overall_status: str  # "healthy", "degraded", "problematic"
    recommendations: list[str]
