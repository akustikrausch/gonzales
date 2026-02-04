"""
Manage Config Use Case - Read and update application configuration.

This use case orchestrates:
1. Reading current configuration
2. Validating configuration changes
3. Persisting configuration updates
4. Publishing configuration change events
"""
from dataclasses import dataclass
from typing import Any, Optional, Protocol

from gonzales.domain.entities import ConfigEntity
from gonzales.domain.events import ConfigurationChanged
from gonzales.domain.exceptions import ValidationError


class ConfigPort(Protocol):
    """Protocol for configuration access."""
    def get(self, key: str, default=None) -> Any: ...
    def set(self, key: str, value: Any) -> None: ...
    def get_all(self) -> dict[str, Any]: ...
    def save(self) -> None: ...


class EventBusPort(Protocol):
    """Protocol for event publishing."""
    def publish(self, event_type: str, data: dict) -> None: ...


class SchedulerPort(Protocol):
    """Protocol for scheduler control."""
    def reschedule(self, job_id: str, interval_minutes: int) -> None: ...


# Validation constraints for configuration fields
CONFIG_CONSTRAINTS = {
    "test_interval_minutes": {"min": 1, "max": 1440},
    "download_threshold_mbps": {"min": 0, "max": 10000},
    "upload_threshold_mbps": {"min": 0, "max": 10000},
    "tolerance_percent": {"min": 0, "max": 50},
    "manual_trigger_cooldown_seconds": {"min": 0, "max": 3600},
    "data_retention_days": {"min": 0, "max": 3650},
}

ALLOWED_THEMES = {"auto", "light", "dark"}


@dataclass
class GetConfigOutput:
    """Output for get configuration."""
    config: ConfigEntity
    host: str = ""
    port: int = 0
    log_level: str = ""
    debug: bool = False


@dataclass
class UpdateConfigInput:
    """Input for configuration update."""
    test_interval_minutes: Optional[int] = None
    download_threshold_mbps: Optional[float] = None
    upload_threshold_mbps: Optional[float] = None
    tolerance_percent: Optional[float] = None
    preferred_server_id: Optional[int] = None
    manual_trigger_cooldown_seconds: Optional[int] = None
    theme: Optional[str] = None
    isp_name: Optional[str] = None
    data_retention_days: Optional[int] = None
    webhook_url: Optional[str] = None


@dataclass
class UpdateConfigOutput:
    """Output for configuration update."""
    config: ConfigEntity
    changed_fields: list[str]


