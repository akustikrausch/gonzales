"""Statistics computation service for speed test measurements.

This module provides comprehensive analytics including:
- Basic statistics (min, max, avg, median, percentiles)
- Time-based analysis (hourly heatmaps, day-of-week patterns)
- Trend analysis with predictive forecasting
- ISP scoring with multi-factor grading (A+ to F)
- Anomaly detection using z-score analysis
- SLA compliance and reliability metrics
- Connection type comparison (Ethernet vs WiFi vs VPN)
"""

import math
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.db.repository import MeasurementRepository
from gonzales.domain.value_objects import ThresholdConfig
from gonzales.utils.math_utils import pearson_correlation
from gonzales.schemas.statistics import (
    AnomalyPoint,
    BestWorstTimes,
    ConnectionComparison,
    ConnectionTypeStats,
    CorrelationMatrix,
    CorrelationPair,
    DayOfWeekAverage,
    DegradationAlert,
    EnhancedPredictionPoint,
    EnhancedPredictiveTrend,
    EnhancedStatisticsOut,
    HourlyAverage,
    IspScore,
    IspScoreBreakdown,
    PeakOffPeakAnalysis,
    PercentileValues,
    PeriodStats,
    PredictionInterval,
    PredictionPoint,
    PredictiveTrend,
    ReliabilityScore,
    SeasonalFactor,
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
    """Calculate percentile value using linear interpolation.

    Args:
        sorted_values: Pre-sorted list of values.
        p: Percentile to calculate (0-100).

    Returns:
        The interpolated percentile value.
    """
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_values[int(k)]
    return sorted_values[f] * (c - k) + sorted_values[c] * (k - f)


def _stddev(values: list[float], mean: float) -> float:
    """Calculate sample standard deviation.

    Args:
        values: List of values.
        mean: Pre-calculated mean of values.

    Returns:
        Sample standard deviation (Bessel's correction applied).
    """
    if len(values) < 2:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def _compute_speed_stats(values: list[float]) -> SpeedStatistics | None:
    """Compute comprehensive statistics for a list of speed values.

    Args:
        values: List of speed measurements.

    Returns:
        SpeedStatistics with min, max, avg, median, stddev, and percentiles.
    """
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
    threshold = ThresholdConfig.from_settings()
    effective_dl_threshold = threshold.effective_download_mbps
    effective_ul_threshold = threshold.effective_upload_mbps

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
    return pearson_correlation(xs, ys)


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


# --- Enhanced Predictive Analytics ---


def _exponential_smoothing(values: list[float], alpha: float = 0.3) -> list[float]:
    """Simple Exponential Smoothing - gives more weight to recent values.

    Args:
        values: Time series values
        alpha: Smoothing factor (0 < alpha < 1), higher = more weight on recent

    Returns:
        Smoothed values
    """
    if not values:
        return []

    smoothed = [values[0]]  # Start with first value
    for i in range(1, len(values)):
        # s_t = alpha * x_t + (1 - alpha) * s_{t-1}
        s = alpha * values[i] + (1 - alpha) * smoothed[-1]
        smoothed.append(s)

    return smoothed


def _holt_linear_smoothing(
    values: list[float],
    alpha: float = 0.3,
    beta: float = 0.1,
) -> tuple[float, float]:
    """Holt's Linear Exponential Smoothing - handles trends.

    Args:
        values: Time series values
        alpha: Level smoothing factor
        beta: Trend smoothing factor

    Returns:
        (level, trend) for forecasting: forecast = level + k * trend
    """
    if len(values) < 2:
        return (values[0] if values else 0, 0)

    # Initialize
    level = values[0]
    trend = values[1] - values[0]

    for i in range(1, len(values)):
        prev_level = level
        level = alpha * values[i] + (1 - alpha) * (prev_level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend

    return level, trend


def _compute_seasonal_factors(measurements: list) -> dict[int, dict[str, float]]:
    """Compute multiplicative seasonal factors for each day of the week.

    Returns:
        dict[weekday] -> {download_factor, upload_factor, ping_factor}
        where 1.0 = average, 1.1 = 10% above average
    """
    if len(measurements) < 14:  # Need at least 2 weeks of data
        return {}

    # Calculate overall means
    dl_mean = sum(m.download_mbps for m in measurements) / len(measurements)
    ul_mean = sum(m.upload_mbps for m in measurements) / len(measurements)
    pg_mean = sum(m.ping_latency_ms for m in measurements) / len(measurements)

    if dl_mean == 0 or ul_mean == 0 or pg_mean == 0:
        return {}

    # Group by weekday
    by_day: dict[int, list] = defaultdict(list)
    for m in measurements:
        by_day[m.timestamp.weekday()].append(m)

    factors = {}
    for day in range(7):
        items = by_day.get(day, [])
        if len(items) < 2:
            factors[day] = {"download": 1.0, "upload": 1.0, "ping": 1.0}
        else:
            day_dl = sum(m.download_mbps for m in items) / len(items)
            day_ul = sum(m.upload_mbps for m in items) / len(items)
            day_pg = sum(m.ping_latency_ms for m in items) / len(items)
            factors[day] = {
                "download": day_dl / dl_mean,
                "upload": day_ul / ul_mean,
                "ping": day_pg / pg_mean,
            }

    return factors


def _compute_prediction_interval(
    values: list[float],
    forecast: float,
    confidence: float = 0.95,
) -> tuple[float, float]:
    """Compute prediction interval based on historical variance.

    Returns:
        (lower_bound, upper_bound)
    """
    if len(values) < 3:
        return (forecast * 0.7, forecast * 1.3)  # Default 30% range

    mean = sum(values) / len(values)
    std = _stddev(values, mean)

    # Z-scores for common confidence levels
    z_scores = {0.80: 1.28, 0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
    z = z_scores.get(confidence, 1.96)

    margin = z * std
    return (max(0, forecast - margin), forecast + margin)


def _compute_enhanced_predictions(
    measurements: list,
    days_ahead: int = 7,
) -> EnhancedPredictiveTrend | None:
    """Enhanced prediction using Holt's Exponential Smoothing with seasonal adjustment."""
    if len(measurements) < 10:
        return None

    sorted_m = sorted(measurements, key=lambda m: m.timestamp)

    # Extract time series
    dl_values = [m.download_mbps for m in sorted_m]
    ul_values = [m.upload_mbps for m in sorted_m]
    pg_values = [m.ping_latency_ms for m in sorted_m]

    # Compute seasonal factors
    seasonal = _compute_seasonal_factors(sorted_m)

    # Adaptive alpha based on data variability
    dl_mean = sum(dl_values) / len(dl_values)
    dl_cv = _stddev(dl_values, dl_mean) / dl_mean if dl_mean > 0 else 0
    alpha = min(0.5, max(0.1, 0.3 + dl_cv * 0.2))  # More smoothing for volatile data
    beta = 0.1

    # Apply Holt's Exponential Smoothing
    dl_level, dl_trend = _holt_linear_smoothing(dl_values, alpha, beta)
    ul_level, ul_trend = _holt_linear_smoothing(ul_values, alpha, beta)
    pg_level, pg_trend = _holt_linear_smoothing(pg_values, alpha, beta)

    last_ts = sorted_m[-1].timestamp
    points = []

    for d in range(1, days_ahead + 1):
        future_ts = last_ts + timedelta(days=d)
        weekday = future_ts.weekday()

        # Base forecast from Holt's method
        dl_forecast = max(0, dl_level + d * dl_trend)
        ul_forecast = max(0, ul_level + d * ul_trend)
        pg_forecast = max(0, pg_level + d * pg_trend)

        # Apply seasonal adjustment if available
        if seasonal:
            factors = seasonal.get(weekday, {"download": 1.0, "upload": 1.0, "ping": 1.0})
            dl_forecast *= factors["download"]
            ul_forecast *= factors["upload"]
            pg_forecast *= factors["ping"]

        # Compute confidence intervals
        dl_lower, dl_upper = _compute_prediction_interval(dl_values, dl_forecast, 0.95)
        ul_lower, ul_upper = _compute_prediction_interval(ul_values, ul_forecast, 0.95)
        pg_lower, pg_upper = _compute_prediction_interval(pg_values, pg_forecast, 0.95)

        points.append(EnhancedPredictionPoint(
            timestamp=future_ts.isoformat(),
            day_of_week=DAY_NAMES[weekday],
            download_mbps=round(dl_forecast, 2),
            download_interval=PredictionInterval(
                lower=round(dl_lower, 2),
                upper=round(dl_upper, 2),
                confidence=0.95,
            ),
            upload_mbps=round(ul_forecast, 2),
            upload_interval=PredictionInterval(
                lower=round(ul_lower, 2),
                upper=round(ul_upper, 2),
                confidence=0.95,
            ),
            ping_ms=round(pg_forecast, 2),
            ping_interval=PredictionInterval(
                lower=round(pg_lower, 2),
                upper=round(pg_upper, 2),
                confidence=0.95,
            ),
        ))

    # Build seasonal factors list
    seasonal_list = []
    for day in range(7):
        factors = seasonal.get(day, {"download": 1.0, "upload": 1.0, "ping": 1.0})
        seasonal_list.append(SeasonalFactor(
            day=day,
            day_name=DAY_NAMES[day],
            download_factor=round(factors["download"], 3),
            upload_factor=round(factors["upload"], 3),
            ping_factor=round(factors["ping"], 3),
        ))

    # Data quality score
    data_quality = min(100, len(measurements) * 2)  # More data = higher quality
    if len(set(m.timestamp.weekday() for m in sorted_m)) == 7:
        data_quality += 20  # Bonus for full week coverage
    data_quality = min(100, data_quality)

    # Confidence level
    if len(measurements) >= 50 and data_quality >= 80:
        confidence_level = "high"
    elif len(measurements) >= 20:
        confidence_level = "medium"
    else:
        confidence_level = "low"

    return EnhancedPredictiveTrend(
        points=points,
        seasonal_factors=seasonal_list,
        method="holt_exponential_smoothing",
        confidence_level=confidence_level,
        data_quality_score=data_quality,
        smoothing_params={"alpha": round(alpha, 3), "beta": beta},
    )


# --- Connection Comparison ---


def _compute_connection_comparison(measurements: list) -> ConnectionComparison | None:
    """Compare performance across different connection types (Ethernet, WiFi, VPN)."""
    if not measurements:
        return None

    # Group by connection_type
    buckets: dict[str, list] = defaultdict(list)
    for m in measurements:
        conn_type = getattr(m, "connection_type", "unknown")
        buckets[conn_type].append(m)

    # Filter out types with too few measurements
    MIN_SAMPLES = 3
    valid_types = {k: v for k, v in buckets.items() if len(v) >= MIN_SAMPLES}

    if not valid_types:
        return None

    types = []
    for conn_type, items in valid_types.items():
        dl = [m.download_mbps for m in items]
        ul = [m.upload_mbps for m in items]
        pg = [m.ping_latency_ms for m in items]
        jt = [m.ping_jitter_ms for m in items]

        # Calculate reliability (inverse of CV)
        dl_mean = sum(dl) / len(dl)
        dl_std = _stddev(dl, dl_mean)
        cv = dl_std / dl_mean if dl_mean > 0 else 1
        reliability = max(0, min(100, (1 - cv) * 100))

        types.append(ConnectionTypeStats(
            connection_type=conn_type,
            test_count=len(items),
            avg_download_mbps=round(dl_mean, 2),
            avg_upload_mbps=round(sum(ul) / len(ul), 2),
            avg_ping_ms=round(sum(pg) / len(pg), 2),
            avg_jitter_ms=round(sum(jt) / len(jt), 2),
            min_download_mbps=round(min(dl), 2),
            max_download_mbps=round(max(dl), 2),
            reliability_score=round(reliability, 1),
        ))

    # Determine best types
    best_dl = max(types, key=lambda t: t.avg_download_mbps).connection_type
    best_ul = max(types, key=lambda t: t.avg_upload_mbps).connection_type
    best_ping = min(types, key=lambda t: t.avg_ping_ms).connection_type

    # Generate recommendation
    if len(types) >= 2:
        sorted_by_dl = sorted(types, key=lambda t: t.avg_download_mbps, reverse=True)
        diff_pct = (
            (sorted_by_dl[0].avg_download_mbps - sorted_by_dl[1].avg_download_mbps)
            / sorted_by_dl[1].avg_download_mbps
            * 100
        ) if sorted_by_dl[1].avg_download_mbps > 0 else 0
        recommendation = (
            f"{sorted_by_dl[0].connection_type.title()} provides "
            f"{diff_pct:.0f}% faster download than {sorted_by_dl[1].connection_type.title()}"
        )
    else:
        recommendation = "Only one connection type detected"

    return ConnectionComparison(
        types=types,
        best_for_download=best_dl,
        best_for_upload=best_ul,
        best_for_latency=best_ping,
        recommendation=recommendation,
    )


class StatisticsService:
    """Service for computing comprehensive statistics from measurements.

    Provides both basic statistics (get_statistics) and enhanced analytics
    (get_enhanced_statistics) including ISP scoring, trend analysis,
    anomaly detection, and predictive forecasting.
    """

    async def get_statistics(
        self,
        session: AsyncSession,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> StatisticsOut:
        """Get basic statistics for measurements in date range.

        Args:
            session: Database session.
            start_date: Optional start date filter.
            end_date: Optional end date filter.

        Returns:
            StatisticsOut with aggregated statistics.
        """
        repo = MeasurementRepository(session)
        agg = await repo.get_statistics(start_date, end_date)
        measurements = await repo.get_all_in_range(start_date, end_date)

        download_values = [m.download_mbps for m in measurements]
        upload_values = [m.upload_mbps for m in measurements]
        ping_values = [m.ping_latency_ms for m in measurements]

        # Calculate total data used by all tests
        total_data_bytes = sum(
            getattr(m, "download_bytes", 0) + getattr(m, "upload_bytes", 0)
            for m in measurements
        )

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
            total_data_used_bytes=total_data_bytes,
        )

    async def get_enhanced_statistics(
        self,
        session: AsyncSession,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> EnhancedStatisticsOut:
        """Get comprehensive analytics including all advanced features.

        Computes extended statistics including:
        - Basic statistics (min, max, avg, percentiles)
        - Hourly and daily patterns (heatmaps)
        - ISP score with breakdown (A+ to F grade)
        - Trend analysis with predictions
        - SLA compliance metrics
        - Reliability score
        - Peak/off-peak analysis
        - Server comparison
        - Connection type comparison
        - Anomaly detection
        - Degradation alerts

        Args:
            session: Database session.
            start_date: Optional start date filter.
            end_date: Optional end date filter.

        Returns:
            EnhancedStatisticsOut with all analytics data.
        """
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
            enhanced_predictions=_compute_enhanced_predictions(measurements),
            connection_comparison=_compute_connection_comparison(measurements),
        )


statistics_service = StatisticsService()
