import os
import time

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.config import settings
from gonzales.db.models import TestFailure
from gonzales.schemas.status import (
    OutageStatus,
    SchedulerControlRequest,
    SchedulerControlResponse,
    SchedulerStatus,
    StatusOut,
)
from gonzales.services.measurement_service import measurement_service
from gonzales.services.scheduler_service import scheduler_service
from gonzales.version import __version__

router = APIRouter(prefix="/status", tags=["status"])

_start_time = time.time()


@router.get("", response_model=StatusOut)
async def get_status(session: AsyncSession = Depends(get_db)):
    latest = await measurement_service.get_latest(session)
    total_measurements = await measurement_service.count(session)

    failure_count_result = await session.execute(
        select(func.count(TestFailure.id))
    )
    total_failures = failure_count_result.scalar_one()

    db_size = 0
    if settings.db_path.exists():
        db_size = os.path.getsize(settings.db_path)

    # Get outage status from scheduler
    outage_data = scheduler_service.outage_status

    return StatusOut(
        version=__version__,
        scheduler=SchedulerStatus(
            running=scheduler_service.running,
            enabled=scheduler_service.enabled,
            paused=scheduler_service.paused,
            next_run_time=scheduler_service.next_run_time if scheduler_service.enabled else None,
            interval_minutes=settings.test_interval_minutes,
            test_in_progress=measurement_service.test_in_progress or scheduler_service.test_in_progress,
        ),
        outage=OutageStatus(
            outage_active=outage_data["outage_active"],
            outage_started_at=outage_data["outage_started_at"],
            consecutive_failures=outage_data["consecutive_failures"],
            last_failure_message=outage_data["last_failure_message"],
        ),
        last_test_time=latest.timestamp if latest else None,
        total_measurements=total_measurements,
        total_failures=total_failures,
        uptime_seconds=round(time.time() - _start_time, 1),
        db_size_bytes=db_size,
    )


@router.put("/scheduler", response_model=SchedulerControlResponse)
async def set_scheduler_enabled(request: SchedulerControlRequest):
    """Enable or disable the scheduler.

    When disabled (paused), scheduled speed tests will be skipped.
    Manual tests can still be triggered via the /speedtest/trigger endpoint.
    """
    changed = scheduler_service.set_enabled(request.enabled)
    action = "enabled" if request.enabled else "disabled"
    message = f"Scheduler {action}" if changed else f"Scheduler already {action}"

    return SchedulerControlResponse(
        enabled=scheduler_service.enabled,
        paused=scheduler_service.paused,
        message=message,
    )
