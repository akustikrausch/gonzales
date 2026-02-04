from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.db.repository import OutageRepository
from gonzales.schemas.status import OutageListResponse, OutageRecord, OutageStatistics

router = APIRouter(prefix="/outages", tags=["outages"])


@router.get("", response_model=OutageListResponse)
async def list_outages(
    start_date: datetime | None = Query(None, description="Filter by start date"),
    end_date: datetime | None = Query(None, description="Filter by end date"),
    session: AsyncSession = Depends(get_db),
):
    """Get list of historical outages."""
    repo = OutageRepository(session)
    outages = await repo.get_in_range(start_date, end_date)

    items = [
        OutageRecord(
            id=o.id,
            started_at=o.started_at,
            ended_at=o.ended_at,
            duration_seconds=o.duration_seconds,
            failure_count=o.failure_count,
            trigger_error=o.trigger_error,
            is_active=o.ended_at is None,
        )
        for o in outages
    ]

    return OutageListResponse(items=items, total=len(items))


@router.get("/statistics", response_model=OutageStatistics)
async def get_outage_statistics(
    start_date: datetime | None = Query(None, description="Filter by start date"),
    end_date: datetime | None = Query(None, description="Filter by end date"),
    session: AsyncSession = Depends(get_db),
):
    """Get aggregated outage statistics."""
    repo = OutageRepository(session)
    stats = await repo.get_statistics(start_date, end_date)

    return OutageStatistics(
        total_outages=stats["total_outages"],
        total_duration_seconds=stats["total_duration_seconds"],
        avg_duration_seconds=stats["avg_duration_seconds"],
        longest_outage_seconds=stats["longest_outage_seconds"],
        uptime_pct=stats["uptime_pct"],
    )
