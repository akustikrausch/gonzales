"""
Domain Entities - Pure Python business objects with identity.

These entities are independent of any persistence mechanism (SQLAlchemy, etc.)
and represent the core business concepts of the application.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class MeasurementEntity:
    """
    Domain entity representing a speed test measurement.

    This is a pure domain object without any ORM dependencies.
    The persistence layer maps this to/from the SQLAlchemy model.
    """
    id: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Speed metrics (bits per second and megabits per second)
    download_bps: float = 0.0
    upload_bps: float = 0.0
    download_mbps: float = 0.0
    upload_mbps: float = 0.0
    download_bytes: int = 0
    upload_bytes: int = 0

    # Latency metrics
    ping_latency_ms: float = 0.0
    ping_jitter_ms: float = 0.0
    packet_loss_pct: Optional[float] = None

    # Network info
    isp: str = ""
    server_id: int = 0
    server_name: str = ""
    server_location: str = ""
    server_country: str = ""

    # Connection info
    internal_ip: str = ""
    external_ip: str = ""
    interface_name: str = ""
    is_vpn: bool = False
    connection_type: str = "unknown"
    mac_address: str = ""

    # Result references
    result_id: str = ""
    result_url: str = ""

    # Threshold compliance
    below_download_threshold: bool = False
    below_upload_threshold: bool = False

    @property
    def has_violation(self) -> bool:
        """Check if measurement violates any threshold."""
        return self.below_download_threshold or self.below_upload_threshold

    @property
    def total_data_bytes(self) -> int:
        """Total data transferred during the test."""
        return self.download_bytes + self.upload_bytes

    def check_thresholds(
        self,
        download_threshold_mbps: float,
        upload_threshold_mbps: float,
        tolerance_percent: float = 0.0
    ) -> tuple[bool, bool]:
        """
        Check if speeds meet thresholds with tolerance.

        Returns:
            Tuple of (below_download, below_upload)
        """
        effective_dl = download_threshold_mbps * (1 - tolerance_percent / 100)
        effective_ul = upload_threshold_mbps * (1 - tolerance_percent / 100)

        below_dl = self.download_mbps < effective_dl
        below_ul = self.upload_mbps < effective_ul

        return below_dl, below_ul


@dataclass
class OutageEntity:
    """
    Domain entity representing an internet outage event.

    Tracks the duration and severity of connectivity failures.
    """
    id: Optional[int] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    failure_count: int = 0
    trigger_error: str = ""
    resolution_measurement_id: Optional[int] = None

    @property
    def is_active(self) -> bool:
        """Check if outage is still ongoing."""
        return self.ended_at is None

    @property
    def duration_minutes(self) -> Optional[float]:
        """Get duration in minutes."""
        if self.duration_seconds is None:
            return None
        return self.duration_seconds / 60

    def resolve(self, ended_at: datetime, measurement_id: Optional[int] = None) -> None:
        """Mark the outage as resolved."""
        self.ended_at = ended_at
        self.duration_seconds = (ended_at - self.started_at).total_seconds()
        self.resolution_measurement_id = measurement_id


@dataclass
class SpeedtestServerEntity:
    """
    Domain entity representing a speedtest server.
    """
    id: int
    host: str
    port: int
    name: str
    location: str
    country: str

    @property
    def display_name(self) -> str:
        """Human-readable server name with location."""
        return f"{self.name} ({self.location}, {self.country})"


@dataclass
class ConfigEntity:
    """
    Domain entity representing application configuration.

    Separates runtime configuration from environment settings.
    """
    test_interval_minutes: int = 60
    download_threshold_mbps: float = 100.0
    upload_threshold_mbps: float = 50.0
    tolerance_percent: float = 15.0
    preferred_server_id: int = 0
    manual_trigger_cooldown_seconds: int = 60
    theme: str = "auto"
    isp_name: str = ""
    data_retention_days: int = 0
    webhook_url: str = ""

    @property
    def effective_download_threshold(self) -> float:
        """Minimum acceptable download speed with tolerance."""
        return self.download_threshold_mbps * (1 - self.tolerance_percent / 100)

    @property
    def effective_upload_threshold(self) -> float:
        """Minimum acceptable upload speed with tolerance."""
        return self.upload_threshold_mbps * (1 - self.tolerance_percent / 100)

    @property
    def has_webhook(self) -> bool:
        """Check if webhook notifications are enabled."""
        return bool(self.webhook_url)

    @property
    def has_retention_policy(self) -> bool:
        """Check if data retention is enabled."""
        return self.data_retention_days > 0


@dataclass
class TestFailureEntity:
    """Domain entity representing a failed speed test."""
    id: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    error_type: str = ""
    error_message: str = ""
    raw_output: Optional[str] = None
