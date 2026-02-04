from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db, require_api_key
from gonzales.core.exceptions import MeasurementNotFoundError
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.schemas.measurement import MeasurementOut, MeasurementPage, SortField, SortOrder
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get(
    "",
    response_model=MeasurementPage,
    summary="List Speed Test Measurements",
    description="""
    Retrieve paginated speed test history with optional filtering and sorting.

    **Use Cases:**
    - Display measurement history in a dashboard
    - Export data for analysis
    - Filter by date range for specific periods

    **Sorting Options:**
    - `timestamp` (default): Sort by test time
    - `download_mbps`: Sort by download speed
    - `upload_mbps`: Sort by upload speed
    - `ping_latency_ms`: Sort by latency

    **Example:**
    ```
    GET /measurements?page=1&page_size=50&sort_by=download_mbps&sort_order=desc
    ```
    """
)
async def list_measurements(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page (max 100)"),
    start_date: datetime | None = Query(default=None, description="Filter: start date (ISO format)"),
    end_date: datetime | None = Query(default=None, description="Filter: end date (ISO format)"),
    sort_by: SortField = Query(default=SortField.timestamp, description="Field to sort by"),
    sort_order: SortOrder = Query(default=SortOrder.desc, description="Sort direction"),
    session: AsyncSession = Depends(get_db),
):
    items, total = await measurement_service.get_paginated(
        session, page, page_size, start_date, end_date, sort_by.value, sort_order.value
    )
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return MeasurementPage(
        items=[MeasurementOut.model_validate(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get(
    "/latest",
    response_model=MeasurementOut | None,
    summary="Get Latest Speed Test",
    description="""
    Returns the most recent speed test measurement.

    **Use Cases:**
    - Quick status check of current internet speed
    - Dashboard widgets showing latest result
    - AI agents checking connection quality

    **Returns:**
    - Full measurement data if tests exist
    - `null` if no tests have been run yet

    **Response includes:**
    - Download/upload speeds (Mbps and bps)
    - Ping latency and jitter
    - Server information
    - Threshold compliance status
    """,
    response_description="Latest measurement or null if no tests exist"
)
async def get_latest_measurement(session: AsyncSession = Depends(get_db)):
    m = await measurement_service.get_latest(session)
    if m is None:
        return None
    return MeasurementOut.model_validate(m)


@router.get("/{measurement_id}", response_model=MeasurementOut)
async def get_measurement(measurement_id: int, session: AsyncSession = Depends(get_db)):
    m = await measurement_service.get_by_id(session, measurement_id)
    if m is None:
        raise MeasurementNotFoundError(measurement_id)
    return MeasurementOut.model_validate(m)


@router.delete("/all", dependencies=[Depends(require_api_key)])
@limiter.limit(RATE_LIMITS["delete"])
async def delete_all_measurements(
    request: Request,
    confirm: bool = Query(..., description="Must be true to confirm deletion"),
    session: AsyncSession = Depends(get_db),
):
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required: set confirm=true")
    count = await measurement_service.delete_all(session)
    return {"deleted": count, "message": f"Deleted {count} measurements"}


@router.delete("/{measurement_id}", dependencies=[Depends(require_api_key)])
@limiter.limit(RATE_LIMITS["delete"])
async def delete_measurement(
    request: Request, measurement_id: int, session: AsyncSession = Depends(get_db)
):
    deleted = await measurement_service.delete_by_id(session, measurement_id)
    if not deleted:
        raise MeasurementNotFoundError(measurement_id)
    return {"detail": "Measurement deleted"}
