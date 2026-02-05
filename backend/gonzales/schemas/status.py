from datetime import datetime

from pydantic import BaseModel


class SchedulerStatus(BaseModel):
    running: bool
    enabled: bool  # True if running and not paused
    paused: bool  # True if manually paused by user
    next_run_time: datetime | None = None
    interval_minutes: int
    test_in_progress: bool


class SchedulerControlRequest(BaseModel):
    """Request to control scheduler state."""
    enabled: bool


class SchedulerControlResponse(BaseModel):
    """Response after controlling scheduler state."""
    enabled: bool
    paused: bool
    message: str


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


class OutageRecord(BaseModel):
    """Historical outage record."""

    id: int
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: float | None = None
    failure_count: int
    trigger_error: str
    is_active: bool = False

    class Config:
        from_attributes = True


class OutageListResponse(BaseModel):
    """Response for listing outages."""

    items: list[OutageRecord]
    total: int


class OutageStatistics(BaseModel):
    """Aggregated outage statistics."""

    total_outages: int
    total_duration_seconds: float
    avg_duration_seconds: float
    longest_outage_seconds: float
    uptime_pct: float
