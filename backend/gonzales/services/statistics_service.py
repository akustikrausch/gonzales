import math
from collections import defaultdict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.db.repository import MeasurementRepository
from gonzales.schemas.statistics import (
    DayOfWeekAverage,
    EnhancedStatisticsOut,
    HourlyAverage,
    PercentileValues,
    ReliabilityScore,
    ServerStats,
    SlaCompliance,
    SpeedStatistics,
    StatisticsOut,
    TrendAnalysis,
    TrendPoint,
)

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


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


def _compute_hourly(measurements: list) -> list[HourlyAverage]:
    buckets: dict[int, list] = defaultdict(list)
    for m in measurements:
        hour = m.timestamp.hour
        buckets[hour].append(m)

    result = []
    for hour in range(24):
        items = buckets.get(hour, [])
        if not items:
            result.append(HourlyAverage(hour=hour, avg_download_mbps=0, avg_upload_mbps=0, avg_ping_ms=0, count=0))
        else:
            result.append(HourlyAverage(
                hour=hour,
                avg_download_mbps=round(sum(m.download_mbps for m in items) / len(items), 2),
                avg_upload_mbps=round(sum(m.upload_mbps for m in items) / len(items), 2),
                avg_ping_ms=round(sum(m.ping_latency_ms for m in items) / len(items), 2),
                count=len(items),
            ))
    return result


def _compute_daily(measurements: list) -> list[DayOfWeekAverage]:
    buckets: dict[int, list] = defaultdict(list)
    for m in measurements:
        day = m.timestamp.weekday()
        buckets[day].append(m)

    result = []
    for day in range(7):
        items = buckets.get(day, [])
        if not items:
            result.append(DayOfWeekAverage(
                day=day, day_name=DAY_NAMES[day],
                avg_download_mbps=0, avg_upload_mbps=0, avg_ping_ms=0, count=0,
            ))
        else:
            result.append(DayOfWeekAverage(
                day=day,
                day_name=DAY_NAMES[day],
                avg_download_mbps=round(sum(m.download_mbps for m in items) / len(items), 2),
                avg_upload_mbps=round(sum(m.upload_mbps for m in items) / len(items), 2),
                avg_ping_ms=round(sum(m.ping_latency_ms for m in items) / len(items), 2),
                count=len(items),
            ))
    return result


def _linear_regression(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 2:
        return 0.0
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    if den == 0:
        return 0.0
    return num / den


def _compute_trend(measurements: list) -> TrendAnalysis:
    if not measurements:
        return TrendAnalysis(points=[], download_slope=0, upload_slope=0, ping_slope=0)

    sorted_m = sorted(measurements, key=lambda m: m.timestamp)
    base_ts = sorted_m[0].timestamp.timestamp()
    xs = [(m.timestamp.timestamp() - base_ts) / 86400 for m in sorted_m]

    dl_ys = [m.download_mbps for m in sorted_m]
    ul_ys = [m.upload_mbps for m in sorted_m]
    ping_ys = [m.ping_latency_ms for m in sorted_m]

    points = [
        TrendPoint(
            timestamp=m.timestamp.isoformat(),
            download_mbps=m.download_mbps,
            upload_mbps=m.upload_mbps,
            ping_ms=m.ping_latency_ms,
        )
        for m in sorted_m
    ]

    return TrendAnalysis(
        points=points,
        download_slope=round(_linear_regression(xs, dl_ys), 4),
        upload_slope=round(_linear_regression(xs, ul_ys), 4),
        ping_slope=round(_linear_regression(xs, ping_ys), 4),
    )


def _compute_sla(measurements: list) -> SlaCompliance:
    total = len(measurements)
    if total == 0:
        return SlaCompliance(
            total_tests=0, download_compliant=0, upload_compliant=0,
            download_compliance_pct=0, upload_compliance_pct=0,
        )

    dl_ok = sum(1 for m in measurements if m.download_mbps >= settings.download_threshold_mbps)
    ul_ok = sum(1 for m in measurements if m.upload_mbps >= settings.upload_threshold_mbps)

    return SlaCompliance(
        total_tests=total,
        download_compliant=dl_ok,
        upload_compliant=ul_ok,
        download_compliance_pct=round(dl_ok / total * 100, 1),
        upload_compliance_pct=round(ul_ok / total * 100, 1),
    )


def _compute_reliability(measurements: list) -> ReliabilityScore:
    if len(measurements) < 2:
        return ReliabilityScore(download_cv=0, upload_cv=0, ping_cv=0, composite_score=100)

    dl = [m.download_mbps for m in measurements]
    ul = [m.upload_mbps for m in measurements]
    pg = [m.ping_latency_ms for m in measurements]

    def cv(vals: list[float]) -> float:
        mean = sum(vals) / len(vals)
        if mean == 0:
            return 0
        std = _stddev(vals, mean)
        return std / mean

    dl_cv = cv(dl)
    ul_cv = cv(ul)
    pg_cv = cv(pg)
    avg_cv = (dl_cv + ul_cv + pg_cv) / 3
    score = max(0, min(100, round((1 - avg_cv) * 100, 1)))

    return ReliabilityScore(
        download_cv=round(dl_cv, 4),
        upload_cv=round(ul_cv, 4),
        ping_cv=round(pg_cv, 4),
        composite_score=score,
    )


def _compute_by_server(measurements: list) -> list[ServerStats]:
    buckets: dict[int, list] = defaultdict(list)
    for m in measurements:
        buckets[m.server_id].append(m)

    result = []
    for sid, items in sorted(buckets.items()):
        result.append(ServerStats(
            server_id=sid,
            server_name=items[0].server_name,
            server_location=items[0].server_location,
            test_count=len(items),
            avg_download_mbps=round(sum(m.download_mbps for m in items) / len(items), 2),
            avg_upload_mbps=round(sum(m.upload_mbps for m in items) / len(items), 2),
            avg_ping_ms=round(sum(m.ping_latency_ms for m in items) / len(items), 2),
        ))
    return result


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

    async def get_enhanced_statistics(
        self,
        session: AsyncSession,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> EnhancedStatisticsOut:
        basic = await self.get_statistics(session, start_date, end_date)

        repo = MeasurementRepository(session)
        measurements = await repo.get_all_in_range(start_date, end_date)

        return EnhancedStatisticsOut(
            basic=basic,
            hourly=_compute_hourly(measurements),
            daily=_compute_daily(measurements),
            trend=_compute_trend(measurements),
            sla=_compute_sla(measurements),
            reliability=_compute_reliability(measurements),
            by_server=_compute_by_server(measurements),
        )


statistics_service = StatisticsService()
