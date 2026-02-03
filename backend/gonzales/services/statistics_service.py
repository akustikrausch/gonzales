import math
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.db.repository import MeasurementRepository
from gonzales.schemas.statistics import (
    AnomalyPoint,
    BestWorstTimes,
    CorrelationMatrix,
    CorrelationPair,
    DayOfWeekAverage,
    DegradationAlert,
    EnhancedStatisticsOut,
    HourlyAverage,
    IspScore,
    IspScoreBreakdown,
    PeakOffPeakAnalysis,
    PercentileValues,
    PeriodStats,
    PredictionPoint,
    PredictiveTrend,
    ReliabilityScore,
    ServerStats,
    SlaCompliance,
    SpeedStatistics,
    StatisticsOut,
    TimePeriodAnalysis,
    TimePeriodStats,
    TimeWindowResult,
    TrendAnalysis,
    TrendPoint,
)

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
HOUR_LABELS = [f"{h:02d}:00" for h in range(24)]


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


def _linear_regression(xs: list[float], ys: list[float]) -> tuple[float, float]:
    """Returns (slope, intercept)."""
    n = len(xs)
    if n < 2:
        return 0.0, 0.0
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    if den == 0:
        return 0.0, mean_y
    slope = num / den
    intercept = mean_y - slope * mean_x
    return slope, intercept


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
        download_slope=round(_linear_regression(xs, dl_ys)[0], 4),
        upload_slope=round(_linear_regression(xs, ul_ys)[0], 4),
        ping_slope=round(_linear_regression(xs, ping_ys)[0], 4),
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


# --- Phase 6: Innovative Statistics ---


def _detect_anomalies(measurements: list, threshold: float = 2.0) -> list[AnomalyPoint]:
    """Flag measurements where any metric deviates >threshold stddevs from mean."""
    if len(measurements) < 5:
        return []

    dl = [m.download_mbps for m in measurements]
    ul = [m.upload_mbps for m in measurements]
    pg = [m.ping_latency_ms for m in measurements]

    metrics = [
        ("download_mbps", dl, lambda m: m.download_mbps),
        ("upload_mbps", ul, lambda m: m.upload_mbps),
        ("ping_ms", pg, lambda m: m.ping_latency_ms),
    ]

    anomalies = []
    for name, values, getter in metrics:
        mean = sum(values) / len(values)
        std = _stddev(values, mean)
        if std == 0:
            continue
        for m in measurements:
            val = getter(m)
            z = abs(val - mean) / std
            if z > threshold:
                anomalies.append(AnomalyPoint(
                    timestamp=m.timestamp.isoformat(),
                    metric=name,
                    value=round(val, 2),
                    mean=round(mean, 2),
                    stddev=round(std, 2),
                    z_score=round(z, 2),
                ))

    anomalies.sort(key=lambda a: a.z_score, reverse=True)
    return anomalies


def _compute_peak_offpeak(measurements: list) -> PeakOffPeakAnalysis | None:
    """Analyze performance by time period: peak (8-18), offpeak (18-23), night (23-8)."""
    if not measurements:
        return None

    periods: dict[str, list] = {"peak": [], "offpeak": [], "night": []}
    for m in measurements:
        h = m.timestamp.hour
        if 8 <= h < 18:
            periods["peak"].append(m)
        elif 18 <= h < 23:
            periods["offpeak"].append(m)
        else:
            periods["night"].append(m)

    def make_stats(label: str, hours: str, items: list) -> PeriodStats:
        if not items:
            return PeriodStats(label=label, hours=hours, avg_download_mbps=0, avg_upload_mbps=0, avg_ping_ms=0, count=0)
        return PeriodStats(
            label=label,
            hours=hours,
            avg_download_mbps=round(sum(m.download_mbps for m in items) / len(items), 2),
            avg_upload_mbps=round(sum(m.upload_mbps for m in items) / len(items), 2),
            avg_ping_ms=round(sum(m.ping_latency_ms for m in items) / len(items), 2),
            count=len(items),
        )

    peak = make_stats("Peak", "08:00-18:00", periods["peak"])
    offpeak = make_stats("Off-Peak", "18:00-23:00", periods["offpeak"])
    night = make_stats("Night", "23:00-08:00", periods["night"])

    # Determine best/worst by download speed
    ranked = sorted(
        [("Peak", peak), ("Off-Peak", offpeak), ("Night", night)],
        key=lambda x: x[1].avg_download_mbps,
        reverse=True,
    )
    # Filter out periods with no data
    ranked = [(name, s) for name, s in ranked if s.count > 0]
    best = ranked[0][0] if ranked else "N/A"
    worst = ranked[-1][0] if ranked else "N/A"

    return PeakOffPeakAnalysis(peak=peak, offpeak=offpeak, night=night, best_period=best, worst_period=worst)


