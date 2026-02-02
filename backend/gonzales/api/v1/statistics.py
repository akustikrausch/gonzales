from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.schemas.statistics import EnhancedStatisticsOut, StatisticsOut
from gonzales.services.statistics_service import statistics_service

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("", response_model=StatisticsOut)
async def get_statistics(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    return await statistics_service.get_statistics(session, start_date, end_date)


@router.get("/enhanced", response_model=EnhancedStatisticsOut)
async def get_enhanced_statistics(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    return await statistics_service.get_enhanced_statistics(session, start_date, end_date)
