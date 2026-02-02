from datetime import datetime

from pydantic import BaseModel


class SchedulerStatus(BaseModel):
    running: bool
    next_run_time: datetime | None = None
    interval_minutes: int
    test_in_progress: bool


class StatusOut(BaseModel):
    scheduler: SchedulerStatus
    last_test_time: datetime | None = None
    total_measurements: int
    total_failures: int
    uptime_seconds: float
    db_size_bytes: int
