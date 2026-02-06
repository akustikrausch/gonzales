"""Service for managing speed test measurements.

This module provides the MeasurementService class which handles:
- Running speed tests with rate limiting and progress events
- Storing and retrieving measurement data
- Managing test cooldowns and concurrent test prevention
"""

import asyncio
import json
import time
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.core.exceptions import CooldownError, TestInProgressError
from gonzales.core.logging import logger
from gonzales.db.models import Measurement, TestFailure
from gonzales.db.repository import MeasurementRepository, TestFailureRepository
from gonzales.schemas.speedtest_raw import SpeedtestRawResult
from gonzales.services.event_bus import event_bus
from gonzales.services.speedtest_runner import speedtest_runner
from gonzales.services.webhook_service import webhook_service
from gonzales.utils.connection_detector import detect_connection_type


class MeasurementService:
    """Service for running and managing speed test measurements.

    Provides thread-safe speed test execution with:
    - Cooldown enforcement for manual triggers
    - Progress event broadcasting via event bus
    - Automatic threshold violation detection
    - Connection type detection (Ethernet/WiFi/VPN)

    Attributes:
        test_in_progress: Whether a speed test is currently running.
    """

    def __init__(self) -> None:
        """Initialize the measurement service."""
        self._lock = asyncio.Lock()
        self._test_in_progress = False
        self._last_manual_trigger: float = 0.0

    @property
    def test_in_progress(self) -> bool:
        """Return whether a speed test is currently in progress."""
        return self._test_in_progress

    def mark_test_starting(self) -> bool:
        """Mark that a test is about to start.

        This is used by the async trigger endpoint to immediately flag
        that a test is starting, before the background task begins.

        Returns:
            True if marked successfully, False if test already in progress.
        """
        if self._test_in_progress or self._lock.locked():
            return False
        self._test_in_progress = True
        return True

    def _check_cooldown(self) -> None:
        """Check if the cooldown period has elapsed since last manual trigger.

        Raises:
            CooldownError: If the cooldown period has not elapsed.
        """
        elapsed = time.time() - self._last_manual_trigger
        remaining = settings.manual_trigger_cooldown_seconds - elapsed
        if remaining > 0:
            raise CooldownError(int(remaining))

    def _create_measurement_from_result(
        self, raw: SpeedtestRawResult, raw_json: str
    ) -> Measurement:
        """Create a Measurement model from raw speedtest result.

        Args:
            raw: Parsed speedtest result data.
            raw_json: Original JSON string for storage.

        Returns:
            Measurement model ready to be persisted.
        """
        # Calculate effective thresholds with tolerance
        # e.g., 1000 Mbps with 15% tolerance = 850 Mbps minimum acceptable
        tolerance_factor = 1 - (settings.tolerance_percent / 100)
        effective_download_threshold = settings.download_threshold_mbps * tolerance_factor
        effective_upload_threshold = settings.upload_threshold_mbps * tolerance_factor

        # Detect connection type based on interface name and VPN flag
        connection_type = detect_connection_type(
            interface_name=raw.interface.name,
            is_vpn=raw.interface.isVpn,
            mac_address=raw.interface.macAddr,
        )

        return Measurement(
            download_bps=raw.download_bps,
            upload_bps=raw.upload_bps,
            download_mbps=raw.download_mbps,
            upload_mbps=raw.upload_mbps,
            download_bytes=raw.download.bytes,
            upload_bytes=raw.upload.bytes,
            ping_latency_ms=raw.ping.latency,
            ping_jitter_ms=raw.ping.jitter,
            packet_loss_pct=raw.packetLoss,
            isp=raw.isp,
            server_id=raw.server.id,
            server_name=raw.server.name,
            server_location=raw.server.location,
            server_country=raw.server.country,
            internal_ip=raw.interface.internalIp,
            external_ip=raw.interface.externalIp,
            interface_name=raw.interface.name,
            is_vpn=raw.interface.isVpn,
            connection_type=connection_type.value,
            mac_address=raw.interface.macAddr,
            result_id=raw.result.id,
            result_url=raw.result.url,
            raw_json=raw_json,
            below_download_threshold=raw.download_mbps < effective_download_threshold,
            below_upload_threshold=raw.upload_mbps < effective_upload_threshold,
        )

    async def run_test(self, session: AsyncSession, manual: bool = False) -> Measurement:
        """Run a speed test and store the results.

        Executes a speedtest using the configured speedtest runner,
        stores the result in the database, and broadcasts progress events.

        Args:
            session: Database session for persisting results.
            manual: If True, enforce cooldown and record trigger time.

        Returns:
            The saved Measurement record.

        Raises:
            CooldownError: If manual trigger is within cooldown period.
            TestInProgressError: If another test is already running.
            SpeedtestError: If the speedtest execution fails.
        """
        if manual:
            self._check_cooldown()

        if self._lock.locked():
            raise TestInProgressError()

        async with self._lock:
            self._test_in_progress = True
            try:
                raw_result = await speedtest_runner.run_with_progress(
                    server_id=settings.preferred_server_id
                )
                raw_json = json.dumps(raw_result.model_dump(), default=str)

                measurement = self._create_measurement_from_result(raw_result, raw_json)
                repo = MeasurementRepository(session)
                saved = await repo.create(measurement)

                if saved.below_download_threshold or saved.below_upload_threshold:
                    tolerance_factor = 1 - (settings.tolerance_percent / 100)
                    logger.warning(
                        "Threshold violation: DL=%.1f Mbps (min %.1f), "
                        "UL=%.1f Mbps (min %.1f) [tolerance %.0f%%]",
                        saved.download_mbps,
                        settings.download_threshold_mbps * tolerance_factor,
                        saved.upload_mbps,
                        settings.upload_threshold_mbps * tolerance_factor,
                        settings.tolerance_percent,
                    )

                event_bus.publish({
                    "event": "complete",
                    "data": {
                        "phase": "complete",
                        "download_mbps": saved.download_mbps,
                        "upload_mbps": saved.upload_mbps,
                        "ping_ms": saved.ping_latency_ms,
                        "jitter_ms": saved.ping_jitter_ms,
                        "measurement_id": saved.id,
                    },
                })

                # Send webhook notification (fire-and-forget)
                below_threshold = saved.below_download_threshold or saved.below_upload_threshold
                asyncio.create_task(
                    webhook_service.notify_speedtest_complete(
                        download_mbps=saved.download_mbps,
                        upload_mbps=saved.upload_mbps,
                        ping_ms=saved.ping_latency_ms,
                        jitter_ms=saved.ping_jitter_ms,
                        server_name=saved.server_name,
                        below_threshold=below_threshold,
                    )
                )

                # Send threshold violation webhook if applicable
                if below_threshold:
                    asyncio.create_task(
                        webhook_service.notify_threshold_violation(
                            download_mbps=saved.download_mbps,
                            upload_mbps=saved.upload_mbps,
                            download_threshold=settings.download_threshold_mbps,
                            upload_threshold=settings.upload_threshold_mbps,
                        )
                    )

                if manual:
                    self._last_manual_trigger = time.time()

                return saved
            except Exception as e:
                failure_repo = TestFailureRepository(session)
                await failure_repo.create(
                    TestFailure(
                        error_type=type(e).__name__,
                        error_message=str(e),
                        raw_output=getattr(e, "raw_output", None),
                    )
                )
                raise
            finally:
                self._test_in_progress = False

    async def get_paginated(
        self,
        session: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        sort_by: str = "timestamp",
        sort_order: str = "desc",
    ) -> tuple[list[Measurement], int]:
        """Get paginated measurements with optional date filtering.

        Args:
            session: Database session.
            page: Page number (1-indexed).
            page_size: Number of items per page.
            start_date: Optional start date filter.
            end_date: Optional end date filter.
            sort_by: Field to sort by.
            sort_order: Sort direction ('asc' or 'desc').

        Returns:
            Tuple of (measurements list, total count).
        """
        repo = MeasurementRepository(session)
        return await repo.get_paginated(page, page_size, start_date, end_date, sort_by, sort_order)

    async def get_latest(self, session: AsyncSession) -> Measurement | None:
        """Get the most recent measurement.

        Args:
            session: Database session.

        Returns:
            The latest Measurement or None if no measurements exist.
        """
        repo = MeasurementRepository(session)
        return await repo.get_latest()

    async def get_by_id(self, session: AsyncSession, measurement_id: int) -> Measurement | None:
        """Get a measurement by its ID.

        Args:
            session: Database session.
            measurement_id: The measurement's primary key.

        Returns:
            The Measurement or None if not found.
        """
        repo = MeasurementRepository(session)
        return await repo.get_by_id(measurement_id)

    async def delete_by_id(self, session: AsyncSession, measurement_id: int) -> bool:
        """Delete a measurement by its ID.

        Args:
            session: Database session.
            measurement_id: The measurement's primary key.

        Returns:
            True if deleted, False if not found.
        """
        repo = MeasurementRepository(session)
        return await repo.delete_by_id(measurement_id)

    async def delete_all(self, session: AsyncSession) -> int:
        """Delete all measurements.

        Args:
            session: Database session.

        Returns:
            Number of deleted measurements.
        """
        repo = MeasurementRepository(session)
        return await repo.delete_all()

    async def count(self, session: AsyncSession) -> int:
        """Get total count of measurements.

        Args:
            session: Database session.

        Returns:
            Total number of measurements in the database.
        """
        repo = MeasurementRepository(session)
        return await repo.count()

    async def get_all_in_range(
        self,
        session: AsyncSession,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[Measurement]:
        """Get all measurements within a date range.

        Args:
            session: Database session.
            start_date: Optional start date filter.
            end_date: Optional end date filter.

        Returns:
            List of measurements in the specified range.
        """
        repo = MeasurementRepository(session)
        return await repo.get_all_in_range(start_date, end_date)


measurement_service = MeasurementService()
