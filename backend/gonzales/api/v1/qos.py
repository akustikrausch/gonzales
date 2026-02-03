"""QoS (Quality of Service) API endpoints."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.schemas.qos import QosHistoryOut, QosOverview, QosProfileOut
from gonzales.services.measurement_service import measurement_service
from gonzales.services.qos_service import qos_service

router = APIRouter(prefix="/qos", tags=["qos"])


@router.get("/profiles", response_model=list[QosProfileOut])
async def get_qos_profiles():
    """Get all available QoS profiles with their requirements."""
    return qos_service.get_all_profiles()


@router.get("/current", response_model=QosOverview | None)
async def get_current_qos_status(session: AsyncSession = Depends(get_db)):
    """Get QoS status based on the most recent measurement."""
    measurement = await measurement_service.get_latest(session)
    if measurement is None:
        return None
    return qos_service.evaluate_all_profiles(measurement)


@router.get("/evaluate/{measurement_id}", response_model=QosOverview)
async def evaluate_measurement(
    measurement_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Evaluate a specific measurement against all QoS profiles."""
    measurement = await measurement_service.get_by_id(session, measurement_id)
    if measurement is None:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return qos_service.evaluate_all_profiles(measurement)


@router.get("/history/{profile_id}", response_model=QosHistoryOut)
async def get_qos_history(
    profile_id: str,
    days: int = Query(default=7, ge=1, le=90),
    session: AsyncSession = Depends(get_db),
):
    """Get QoS compliance history for a specific profile."""
    start_date = datetime.now() - timedelta(days=days)
    measurements = await measurement_service.get_all_in_range(session, start_date, None)

    result = qos_service.get_profile_history(measurements, profile_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    return result
