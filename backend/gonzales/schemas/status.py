from datetime import datetime

from pydantic import BaseModel


class SchedulerStatus(BaseModel):
    running: bool
    next_run_time: datetime | None = None
    interval_minutes: int
    test_in_progress: bool


class OutageStatus(BaseModel):
    """Current internet outage status."""

    outage_active: bool = False
    outage_started_at: datetime | None = None
    consecutive_failures: int = 0
    last_failure_message: str = ""


class StatusOut(BaseModel):
    version: str
    scheduler: SchedulerStatus
    outage: OutageStatus
    last_test_time: datetime | None = None
    total_measurements: int
    total_failures: int
    uptime_seconds: float
    db_size_bytes: int