class ManageConfigUseCase:
    """
    Use case for managing application configuration.

    Handles reading current configuration and applying updates
    with validation and side effects (scheduler reschedule, etc.).
    """

    def __init__(
        self,
        config: ConfigPort,
        event_bus: Optional[EventBusPort] = None,
        scheduler: Optional[SchedulerPort] = None,
    ):
        self._config = config
        self._event_bus = event_bus
        self._scheduler = scheduler

    def get_config(self) -> GetConfigOutput:
        """Get current configuration."""
        entity = ConfigEntity(
            test_interval_minutes=self._config.get("test_interval_minutes", 60),
            download_threshold_mbps=self._config.get("download_threshold_mbps", 100.0),
            upload_threshold_mbps=self._config.get("upload_threshold_mbps", 50.0),
            tolerance_percent=self._config.get("tolerance_percent", 15.0),
            preferred_server_id=self._config.get("preferred_server_id", 0),
            manual_trigger_cooldown_seconds=self._config.get("manual_trigger_cooldown_seconds", 60),
            theme=self._config.get("theme", "auto"),
            isp_name=self._config.get("isp_name", ""),
            data_retention_days=self._config.get("data_retention_days", 0),
            webhook_url=self._config.get("webhook_url", ""),
        )
        return GetConfigOutput(
            config=entity,
            host=self._config.get("host", "127.0.0.1"),
            port=self._config.get("port", 8470),
            log_level=self._config.get("log_level", "info"),
            debug=self._config.get("debug", False),
        )

    def update_config(self, input_data: UpdateConfigInput) -> UpdateConfigOutput:
        """Update configuration with validation."""
        changed_fields: list[str] = []
        updates: dict[str, Any] = {}

        if input_data.test_interval_minutes is not None:
            self._validate_range("test_interval_minutes", input_data.test_interval_minutes)
            updates["test_interval_minutes"] = input_data.test_interval_minutes
            changed_fields.append("test_interval_minutes")

        if input_data.download_threshold_mbps is not None:
            self._validate_range("download_threshold_mbps", input_data.download_threshold_mbps)
            updates["download_threshold_mbps"] = input_data.download_threshold_mbps
            changed_fields.append("download_threshold_mbps")

        if input_data.upload_threshold_mbps is not None:
            self._validate_range("upload_threshold_mbps", input_data.upload_threshold_mbps)
            updates["upload_threshold_mbps"] = input_data.upload_threshold_mbps
            changed_fields.append("upload_threshold_mbps")

        if input_data.tolerance_percent is not None:
            self._validate_range("tolerance_percent", input_data.tolerance_percent)
            updates["tolerance_percent"] = input_data.tolerance_percent
            changed_fields.append("tolerance_percent")

        if input_data.preferred_server_id is not None:
            if input_data.preferred_server_id < 0:
                raise ValidationError("Server ID must be non-negative", "preferred_server_id")
            updates["preferred_server_id"] = input_data.preferred_server_id
            changed_fields.append("preferred_server_id")

        if input_data.manual_trigger_cooldown_seconds is not None:
            self._validate_range("manual_trigger_cooldown_seconds", input_data.manual_trigger_cooldown_seconds)
            updates["manual_trigger_cooldown_seconds"] = input_data.manual_trigger_cooldown_seconds
            changed_fields.append("manual_trigger_cooldown_seconds")

        if input_data.theme is not None:
            if input_data.theme not in ALLOWED_THEMES:
                raise ValidationError(f"Theme must be one of: {ALLOWED_THEMES}", "theme")
            updates["theme"] = input_data.theme
            changed_fields.append("theme")

        if input_data.isp_name is not None:
            if len(input_data.isp_name) > 255:
                raise ValidationError("ISP name too long (max 255 chars)", "isp_name")
            updates["isp_name"] = input_data.isp_name
            changed_fields.append("isp_name")

        if input_data.data_retention_days is not None:
            self._validate_range("data_retention_days", input_data.data_retention_days)
            updates["data_retention_days"] = input_data.data_retention_days
            changed_fields.append("data_retention_days")

        if input_data.webhook_url is not None:
            if len(input_data.webhook_url) > 2048:
                raise ValidationError("Webhook URL too long (max 2048 chars)", "webhook_url")
            if input_data.webhook_url and not input_data.webhook_url.startswith(("http://", "https://")):
                raise ValidationError("Webhook URL must start with http:// or https://", "webhook_url")
            updates["webhook_url"] = input_data.webhook_url
            changed_fields.append("webhook_url")

        for key, value in updates.items():
            self._config.set(key, value)
        self._config.save()

        if "test_interval_minutes" in changed_fields and self._scheduler:
            self._scheduler.reschedule("speedtest", updates["test_interval_minutes"])

        if changed_fields and self._event_bus:
            event = ConfigurationChanged(changed_fields=changed_fields, changed_by="api")
            self._event_bus.publish("configuration_changed", event.__dict__)

        return UpdateConfigOutput(config=self.get_config().config, changed_fields=changed_fields)

    def _validate_range(self, field: str, value: float | int) -> None:
        """Validate a value against its constraints."""
        constraints = CONFIG_CONSTRAINTS.get(field)
        if not constraints:
            return
        if value < constraints["min"]:
            raise ValidationError(f"{field} must be at least {constraints['min']}", field)
        if value > constraints["max"]:
            raise ValidationError(f"{field} must be at most {constraints['max']}", field)
