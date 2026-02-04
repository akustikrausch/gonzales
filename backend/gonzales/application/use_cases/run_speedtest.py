"""
Run Speedtest Use Case - Execute and record a speed test.

This use case orchestrates:
1. Running the speedtest via the SpeedtestPort
2. Checking results against configured thresholds
3. Persisting the measurement via MeasurementRepository
4. Publishing relevant domain events
5. Sending webhook notifications if configured
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Protocol

from gonzales.domain.entities import MeasurementEntity
from gonzales.domain.value_objects import ThresholdConfig, ConnectionType
from gonzales.domain.events import MeasurementCompleted, ThresholdViolation
from gonzales.domain.exceptions import SpeedtestError, RateLimitError


class SpeedtestPort(Protocol):
    """Protocol for speedtest execution."""
    async def run_test(self, server_id: Optional[int] = None) -> "SpeedtestResult": ...


class MeasurementRepositoryPort(Protocol):
    """Protocol for measurement persistence."""
    async def save(self, entity: MeasurementEntity) -> MeasurementEntity: ...
    async def get_latest(self) -> Optional[MeasurementEntity]: ...


class EventBusPort(Protocol):
    """Protocol for event publishing."""
    def publish(self, event_type: str, data: dict) -> None: ...


class WebhookPort(Protocol):
    """Protocol for webhook delivery."""
    async def send(self, url: str, event_type: str, payload: dict) -> bool: ...


class ConfigPort(Protocol):
    """Protocol for configuration access."""
    def get(self, key: str, default=None): ...


@dataclass
class SpeedtestResult:
    """Result from speedtest execution."""
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
    raw_json: dict
    timestamp: datetime


@dataclass
class RunSpeedtestInput:
    """Input for running a speedtest."""
    server_id: Optional[int] = None
    triggered_by: str = "manual"  # "manual", "scheduled", "api"


@dataclass
class RunSpeedtestOutput:
    """Output from running a speedtest."""
    measurement: MeasurementEntity
    is_compliant: bool
    download_deficit_pct: float
    upload_deficit_pct: float
    execution_time_seconds: float


class RunSpeedtestUseCase:
    """
    Use case for executing a speed test.

    Responsibilities:
    - Validate cooldown period for manual triggers
    - Execute speedtest via port
    - Check results against thresholds
    - Persist measurement
    - Publish events and webhooks
    """

    def __init__(
        self,
        speedtest: SpeedtestPort,
        measurements: MeasurementRepositoryPort,
        event_bus: EventBusPort,
        webhook: Optional[WebhookPort] = None,
        config: Optional[ConfigPort] = None,
    ):
        self._speedtest = speedtest
        self._measurements = measurements
        self._event_bus = event_bus
        self._webhook = webhook
        self._config = config

    async def execute(self, input_data: RunSpeedtestInput) -> RunSpeedtestOutput:
        """
        Execute a speed test and record the results.

        Args:
            input_data: Test configuration and trigger info

        Returns:
            RunSpeedtestOutput with measurement and compliance info

        Raises:
            RateLimitError: If manual cooldown not elapsed
            SpeedtestError: If test execution fails
        """
        start_time = datetime.utcnow()

        # Check cooldown for manual triggers
        if input_data.triggered_by == "manual" and self._config:
            await self._check_cooldown()

        # Run the speedtest
        try:
            result = await self._speedtest.run_test(input_data.server_id)
        except Exception as e:
            raise SpeedtestError(str(e), error_type="EXECUTION_FAILED")

        # Create measurement entity
        connection_type = ConnectionType.detect(result.interface_name, result.is_vpn)

        measurement = MeasurementEntity(
            timestamp=result.timestamp,
            download_bps=result.download_bps,
            upload_bps=result.upload_bps,
            download_mbps=result.download_bps / 1_000_000,
            upload_mbps=result.upload_bps / 1_000_000,
            download_bytes=result.download_bytes,
            upload_bytes=result.upload_bytes,
            ping_latency_ms=result.ping_latency_ms,
            ping_jitter_ms=result.ping_jitter_ms,
            packet_loss_pct=result.packet_loss_pct,
            isp=result.isp,
            server_id=result.server_id,
            server_name=result.server_name,
            server_location=result.server_location,
            server_country=result.server_country,
            internal_ip=result.internal_ip,
            external_ip=result.external_ip,
            interface_name=result.interface_name,
            is_vpn=result.is_vpn,
            connection_type=connection_type.value,
            result_id=result.result_id,
            result_url=result.result_url,
        )

        # Check thresholds
        threshold_config = self._get_threshold_config()
        below_dl, below_ul = measurement.check_thresholds(
            threshold_config.download_mbps,
            threshold_config.upload_mbps,
            threshold_config.tolerance_percent,
        )
        measurement.below_download_threshold = below_dl
        measurement.below_upload_threshold = below_ul

        # Persist measurement
        saved = await self._measurements.save(measurement)

        # Calculate deficits
        dl_deficit, ul_deficit = threshold_config.get_deficit(
            measurement.download_mbps,
            measurement.upload_mbps,
        )

        # Publish events
        is_compliant = not (below_dl or below_ul)
        await self._publish_events(saved, is_compliant, dl_deficit, ul_deficit, threshold_config)

        execution_time = (datetime.utcnow() - start_time).total_seconds()

        return RunSpeedtestOutput(
            measurement=saved,
            is_compliant=is_compliant,
            download_deficit_pct=dl_deficit,
            upload_deficit_pct=ul_deficit,
            execution_time_seconds=execution_time,
        )

    async def _check_cooldown(self) -> None:
        """Check if manual trigger cooldown has elapsed."""
        cooldown = self._config.get("manual_trigger_cooldown_seconds", 60)
        latest = await self._measurements.get_latest()

        if latest and latest.timestamp:
            elapsed = (datetime.utcnow() - latest.timestamp).total_seconds()
            if elapsed < cooldown:
                raise RateLimitError(
                    f"Please wait {int(cooldown - elapsed)} seconds before running another test",
                    retry_after_seconds=int(cooldown - elapsed),
                )

    def _get_threshold_config(self) -> ThresholdConfig:
        """Get threshold configuration."""
        if self._config:
            return ThresholdConfig(
                download_mbps=self._config.get("download_threshold_mbps", 100.0),
                upload_mbps=self._config.get("upload_threshold_mbps", 50.0),
                tolerance_percent=self._config.get("tolerance_percent", 15.0),
            )
        return ThresholdConfig(download_mbps=100.0, upload_mbps=50.0)

    async def _publish_events(
        self,
        measurement: MeasurementEntity,
        is_compliant: bool,
        dl_deficit: float,
        ul_deficit: float,
        threshold_config: ThresholdConfig,
    ) -> None:
        """Publish domain events and webhooks."""
        # Measurement completed event
        completed_event = MeasurementCompleted(
            measurement_id=measurement.id or 0,
            download_mbps=measurement.download_mbps,
            upload_mbps=measurement.upload_mbps,
            ping_ms=measurement.ping_latency_ms,
            jitter_ms=measurement.ping_jitter_ms,
            server_name=measurement.server_name,
            is_compliant=is_compliant,
        )
        self._event_bus.publish("measurement_completed", completed_event.__dict__)

        # Threshold violation event
        if not is_compliant:
            violation_event = ThresholdViolation(
                measurement_id=measurement.id or 0,
                download_mbps=measurement.download_mbps,
                upload_mbps=measurement.upload_mbps,
                download_threshold=threshold_config.download_mbps,
                upload_threshold=threshold_config.upload_mbps,
                download_deficit_pct=dl_deficit,
                upload_deficit_pct=ul_deficit,
                below_download=measurement.below_download_threshold,
                below_upload=measurement.below_upload_threshold,
            )
            self._event_bus.publish("threshold_violation", violation_event.__dict__)

        # Send webhooks if configured
        if self._webhook and self._config:
            webhook_url = self._config.get("webhook_url", "")
            if webhook_url:
                await self._webhook.send(
                    webhook_url,
                    "speedtest_complete",
                    {
                        "measurement_id": measurement.id,
                        "download_mbps": round(measurement.download_mbps, 2),
                        "upload_mbps": round(measurement.upload_mbps, 2),
                        "ping_ms": round(measurement.ping_latency_ms, 2),
                        "is_compliant": is_compliant,
                    },
                )
