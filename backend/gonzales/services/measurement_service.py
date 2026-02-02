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
from gonzales.services.speedtest_runner import speedtest_runner


class MeasurementService:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._test_in_progress = False
        self._last_manual_trigger: float = 0.0

    @property
    def test_in_progress(self) -> bool:
        return self._test_in_progress

    def _check_cooldown(self) -> None:
        elapsed = time.time() - self._last_manual_trigger
        remaining = settings.manual_trigger_cooldown_seconds - elapsed
        if remaining > 0:
            raise CooldownError(int(remaining))

    def _create_measurement_from_result(
        self, raw: SpeedtestRawResult, raw_json: str
    ) -> Measurement:
        return Measurement(
            download_bps=raw.download_bps,
            upload_bps=raw.upload_bps,
            download_mbps=raw.download_mbps,
            upload_mbps=raw.upload_mbps,
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
            result_id=raw.result.id,
            result_url=raw.result.url,
            raw_json=raw_json,
            below_download_threshold=raw.download_mbps < settings.download_threshold_mbps,
            below_upload_threshold=raw.upload_mbps < settings.upload_threshold_mbps,
        )

    async def run_test(self, session: AsyncSession, manual: bool = False) -> Measurement:
        if manual:
            self._check_cooldown()

        if self._lock.locked():
            raise TestInProgressError()

        async with self._lock:
            self._test_in_progress = True
            try:
                raw_result = await speedtest_runner.run()
                raw_json = json.dumps(raw_result.model_dump(), default=str)

                measurement = self._create_measurement_from_result(raw_result, raw_json)
                repo = MeasurementRepository(session)
                saved = await repo.create(measurement)

                if saved.below_download_threshold or saved.below_upload_threshold:
                    logger.warning(
                        "Threshold violation: DL=%.1f Mbps (threshold %.1f), "
                        "UL=%.1f Mbps (threshold %.1f)",
                        saved.download_mbps,
                        settings.download_threshold_mbps,
                        saved.upload_mbps,
                        settings.upload_threshold_mbps,
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
        repo = MeasurementRepository(session)
        return await repo.get_paginated(page, page_size, start_date, end_date, sort_by, sort_order)

    async def get_latest(self, session: AsyncSession) -> Measurement | None:
        repo = MeasurementRepository(session)
        return await repo.get_latest()

    async def get_by_id(self, session: AsyncSession, measurement_id: int) -> Measurement | None:
        repo = MeasurementRepository(session)
        return await repo.get_by_id(measurement_id)

    async def delete_by_id(self, session: AsyncSession, measurement_id: int) -> bool:
        repo = MeasurementRepository(session)
        return await repo.delete_by_id(measurement_id)

    async def count(self, session: AsyncSession) -> int:
        repo = MeasurementRepository(session)
        return await repo.count()


measurement_service = MeasurementService()
