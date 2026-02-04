"""
Service Ports - Interfaces for external services.

These interfaces abstract external dependencies like the speedtest CLI,
webhook delivery, and notification systems.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional


@dataclass
class SpeedtestResult:
    """Result of a speedtest execution."""
    download_bps: float
    upload_bps: float
    download_bytes: int
    upload_bytes: int
    ping_latency_ms: float
    ping_jitter_ms: float
    packet_loss_pct: Optional[float]
    server_id: int
    server_name: str
    server_location: str
    server_country: str
    isp: str
    internal_ip: str
    external_ip: str
    interface_name: str
    is_vpn: bool
    result_id: str
    result_url: str
    raw_json: dict[str, Any]
    timestamp: datetime


@dataclass
class SpeedtestServer:
    """Available speedtest server."""
    id: int
    host: str
    port: int
    name: str
    location: str
    country: str


class SpeedtestPort(ABC):
    """
    Interface for speedtest execution.

    Abstracts the Ookla CLI or any other speedtest implementation.
    """

    @abstractmethod
    async def run_test(self, server_id: Optional[int] = None) -> SpeedtestResult:
        """
        Execute a speed test.

        Args:
            server_id: Optional specific server to test against

        Returns:
            SpeedtestResult with all measurement data

        Raises:
            SpeedtestError: If test fails
        """
        ...

    @abstractmethod
    async def get_servers(self) -> list[SpeedtestServer]:
        """
        Get list of available speedtest servers.

        Returns:
            List of servers, typically sorted by distance/latency
        """
        ...

    @abstractmethod
    async def get_best_server(self) -> Optional[SpeedtestServer]:
        """
        Get the recommended server for testing.

        Returns:
            Best server based on latency, or None if unavailable
        """
        ...


class WebhookPort(ABC):
    """
    Interface for webhook notification delivery.
    """

    @abstractmethod
    async def send(
        self,
        url: str,
        event_type: str,
        payload: dict[str, Any],
    ) -> bool:
        """
        Send a webhook notification.

        Args:
            url: Target webhook URL
            event_type: Type of event (e.g., "speedtest_complete")
            payload: Event data to send

        Returns:
            True if successfully delivered, False otherwise
        """
        ...


class NotificationPort(ABC):
    """
    Interface for sending notifications (email, push, etc.).
    """

    @abstractmethod
    async def notify(
        self,
        channel: str,
        title: str,
        message: str,
        data: Optional[dict[str, Any]] = None,
    ) -> bool:
        """
        Send a notification.

        Args:
            channel: Notification channel (email, push, etc.)
            title: Notification title
            message: Notification body
            data: Optional additional data

        Returns:
            True if sent successfully
        """
        ...


class EventBusPort(ABC):
    """
    Interface for domain event publishing.

    Enables loose coupling through event-driven architecture.
    """

    @abstractmethod
    def publish(self, event_type: str, data: dict[str, Any]) -> None:
        """
        Publish an event to all subscribers.

        Args:
            event_type: Type identifier for the event
            data: Event payload
        """
        ...

    @abstractmethod
    def subscribe(self, event_type: str, handler: callable) -> None:  # type: ignore[type-arg]
        """
        Subscribe to events of a specific type.

        Args:
            event_type: Type of events to receive
            handler: Callback function for events
        """
        ...

    @abstractmethod
    def unsubscribe(self, event_type: str, handler: callable) -> None:  # type: ignore[type-arg]
        """
        Unsubscribe from events.

        Args:
            event_type: Type of events
            handler: Handler to remove
        """
        ...


class ConfigPort(ABC):
    """
    Interface for configuration management.

    Separates configuration storage from business logic.
    """

    @abstractmethod
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        ...

    @abstractmethod
    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        ...

    @abstractmethod
    def get_all(self) -> dict[str, Any]:
        """Get all configuration as dict."""
        ...

    @abstractmethod
    def save(self) -> None:
        """Persist configuration changes."""
        ...


class SchedulerPort(ABC):
    """
    Interface for job scheduling.
    """

    @abstractmethod
    def schedule_recurring(
        self,
        job_id: str,
        func: callable,  # type: ignore[type-arg]
        interval_minutes: int,
    ) -> None:
        """Schedule a recurring job."""
        ...

    @abstractmethod
    def reschedule(self, job_id: str, interval_minutes: int) -> None:
        """Change the interval of an existing job."""
        ...

    @abstractmethod
    def pause(self, job_id: str) -> None:
        """Pause a scheduled job."""
        ...

    @abstractmethod
    def resume(self, job_id: str) -> None:
        """Resume a paused job."""
        ...

    @abstractmethod
    def get_next_run_time(self, job_id: str) -> Optional[datetime]:
        """Get when a job will next run."""
        ...

    @abstractmethod
    def is_running(self) -> bool:
        """Check if scheduler is active."""
        ...
