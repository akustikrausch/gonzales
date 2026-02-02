import math
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.db.repository import MeasurementRepository
from gonzales.schemas.statistics import PercentileValues, SpeedStatistics, StatisticsOut


def _percentile(sorted_values: list[float], p: float) -> float:
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_values[int(k)]
    return sorted_values[f] * (c - k) + sorted_values[c] * (k - f)


def _stddev(values: list[float], mean: float) -> float:
    if len(values) < 2:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def _compute_speed_stats(values: list[float]) -> SpeedStatistics | None:
    if not values:
        return None
    sorted_vals = sorted(values)
    avg = sum(sorted_vals) / len(sorted_vals)
    return SpeedStatistics(
        min=sorted_vals[0],
        max=sorted_vals[-1],
        avg=round(avg, 2),
        median=round(_percentile(sorted_vals, 50), 2),
        stddev=round(_stddev(sorted_vals, avg), 2),
        percentiles=PercentileValues(
            p5=round(_percentile(sorted_vals, 5), 2),
            p25=round(_percentile(sorted_vals, 25), 2),
            p50=round(_percentile(sorted_vals, 50), 2),
            p75=round(_percentile(sorted_vals, 75), 2),
            p95=round(_percentile(sorted_vals, 95), 2),
        ),
    )


class StatisticsService:
    async def get_statistics(
        self,
        session: AsyncSession,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> StatisticsOut:
        repo = MeasurementRepository(session)
        agg = await repo.get_statistics(start_date, end_date)
        measurements = await repo.get_all_in_range(start_date, end_date)

        download_values = [m.download_mbps for m in measurements]
        upload_values = [m.upload_mbps for m in measurements]
        ping_values = [m.ping_latency_ms for m in measurements]

        return StatisticsOut(
            total_tests=agg["total_tests"] or 0,
            download=_compute_speed_stats(download_values),
            upload=_compute_speed_stats(upload_values),
            ping=_compute_speed_stats(ping_values),
            download_violations=agg["download_violations"] or 0,
            upload_violations=agg["upload_violations"] or 0,
            download_threshold_mbps=settings.download_threshold_mbps,
            upload_threshold_mbps=settings.upload_threshold_mbps,
        )


statistics_service = StatisticsService()
