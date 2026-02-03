"""Port for network topology analysis (traceroute)."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class HopResult:
    """Result of a single hop in traceroute."""

    hop_number: int
    ip_address: str | None
    hostname: str | None = None
    latency_ms: float | None = None
    packet_loss_pct: float = 0.0
    is_timeout: bool = False

    @property
    def is_local_network(self) -> bool:
        """Check if this hop is in a local/private network range."""
        if not self.ip_address:
            return False
        return self.ip_address.startswith((
            "192.168.",
            "10.",
            "172.16.", "172.17.", "172.18.", "172.19.",
            "172.20.", "172.21.", "172.22.", "172.23.",
            "172.24.", "172.25.", "172.26.", "172.27.",
            "172.28.", "172.29.", "172.30.", "172.31.",
        ))


@dataclass
class TopologyResult:
    """Result of a complete traceroute analysis."""

    target_host: str
    timestamp: datetime
    hops: list[HopResult] = field(default_factory=list)
    completed: bool = True
    error_message: str | None = None

    @property
    def total_hops(self) -> int:
        """Number of hops (excluding timeouts at the end)."""
        return len(self.hops)

    @property
    def total_latency_ms(self) -> float:
        """Sum of all hop latencies."""
        return sum(h.latency_ms or 0 for h in self.hops)

    @property
    def local_hops(self) -> list[HopResult]:
        """Get all hops in local network range."""
        return [h for h in self.hops if h.is_local_network]

    @property
    def bottleneck(self) -> HopResult | None:
        """Find the hop with highest latency."""
        valid_hops = [h for h in self.hops if h.latency_ms is not None]
        if not valid_hops:
            return None
        return max(valid_hops, key=lambda h: h.latency_ms or 0)

    @property
    def local_network_healthy(self) -> bool:
        """Check if all local hops have acceptable latency (<10ms)."""
        for hop in self.local_hops:
            if hop.latency_ms is not None and hop.latency_ms > 10:
                return False
            if hop.packet_loss_pct > 1:
                return False
        return True

    def get_diagnosis(self) -> str:
        """Generate a human-readable diagnosis."""
        if not self.hops:
            return "No route data available"

        if not self.completed:
            return f"Traceroute incomplete: {self.error_message or 'Unknown error'}"

        issues = []

        # Check local network
        for hop in self.local_hops:
            if hop.latency_ms and hop.latency_ms > 10:
                issues.append(f"Local network latency high at hop {hop.hop_number} ({hop.latency_ms:.1f}ms)")
            if hop.packet_loss_pct > 1:
                issues.append(f"Packet loss at hop {hop.hop_number} ({hop.packet_loss_pct:.1f}%)")

        # Check for bottleneck
        bottleneck = self.bottleneck
        if bottleneck and bottleneck.latency_ms and bottleneck.latency_ms > 50:
            if not bottleneck.is_local_network:
                issues.append(f"High latency at hop {bottleneck.hop_number} ({bottleneck.latency_ms:.1f}ms)")

        if not issues:
            return "Network path healthy"

        return "; ".join(issues)


class NetworkAnalyzerPort(ABC):
    """Interface for network topology analysis."""

    @abstractmethod
    async def analyze_route(self, target: str, max_hops: int = 30) -> TopologyResult:
        """
        Perform traceroute analysis to the target host.

        Args:
            target: Target hostname or IP address
            max_hops: Maximum number of hops to trace

        Returns:
            TopologyResult with hop-by-hop analysis
        """

    @abstractmethod
    async def ping(self, target: str, count: int = 3) -> tuple[float | None, float]:
        """
        Ping the target and return average latency and packet loss.

        Args:
            target: Target hostname or IP address
            count: Number of ping packets to send

        Returns:
            Tuple of (average_latency_ms, packet_loss_percentage)
            average_latency_ms is None if all packets were lost
        """
