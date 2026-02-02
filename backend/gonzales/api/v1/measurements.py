from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.core.exceptions import MeasurementNotFoundError
from gonzales.schemas.measurement import MeasurementOut, MeasurementPage
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get("", response_model=MeasurementPage)
async def list_measurements(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    items, total = await measurement_service.get_paginated(
        session, page, page_size, start_date, end_date
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


@router.delete("/{measurement_id}")
async def delete_measurement(measurement_id: int, session: AsyncSession = Depends(get_db)):
    deleted = await measurement_service.delete_by_id(session, measurement_id)
    if not deleted:
        raise MeasurementNotFoundError(measurement_id)
    return {"detail": "Measurement deleted"}