# Time period definitions: (start_hour, end_hour, label, period_key)
TIME_PERIODS = [
    (6, 10, "Morning (6-10)", "morning"),
    (10, 14, "Midday (10-14)", "midday"),
    (14, 18, "Afternoon (14-18)", "afternoon"),
    (18, 22, "Evening (18-22)", "evening"),
    (22, 6, "Night (22-6)", "night"),  # wraps around midnight
]


def _compute_time_periods(measurements: list) -> TimePeriodAnalysis | None:
    """Analyze performance by 5 time periods throughout the day."""
    if not measurements:
        return None

    # Calculate effective thresholds with tolerance
    tolerance_factor = 1 - (settings.tolerance_percent / 100)
    effective_dl_threshold = settings.download_threshold_mbps * tolerance_factor
    effective_ul_threshold = settings.upload_threshold_mbps * tolerance_factor

    # Group measurements by time period
    buckets: dict[str, list] = {p[3]: [] for p in TIME_PERIODS}

    for m in measurements:
        h = m.timestamp.hour
        for start, end, _, key in TIME_PERIODS:
            if key == "night":
                # Night period wraps: 22-23 and 0-5
                if h >= 22 or h < 6:
                    buckets[key].append(m)
                    break
            elif start <= h < end:
                buckets[key].append(m)
                break

    results = []
    for start, end, label, key in TIME_PERIODS:
        items = buckets[key]
        if key == "night":
            hours_str = "22:00-06:00"
        else:
            hours_str = f"{start:02d}:00-{end:02d}:00"

        if not items:
            results.append(TimePeriodStats(
                period=key,
                period_label=label,
                hours=hours_str,
                avg_download_mbps=0,
                avg_upload_mbps=0,
                avg_ping_ms=0,
                test_count=0,
                compliance_pct=0,
            ))
        else:
            avg_dl = sum(m.download_mbps for m in items) / len(items)
            avg_ul = sum(m.upload_mbps for m in items) / len(items)
            avg_ping = sum(m.ping_latency_ms for m in items) / len(items)

            # Calculate compliance (meeting both thresholds)
            compliant = sum(
                1 for m in items
                if m.download_mbps >= effective_dl_threshold
                and m.upload_mbps >= effective_ul_threshold
            )
            compliance_pct = (compliant / len(items)) * 100 if items else 0

            results.append(TimePeriodStats(
                period=key,
                period_label=label,
                hours=hours_str,
                avg_download_mbps=round(avg_dl, 2),
                avg_upload_mbps=round(avg_ul, 2),
                avg_ping_ms=round(avg_ping, 2),
                test_count=len(items),
                compliance_pct=round(compliance_pct, 1),
            ))

    # Find best/worst periods by download speed (among periods with data)
    active = [r for r in results if r.test_count > 0]
    if active:
        best = max(active, key=lambda r: r.avg_download_mbps).period
        worst = min(active, key=lambda r: r.avg_download_mbps).period
    else:
        best = "N/A"
        worst = "N/A"

    return TimePeriodAnalysis(periods=results, best_period=best, worst_period=worst)


