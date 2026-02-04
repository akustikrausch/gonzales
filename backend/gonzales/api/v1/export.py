from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.db.repository import MeasurementRepository
from gonzales.services.export_service import export_service
from gonzales.services.statistics_service import statistics_service

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/csv")
@limiter.limit(RATE_LIMITS["export"])
async def export_csv(
    request: Request,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    repo = MeasurementRepository(session)
    measurements = await repo.get_all_in_range(start_date, end_date)
    csv_content = export_service.generate_csv(measurements)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=gonzales_export.csv"},
    )


@router.get("/pdf")
@limiter.limit(RATE_LIMITS["export"])
async def export_pdf(
    request: Request,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    repo = MeasurementRepository(session)
    measurements = await repo.get_all_in_range(start_date, end_date)
    stats_out = await statistics_service.get_statistics(session, start_date, end_date)

    stats_dict = None
    if stats_out.total_tests > 0:
        stats_dict = {}
        for key in ("download", "upload", "ping"):
            s = getattr(stats_out, key)
            if s:
                stats_dict[key] = {
                    "min": s.min,
                    "max": s.max,
                    "avg": s.avg,
                    "median": s.median,
                }

    pdf_content = export_service.generate_pdf(measurements, stats_dict, start_date, end_date)
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=gonzales_report.pdf"},
    )


@router.get("/report/professional")
@limiter.limit(RATE_LIMITS["export"])
async def export_professional_report(
    request: Request,
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    """Generate a professional compliance report with detailed analysis."""
    repo = MeasurementRepository(session)
    measurements = await repo.get_all_in_range(start_date, end_date)

    # Get enhanced statistics for the report
    enhanced = await statistics_service.get_enhanced_statistics(session, start_date, end_date)

    # Convert to dict for the export service
    enhanced_dict = None
    if enhanced:
        enhanced_dict = {
            "isp_score": enhanced.isp_score.model_dump() if enhanced.isp_score else None,
            "time_periods": enhanced.time_periods.model_dump() if enhanced.time_periods else None,
            "sla": enhanced.sla.model_dump() if enhanced.sla else None,
        }

    pdf_content = export_service.generate_professional_report(
        measurements, enhanced_dict, start_date, end_date
    )
    filename = f"gonzales_compliance_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
