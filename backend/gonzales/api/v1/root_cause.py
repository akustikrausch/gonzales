"""Root-cause analysis API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.db.session import get_session
from gonzales.schemas.root_cause import (
    RootCauseAnalysis,
    RootCauseRequest,
)
from gonzales.services.root_cause_service import root_cause_service

router = APIRouter(prefix="/root-cause", tags=["root-cause"])


@router.get("/analysis", response_model=RootCauseAnalysis)
async def get_root_cause_analysis(
    days: int = Query(default=30, ge=7, le=90, description="Analysis window in days"),
    min_confidence: float = Query(
        default=0.5, ge=0.0, le=1.0, description="Minimum confidence for fingerprints"
    ),
    session: AsyncSession = Depends(get_session),
) -> RootCauseAnalysis:
    """Get comprehensive root-cause analysis.

    Analyzes measurements, topologies, and outages to identify:
    - Primary and secondary causes of network issues
    - Layer-by-layer health scores
    - Hop-speed correlations (bottleneck detection)
    - Time-based patterns
    - Actionable recommendations
    """
    return await root_cause_service.analyze(
        session=session,
        days=days,
        min_confidence=min_confidence,
    )


@router.post("/analysis", response_model=RootCauseAnalysis)
async def run_root_cause_analysis(
    request: RootCauseRequest,
    session: AsyncSession = Depends(get_session),
) -> RootCauseAnalysis:
    """Run root-cause analysis with custom parameters.

    POST alternative to GET for more complex parameter passing.
    """
    return await root_cause_service.analyze(
        session=session,
        days=request.days,
        min_confidence=request.min_confidence,
    )