def _compute_isp_score(measurements: list) -> IspScore | None:
    """Compute a composite ISP performance score (0-100)."""
    if len(measurements) < 3:
        return None

    dl = [m.download_mbps for m in measurements]
    ul = [m.upload_mbps for m in measurements]
    pg = [m.ping_latency_ms for m in measurements]

    dl_avg = sum(dl) / len(dl)
    ul_avg = sum(ul) / len(ul)
    pg_avg = sum(pg) / len(pg)

    # Speed score: based on how close to thresholds (100 = at or above threshold)
    dl_thresh = settings.download_threshold_mbps or 100
    ul_thresh = settings.upload_threshold_mbps or 50
    dl_ratio = min(dl_avg / dl_thresh, 1.5)
    ul_ratio = min(ul_avg / ul_thresh, 1.5)
    speed_score = min(100, ((dl_ratio + ul_ratio) / 2) * 100)

    # Latency score: <10ms = 100, >100ms = 0, linear between
    latency_score = max(0, min(100, (100 - pg_avg) / 0.9))

    # Reliability: based on coefficient of variation
    def cv(vals: list[float]) -> float:
        mean = sum(vals) / len(vals)
        if mean == 0:
            return 0
        return _stddev(vals, mean) / mean

    avg_cv = (cv(dl) + cv(ul) + cv(pg)) / 3
    reliability_score = max(0, min(100, (1 - avg_cv * 2) * 100))

    # Consistency: % of tests meeting thresholds
    dl_ok = sum(1 for v in dl if v >= settings.download_threshold_mbps) / len(dl)
    ul_ok = sum(1 for v in ul if v >= settings.upload_threshold_mbps) / len(ul)
    consistency_score = ((dl_ok + ul_ok) / 2) * 100

    # Weighted composite
    composite = (
        speed_score * 0.35
        + latency_score * 0.20
        + reliability_score * 0.25
        + consistency_score * 0.20
    )
    composite = round(max(0, min(100, composite)), 1)

    # Letter grade
    if composite >= 90:
        grade = "A+"
    elif composite >= 80:
        grade = "A"
    elif composite >= 70:
        grade = "B"
    elif composite >= 60:
        grade = "C"
    elif composite >= 50:
        grade = "D"
    else:
        grade = "F"

    return IspScore(
        composite=composite,
        grade=grade,
        breakdown=IspScoreBreakdown(
            speed_score=round(speed_score, 1),
            reliability_score=round(reliability_score, 1),
            latency_score=round(latency_score, 1),
            consistency_score=round(consistency_score, 1),
        ),
    )


def _find_best_worst_times(hourly: list[HourlyAverage]) -> BestWorstTimes | None:
    """Identify the best and worst hours for each metric."""
    active = [h for h in hourly if h.count > 0]
    if not active:
        return None

    def make_result(h: HourlyAverage) -> TimeWindowResult:
        return TimeWindowResult(
            hour=h.hour,
            label=HOUR_LABELS[h.hour],
            avg_download_mbps=h.avg_download_mbps,
            avg_upload_mbps=h.avg_upload_mbps,
            avg_ping_ms=h.avg_ping_ms,
        )

    best_dl = max(active, key=lambda h: h.avg_download_mbps)
    worst_dl = min(active, key=lambda h: h.avg_download_mbps)
    best_ul = max(active, key=lambda h: h.avg_upload_mbps)
    worst_ul = min(active, key=lambda h: h.avg_upload_mbps)
    best_pg = min(active, key=lambda h: h.avg_ping_ms)  # lower ping is better
    worst_pg = max(active, key=lambda h: h.avg_ping_ms)

    return BestWorstTimes(
        best_download=make_result(best_dl),
        worst_download=make_result(worst_dl),
        best_upload=make_result(best_ul),
        worst_upload=make_result(worst_ul),
        best_ping=make_result(best_pg),
        worst_ping=make_result(worst_pg),
    )


def _pearson(xs: list[float], ys: list[float]) -> float:
    """Compute Pearson correlation coefficient."""
    n = len(xs)
    if n < 3:
        return 0.0
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))
    if den_x == 0 or den_y == 0:
        return 0.0
    return num / (den_x * den_y)


def _compute_correlations(measurements: list) -> CorrelationMatrix | None:
    """Compute pairwise Pearson correlations between all metrics."""
    if len(measurements) < 5:
        return None

    metrics_data = {
        "download": [m.download_mbps for m in measurements],
        "upload": [m.upload_mbps for m in measurements],
        "ping": [m.ping_latency_ms for m in measurements],
        "jitter": [m.ping_jitter_ms for m in measurements],
    }
    metric_names = list(metrics_data.keys())

    pairs = []
    for i, name_a in enumerate(metric_names):
        for j in range(i + 1, len(metric_names)):
            name_b = metric_names[j]
            coeff = _pearson(metrics_data[name_a], metrics_data[name_b])
            pairs.append(CorrelationPair(
                metric_a=name_a,
                metric_b=name_b,
                coefficient=round(coeff, 4),
            ))

    return CorrelationMatrix(pairs=pairs, metrics=metric_names)


