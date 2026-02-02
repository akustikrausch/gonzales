from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.schemas.measurement import MeasurementOut
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/speedtest", tags=["speedtest"])


@router.post("/trigger", response_model=MeasurementOut)
async def trigger_speedtest(session: AsyncSession = Depends(get_db)):
    m = await measurement_service.run_test(session, manual=True)
    return MeasurementOut.model_validate(m)
