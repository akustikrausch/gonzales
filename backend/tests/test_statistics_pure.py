"""Tests for pure statistics functions (no DB required)."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from gonzales.services.statistics_service import (
    _compute_isp_score,
    _compute_peak_offpeak,
    _compute_speed_stats,
    _detect_anomalies,
    _detect_degradation,
    _linear_regression,
    _pearson,
    _percentile,
    _stddev,
)


def _fake_measurement(
    download_mbps: float = 500.0,
    upload_mbps: float = 250.0,
    ping_latency_ms: float = 12.0,
    ping_jitter_ms: float = 2.0,
    timestamp: datetime | None = None,
    server_id: int = 1,
    server_name: str = "Server",
    server_location: str = "Berlin",
):
    return SimpleNamespace(
        download_mbps=download_mbps,
        upload_mbps=upload_mbps,
        ping_latency_ms=ping_latency_ms,
        ping_jitter_ms=ping_jitter_ms,
        timestamp=timestamp or datetime.now(timezone.utc),
        server_id=server_id,
        server_name=server_name,
        server_location=server_location,
    )


# --- _percentile ---


class TestPercentile:
    def test_empty_list(self):
        assert _percentile([], 50) == 0.0

    def test_single_value(self):
        assert _percentile([42.0], 50) == 42.0

    def test_median_odd(self):
        assert _percentile([1.0, 2.0, 3.0], 50) == 2.0

    def test_median_even(self):
        result = _percentile([1.0, 2.0, 3.0, 4.0], 50)
        assert result == 2.5

    def test_p0_returns_min(self):
        assert _percentile([1.0, 5.0, 10.0], 0) == 1.0

    def test_p100_returns_max(self):
        assert _percentile([1.0, 5.0, 10.0], 100) == 10.0

    def test_p25(self):
        values = sorted([10.0, 20.0, 30.0, 40.0, 50.0])
        result = _percentile(values, 25)
        assert result == 20.0

    def test_p75(self):
        values = sorted([10.0, 20.0, 30.0, 40.0, 50.0])
        result = _percentile(values, 75)
        assert result == 40.0


# --- _stddev ---


class TestStddev:
    def test_single_value(self):
        assert _stddev([42.0], 42.0) == 0.0

    def test_empty_list_technically_covered(self):
        assert _stddev([], 0.0) == 0.0

    def test_known_values(self):
        values = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
        mean = sum(values) / len(values)
        result = _stddev(values, mean)
        # Sample stddev (N-1) of this dataset is ~2.14
        assert abs(result - 2.14) < 0.01

    def test_identical_values(self):
        values = [5.0, 5.0, 5.0, 5.0]
        assert _stddev(values, 5.0) == 0.0


# --- _linear_regression ---


class TestLinearRegression:
    def test_single_point(self):
        slope, intercept = _linear_regression([1.0], [5.0])
        assert slope == 0.0
        assert intercept == 0.0

    def test_perfect_line(self):
        xs = [0.0, 1.0, 2.0, 3.0]
        ys = [1.0, 3.0, 5.0, 7.0]
        slope, intercept = _linear_regression(xs, ys)
        assert abs(slope - 2.0) < 0.001
        assert abs(intercept - 1.0) < 0.001

    def test_horizontal_line(self):
        xs = [0.0, 1.0, 2.0]
        ys = [5.0, 5.0, 5.0]
        slope, intercept = _linear_regression(xs, ys)
        assert slope == 0.0
        assert intercept == 5.0

    def test_constant_xs(self):
        xs = [3.0, 3.0, 3.0]
        ys = [1.0, 2.0, 3.0]
        slope, intercept = _linear_regression(xs, ys)
        assert slope == 0.0
        assert intercept == 2.0


# --- _pearson ---


class TestPearson:
    def test_too_few_points(self):
        assert _pearson([1.0, 2.0], [3.0, 4.0]) == 0.0

    def test_perfect_positive(self):
        xs = [1.0, 2.0, 3.0, 4.0, 5.0]
        ys = [2.0, 4.0, 6.0, 8.0, 10.0]
        result = _pearson(xs, ys)
        assert abs(result - 1.0) < 0.001

    def test_perfect_negative(self):
        xs = [1.0, 2.0, 3.0, 4.0, 5.0]
        ys = [10.0, 8.0, 6.0, 4.0, 2.0]
        result = _pearson(xs, ys)
        assert abs(result - (-1.0)) < 0.001

    def test_zero_variance(self):
        xs = [5.0, 5.0, 5.0]
        ys = [1.0, 2.0, 3.0]
        assert _pearson(xs, ys) == 0.0


# --- _compute_speed_stats ---


class TestComputeSpeedStats:
    def test_empty(self):
        assert _compute_speed_stats([]) is None

    def test_single_value(self):
        result = _compute_speed_stats([100.0])
        assert result is not None
        assert result.min == 100.0
        assert result.max == 100.0
        assert result.avg == 100.0
        assert result.median == 100.0
        assert result.stddev == 0.0

    def test_multiple_values(self):
        result = _compute_speed_stats([100.0, 200.0, 300.0, 400.0, 500.0])
        assert result is not None
        assert result.min == 100.0
        assert result.max == 500.0
        assert result.avg == 300.0
        assert result.median == 300.0
        # p5/p95 are interpolated with 5 values
        assert result.percentiles.p25 == 200.0
        assert result.percentiles.p75 == 400.0


# --- _compute_isp_score ---


class TestComputeIspScore:
    def test_too_few_measurements(self):
        ms = [_fake_measurement(), _fake_measurement()]
        assert _compute_isp_score(ms) is None

    def test_returns_score(self):
        ms = [
            _fake_measurement(download_mbps=500, upload_mbps=250, ping_latency_ms=10)
            for _ in range(5)
        ]
        result = _compute_isp_score(ms)
        assert result is not None
        assert 0 <= result.composite <= 100
        assert result.grade in ("A+", "A", "B", "C", "D", "F")
        assert result.breakdown.speed_score >= 0
        assert result.breakdown.latency_score >= 0
        assert result.breakdown.reliability_score >= 0
        assert result.breakdown.consistency_score >= 0

    def test_high_score_for_good_connection(self):
        ms = [
            _fake_measurement(download_mbps=1000, upload_mbps=500, ping_latency_ms=5)
            for _ in range(10)
        ]
        result = _compute_isp_score(ms)
        assert result is not None
        assert result.composite >= 80
        assert result.grade in ("A+", "A")


# --- _detect_anomalies ---


class TestDetectAnomalies:
    def test_too_few_measurements(self):
        ms = [_fake_measurement() for _ in range(4)]
        assert _detect_anomalies(ms) == []

    def test_no_anomalies_in_uniform_data(self):
        ms = [_fake_measurement(download_mbps=500) for _ in range(10)]
        assert _detect_anomalies(ms) == []

    def test_detects_outlier(self):
        ms = [_fake_measurement(download_mbps=500) for _ in range(20)]
        ms.append(_fake_measurement(download_mbps=50))  # extreme outlier
        anomalies = _detect_anomalies(ms)
        assert len(anomalies) > 0
        assert any(a.metric == "download_mbps" for a in anomalies)


# --- _compute_peak_offpeak ---


class TestComputePeakOffpeak:
    def test_empty(self):
        assert _compute_peak_offpeak([]) is None

    def test_peak_hours(self):
        base = datetime(2025, 1, 15, 12, 0, tzinfo=timezone.utc)
        ms = [
            _fake_measurement(download_mbps=400, timestamp=base + timedelta(hours=i))
            for i in range(3)
        ]
        result = _compute_peak_offpeak(ms)
        assert result is not None
        assert result.peak.count == 3
        assert result.offpeak.count == 0
        assert result.night.count == 0
        assert result.best_period == "Peak"

    def test_night_hours(self):
        base = datetime(2025, 1, 15, 2, 0, tzinfo=timezone.utc)
        ms = [_fake_measurement(download_mbps=600, timestamp=base)]
        result = _compute_peak_offpeak(ms)
        assert result is not None
        assert result.night.count == 1
        assert result.best_period == "Night"


# --- _detect_degradation ---


class TestDetectDegradation:
    def test_too_few_measurements(self):
        ms = [_fake_measurement() for _ in range(15)]
        assert _detect_degradation(ms) == []

    def test_no_degradation(self):
        base = datetime(2025, 1, 1, tzinfo=timezone.utc)
        ms = [
            _fake_measurement(download_mbps=500, timestamp=base + timedelta(hours=i))
            for i in range(30)
        ]
        alerts = _detect_degradation(ms)
        assert alerts == []

    def test_detects_download_drop(self):
        base = datetime(2025, 1, 1, tzinfo=timezone.utc)
        historical = [
            _fake_measurement(download_mbps=500, upload_mbps=250, ping_latency_ms=10,
                              timestamp=base + timedelta(hours=i))
            for i in range(20)
        ]
        recent = [
            _fake_measurement(download_mbps=200, upload_mbps=250, ping_latency_ms=10,
                              timestamp=base + timedelta(hours=20 + i))
            for i in range(10)
        ]
        ms = historical + recent
        alerts = _detect_degradation(ms)
        assert len(alerts) > 0
        dl_alerts = [a for a in alerts if a.metric == "download_mbps"]
        assert len(dl_alerts) == 1
        assert dl_alerts[0].severity in ("warning", "critical")
        assert dl_alerts[0].drop_pct > 15
