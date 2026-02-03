from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db, require_api_key
from gonzales.core.exceptions import MeasurementNotFoundError
from gonzales.schemas.measurement import MeasurementOut, MeasurementPage, SortField, SortOrder
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get("", response_model=MeasurementPage)
async def list_measurements(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    sort_by: SortField = Query(default=SortField.timestamp),
    sort_order: SortOrder = Query(default=SortOrder.desc),
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


@router.get("/latest", response_model=MeasurementOut | None)
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
async def delete_all_measurements(
    confirm: bool = Query(..., description="Must be true to confirm deletion"),
    session: AsyncSession = Depends(get_db),
):
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required: set confirm=true")
    count = await measurement_service.delete_all(session)
    return {"deleted": count, "message": f"Deleted {count} measurements"}


@router.delete("/{measurement_id}", dependencies=[Depends(require_api_key)])
async def delete_measurement(measurement_id: int, session: AsyncSession = Depends(get_db)):
    deleted = await measurement_service.delete_by_id(session, measurement_id)
    if not deleted:
        raise MeasurementNotFoundError(measurement_id)
    return {"detail": "Measurement deleted"}
