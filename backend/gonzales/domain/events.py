"""
Domain Events - Events that occur within the business domain.

Domain events represent something that has happened in the domain
that domain experts care about. They enable loose coupling between
different parts of the application.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import uuid4


@dataclass
class DomainEvent:
    """
    Base class for all domain events.

    Events are immutable records of something that has happened.
    """
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def event_type(self) -> str:
        """Get the event type name."""
        return self.__class__.__name__


@dataclass
class MeasurementCompleted(DomainEvent):
    """
    A speed test measurement was successfully completed.

    Published after a speedtest finishes with valid results.
    """
    measurement_id: int = 0
    download_mbps: float = 0.0
    upload_mbps: float = 0.0
    ping_ms: float = 0.0
    jitter_ms: float = 0.0
    server_name: str = ""
    is_compliant: bool = True


@dataclass
class ThresholdViolation(DomainEvent):
    """
    A measurement fell below configured thresholds.

    Published when download or upload speed is below the acceptable minimum.
    """
    measurement_id: int = 0
    download_mbps: float = 0.0
    upload_mbps: float = 0.0
    download_threshold: float = 0.0
    upload_threshold: float = 0.0
    download_deficit_pct: float = 0.0
    upload_deficit_pct: float = 0.0
    below_download: bool = False
    below_upload: bool = False


@dataclass
class OutageDetected(DomainEvent):
    """
    An internet outage has been detected.

    Published after consecutive test failures reach the outage threshold.
    """
    outage_id: Optional[int] = None
    consecutive_failures: int = 0
    last_error: str = ""
    started_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class OutageResolved(DomainEvent):
    """
    An internet outage has been resolved.

    Published when connectivity is restored after an outage.
    """
    outage_id: Optional[int] = None
    duration_seconds: float = 0.0
    duration_minutes: float = 0.0
    consecutive_failures: int = 0
    resolution_measurement_id: Optional[int] = None


@dataclass
class TestScheduled(DomainEvent):
    """
    A speed test has been scheduled.

    Published when the scheduler queues a new test.
    """
    scheduled_for: datetime = field(default_factory=datetime.utcnow)
    trigger: str = "scheduled"  # "scheduled", "manual", "startup"


@dataclass
class TestFailed(DomainEvent):
    """
    A speed test execution failed.

    Published when a test fails to complete (network error, CLI error, etc.).
    """
    error_type: str = ""
    error_message: str = ""
    is_consecutive: bool = False
    consecutive_count: int = 0


@dataclass
class ConfigurationChanged(DomainEvent):
    """
    Application configuration was modified.

    Published when user changes settings via API or config file.
    """
    changed_fields: list[str] = field(default_factory=list)
    changed_by: str = "api"  # "api", "file", "env"


@dataclass
class DataRetentionExecuted(DomainEvent):
    """
    Data retention cleanup was executed.

    Published after old measurements are deleted per retention policy.
    """
    deleted_count: int = 0
    retention_days: int = 0
    oldest_remaining: Optional[datetime] = None


@dataclass
class WebhookSent(DomainEvent):
    """
    A webhook notification was sent.

    Published after successfully sending a webhook payload.
    """
    webhook_url: str = ""
    event_type: str = ""  # type: ignore[assignment]
    success: bool = True
    status_code: int = 0
    response_time_ms: float = 0.0


@dataclass
class ServerListUpdated(DomainEvent):
    """
    The speedtest server list was refreshed.

    Published after fetching latest servers from Ookla.
    """
    server_count: int = 0
    closest_server_id: Optional[int] = None
    closest_server_name: str = ""


# Type alias for event handlers
EventHandler = callable  # type: ignore[type-arg]
