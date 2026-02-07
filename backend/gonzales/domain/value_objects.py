"""
Domain Value Objects - Immutable objects defined by their attributes.

Value objects have no identity and are compared by their values.
They encapsulate domain concepts and validation rules.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Speed:
    """
    Value object representing network speed.

    Provides conversions between different units and comparison operations.
    """
    bps: float  # Bits per second (canonical unit)

    @classmethod
    def from_mbps(cls, mbps: float) -> "Speed":
        """Create Speed from megabits per second."""
        return cls(bps=mbps * 1_000_000)

    @classmethod
    def from_kbps(cls, kbps: float) -> "Speed":
        """Create Speed from kilobits per second."""
        return cls(bps=kbps * 1_000)

    @classmethod
    def from_gbps(cls, gbps: float) -> "Speed":
        """Create Speed from gigabits per second."""
        return cls(bps=gbps * 1_000_000_000)

    @property
    def mbps(self) -> float:
        """Speed in megabits per second."""
        return self.bps / 1_000_000

    @property
    def kbps(self) -> float:
        """Speed in kilobits per second."""
        return self.bps / 1_000

    @property
    def gbps(self) -> float:
        """Speed in gigabits per second."""
        return self.bps / 1_000_000_000

    @property
    def bytes_per_second(self) -> float:
        """Speed in bytes per second."""
        return self.bps / 8

    @property
    def mbytes_per_second(self) -> float:
        """Speed in megabytes per second."""
        return self.bytes_per_second / 1_000_000

    def __str__(self) -> str:
        if self.gbps >= 1:
            return f"{self.gbps:.2f} Gbps"
        if self.mbps >= 1:
            return f"{self.mbps:.1f} Mbps"
        return f"{self.kbps:.0f} Kbps"

    def meets_threshold(self, threshold: "Speed", tolerance_percent: float = 0) -> bool:
        """Check if speed meets threshold with optional tolerance."""
        effective = threshold.bps * (1 - tolerance_percent / 100)
        return self.bps >= effective


@dataclass(frozen=True)
class Duration:
    """
    Value object representing a time duration.

    Provides conversions and formatting for time intervals.
    """
    seconds: float  # Canonical unit

    @classmethod
    def from_minutes(cls, minutes: float) -> "Duration":
        """Create Duration from minutes."""
        return cls(seconds=minutes * 60)

    @classmethod
    def from_hours(cls, hours: float) -> "Duration":
        """Create Duration from hours."""
        return cls(seconds=hours * 3600)

    @classmethod
    def from_days(cls, days: float) -> "Duration":
        """Create Duration from days."""
        return cls(seconds=days * 86400)

    @classmethod
    def from_milliseconds(cls, ms: float) -> "Duration":
        """Create Duration from milliseconds."""
        return cls(seconds=ms / 1000)

    @property
    def minutes(self) -> float:
        """Duration in minutes."""
        return self.seconds / 60

    @property
    def hours(self) -> float:
        """Duration in hours."""
        return self.seconds / 3600

    @property
    def days(self) -> float:
        """Duration in days."""
        return self.seconds / 86400

    @property
    def milliseconds(self) -> float:
        """Duration in milliseconds."""
        return self.seconds * 1000

    def __str__(self) -> str:
        if self.days >= 1:
            d = int(self.days)
            h = int((self.seconds % 86400) / 3600)
            return f"{d}d {h}h"
        if self.hours >= 1:
            h = int(self.hours)
            m = int((self.seconds % 3600) / 60)
            return f"{h}h {m}m"
        if self.minutes >= 1:
            m = int(self.minutes)
            s = int(self.seconds % 60)
            return f"{m}m {s}s"
        return f"{self.seconds:.1f}s"


@dataclass(frozen=True)
class Percentage:
    """
    Value object representing a percentage value.

    Ensures value is within valid range and provides formatting.
    """
    value: float  # 0-100 scale

    def __post_init__(self) -> None:
        if not 0 <= self.value <= 100:
            # Use object.__setattr__ since dataclass is frozen
            object.__setattr__(self, 'value', max(0, min(100, self.value)))

    @classmethod
    def from_fraction(cls, fraction: float) -> "Percentage":
        """Create Percentage from a 0-1 fraction."""
        return cls(value=fraction * 100)

    @property
    def fraction(self) -> float:
        """Get as 0-1 fraction."""
        return self.value / 100

    @property
    def is_perfect(self) -> bool:
        """Check if value is 100%."""
        return self.value >= 99.99

    @property
    def is_zero(self) -> bool:
        """Check if value is 0%."""
        return self.value < 0.01

    def __str__(self) -> str:
        if self.value == int(self.value):
            return f"{int(self.value)}%"
        return f"{self.value:.1f}%"


@dataclass(frozen=True)
class NetworkMetrics:
    """
    Value object combining all network performance metrics.

    Represents a complete picture of network quality at a point in time.
    """
    download: Speed
    upload: Speed
    ping_ms: float
    jitter_ms: float
    packet_loss: Optional[Percentage] = None

    @property
    def is_healthy(self) -> bool:
        """Basic health check based on common standards."""
        return (
            self.ping_ms < 100 and
            self.jitter_ms < 30 and
            (self.packet_loss is None or self.packet_loss.value < 1)
        )

    @property
    def quality_score(self) -> int:
        """
        Calculate a 0-100 quality score based on metrics.

        Scoring:
        - Download speed: 30 points (100+ Mbps = full score)
        - Upload speed: 20 points (50+ Mbps = full score)
        - Ping: 30 points (<20ms = full, >200ms = 0)
        - Jitter: 10 points (<5ms = full, >50ms = 0)
        - Packet loss: 10 points (0% = full, >5% = 0)
        """
        score = 0

        # Download (30 pts)
        dl_score = min(30, (self.download.mbps / 100) * 30)
        score += dl_score

        # Upload (20 pts)
        ul_score = min(20, (self.upload.mbps / 50) * 20)
        score += ul_score

        # Ping (30 pts) - lower is better
        if self.ping_ms <= 20:
            ping_score = 30
        elif self.ping_ms >= 200:
            ping_score = 0
        else:
            ping_score = 30 * (1 - (self.ping_ms - 20) / 180)
        score += ping_score

        # Jitter (10 pts) - lower is better
        if self.jitter_ms <= 5:
            jitter_score = 10
        elif self.jitter_ms >= 50:
            jitter_score = 0
        else:
            jitter_score = 10 * (1 - (self.jitter_ms - 5) / 45)
        score += jitter_score

        # Packet loss (10 pts)
        if self.packet_loss is None or self.packet_loss.is_zero:
            loss_score = 10
        elif self.packet_loss.value >= 5:
            loss_score = 0
        else:
            loss_score = 10 * (1 - self.packet_loss.value / 5)
        score += loss_score

        return int(score)


@dataclass(frozen=True)
class ThresholdConfig:
    """
    Value object for speed threshold configuration.

    Encapsulates the threshold values and tolerance for compliance checking.
    """
    download_mbps: float
    upload_mbps: float
    tolerance_percent: float = 0.0

    @property
    def effective_download_mbps(self) -> float:
        """Minimum acceptable download with tolerance applied."""
        return self.download_mbps * (1 - self.tolerance_percent / 100)

    @property
    def effective_upload_mbps(self) -> float:
        """Minimum acceptable upload with tolerance applied."""
        return self.upload_mbps * (1 - self.tolerance_percent / 100)

    def check_compliance(self, download_mbps: float, upload_mbps: float) -> tuple[bool, bool]:
        """
        Check if speeds comply with thresholds.

        Returns:
            Tuple of (download_compliant, upload_compliant)
        """
        dl_ok = download_mbps >= self.effective_download_mbps
        ul_ok = upload_mbps >= self.effective_upload_mbps
        return dl_ok, ul_ok

    @classmethod
    def from_settings(cls) -> "ThresholdConfig":
        """Create ThresholdConfig from current application settings."""
        from gonzales.config import settings
        return cls(
            download_mbps=settings.download_threshold_mbps,
            upload_mbps=settings.upload_threshold_mbps,
            tolerance_percent=settings.tolerance_percent,
        )

    def get_deficit(self, download_mbps: float, upload_mbps: float) -> tuple[float, float]:
        """
        Calculate deficit percentages below threshold.

        Returns:
            Tuple of (download_deficit_pct, upload_deficit_pct)
            Positive values indicate a deficit, 0 means compliant.
        """
        dl_deficit = max(0, (self.effective_download_mbps - download_mbps) / self.effective_download_mbps * 100)
        ul_deficit = max(0, (self.effective_upload_mbps - upload_mbps) / self.effective_upload_mbps * 100)
        return dl_deficit, ul_deficit


@dataclass(frozen=True)
class ConnectionType:
    """Value object representing connection type."""
    ETHERNET = "ethernet"
    WIFI = "wifi"
    VPN = "vpn"
    UNKNOWN = "unknown"

    value: str

    @classmethod
    def detect(cls, interface_name: str, is_vpn: bool = False) -> "ConnectionType":
        """
        Detect connection type from interface name.

        Heuristic detection based on common interface naming patterns:
        - eth*, enp*, eno* -> Ethernet
        - wlan*, wlp*, wl* -> WiFi
        - tun*, tap*, ppp* -> VPN
        """
        if is_vpn:
            return cls(value=cls.VPN)

        name_lower = interface_name.lower()

        # VPN interfaces
        if name_lower.startswith(("tun", "tap", "ppp", "wg")):
            return cls(value=cls.VPN)

        # Ethernet interfaces
        if name_lower.startswith(("eth", "enp", "eno", "ens", "em")):
            return cls(value=cls.ETHERNET)

        # WiFi interfaces
        if name_lower.startswith(("wlan", "wlp", "wl", "wifi")):
            return cls(value=cls.WIFI)

        return cls(value=cls.UNKNOWN)

    @property
    def is_wired(self) -> bool:
        """Check if connection is wired (Ethernet)."""
        return self.value == self.ETHERNET

    @property
    def is_wireless(self) -> bool:
        """Check if connection is wireless (WiFi)."""
        return self.value == self.WIFI

    def __str__(self) -> str:
        return self.value.capitalize()