def _detect_degradation(measurements: list, window: int = 10) -> list[DegradationAlert]:
    """Detect sustained performance drops by comparing recent window to historical average."""
    if len(measurements) < window * 2:
        return []

    sorted_m = sorted(measurements, key=lambda m: m.timestamp)
    recent = sorted_m[-window:]
    historical = sorted_m[:-window]

    alerts = []
    metrics = [
        ("download_mbps", lambda m: m.download_mbps, True),   # higher is better
        ("upload_mbps", lambda m: m.upload_mbps, True),        # higher is better
        ("ping_ms", lambda m: m.ping_latency_ms, False),      # lower is better
    ]

    for name, getter, higher_better in metrics:
        hist_vals = [getter(m) for m in historical]
        recent_vals = [getter(m) for m in recent]
        hist_avg = sum(hist_vals) / len(hist_vals)
        recent_avg = sum(recent_vals) / len(recent_vals)

        if hist_avg == 0:
            continue

        if higher_better:
            drop_pct = ((hist_avg - recent_avg) / hist_avg) * 100
        else:
            drop_pct = ((recent_avg - hist_avg) / hist_avg) * 100

        if drop_pct < 15:
            continue

        if drop_pct >= 40:
            severity = "critical"
        elif drop_pct >= 25:
            severity = "warning"
        else:
            severity = "info"

        direction = "dropped" if higher_better else "increased"
        alerts.append(DegradationAlert(
            metric=name,
            severity=severity,
            description=f"{name} has {direction} by {drop_pct:.1f}% in the last {window} tests",
            current_avg=round(recent_avg, 2),
            historical_avg=round(hist_avg, 2),
            drop_pct=round(drop_pct, 1),
        ))

    return alerts


def _compute_predictions(measurements: list, days_ahead: int = 7) -> PredictiveTrend | None:
    """Project metrics forward using linear regression."""
    if len(measurements) < 10:
        return None

    sorted_m = sorted(measurements, key=lambda m: m.timestamp)
    base_ts = sorted_m[0].timestamp.timestamp()
    xs = [(m.timestamp.timestamp() - base_ts) / 86400 for m in sorted_m]

    dl_slope, dl_intercept = _linear_regression(xs, [m.download_mbps for m in sorted_m])
    ul_slope, ul_intercept = _linear_regression(xs, [m.upload_mbps for m in sorted_m])
    pg_slope, pg_intercept = _linear_regression(xs, [m.ping_latency_ms for m in sorted_m])

    last_ts = sorted_m[-1].timestamp
    last_x = xs[-1]

    points = []
    for d in range(1, days_ahead + 1):
        future_x = last_x + d
        future_ts = last_ts + timedelta(days=d)
        points.append(PredictionPoint(
            timestamp=future_ts.isoformat(),
            download_mbps=round(max(0, dl_slope * future_x + dl_intercept), 2),
            upload_mbps=round(max(0, ul_slope * future_x + ul_intercept), 2),
            ping_ms=round(max(0, pg_slope * future_x + pg_intercept), 2),
        ))

    # Confidence based on data quantity and R-squared-like heuristic
    if len(measurements) >= 50:
        confidence = "high"
    elif len(measurements) >= 20:
        confidence = "medium"
    else:
        confidence = "low"

    return PredictiveTrend(points=points, confidence=confidence)


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

        tolerance_factor = 1 - (settings.tolerance_percent / 100)
        return StatisticsOut(
            total_tests=agg["total_tests"] or 0,
            download=_compute_speed_stats(download_values),
            upload=_compute_speed_stats(upload_values),
            ping=_compute_speed_stats(ping_values),
            download_violations=agg["download_violations"] or 0,
            upload_violations=agg["upload_violations"] or 0,
            download_threshold_mbps=settings.download_threshold_mbps,
            upload_threshold_mbps=settings.upload_threshold_mbps,
            tolerance_percent=settings.tolerance_percent,
            effective_download_threshold_mbps=round(settings.download_threshold_mbps * tolerance_factor, 1),
            effective_upload_threshold_mbps=round(settings.upload_threshold_mbps * tolerance_factor, 1),
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

        hourly = _compute_hourly(measurements)

        return EnhancedStatisticsOut(
            basic=basic,
            hourly=hourly,
            daily=_compute_daily(measurements),
            trend=_compute_trend(measurements),
            sla=_compute_sla(measurements),
            reliability=_compute_reliability(measurements),
            by_server=_compute_by_server(measurements),
            anomalies=_detect_anomalies(measurements),
            peak_offpeak=_compute_peak_offpeak(measurements),
            time_periods=_compute_time_periods(measurements),
            isp_score=_compute_isp_score(measurements),
            best_worst_times=_find_best_worst_times(hourly),
            correlations=_compute_correlations(measurements),
            degradation_alerts=_detect_degradation(measurements),
            predictions=_compute_predictions(measurements),
        )


statistics_service = StatisticsService()
