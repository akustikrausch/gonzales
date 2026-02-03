from pydantic import BaseModel


class PercentileValues(BaseModel):
    p5: float
    p25: float
    p50: float
    p75: float
    p95: float


class SpeedStatistics(BaseModel):
    min: float
    max: float
    avg: float
    median: float
    stddev: float
    percentiles: PercentileValues


class StatisticsOut(BaseModel):
    total_tests: int
    download: SpeedStatistics | None = None
    upload: SpeedStatistics | None = None
    ping: SpeedStatistics | None = None
    download_violations: int = 0
    upload_violations: int = 0
    download_threshold_mbps: float
    upload_threshold_mbps: float
    tolerance_percent: float
    effective_download_threshold_mbps: float  # threshold * (1 - tolerance/100)
    effective_upload_threshold_mbps: float
    total_data_used_bytes: int = 0  # Total bytes transferred by all tests


class HourlyAverage(BaseModel):
    hour: int
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_ping_ms: float
    count: int


class DayOfWeekAverage(BaseModel):
    day: int
    day_name: str
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_ping_ms: float
    count: int


class TrendPoint(BaseModel):
    timestamp: str
    download_mbps: float
    upload_mbps: float
    ping_ms: float


class TrendAnalysis(BaseModel):
    points: list[TrendPoint]
    download_slope: float
    upload_slope: float
    ping_slope: float


class SlaCompliance(BaseModel):
    total_tests: int
    download_compliant: int
    upload_compliant: int
    download_compliance_pct: float
    upload_compliance_pct: float


class ReliabilityScore(BaseModel):
    download_cv: float
    upload_cv: float
    ping_cv: float
    composite_score: float


class ServerStats(BaseModel):
    server_id: int
    server_name: str
    server_location: str
    test_count: int
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_ping_ms: float


# --- Phase 6: Innovative Statistics ---


class AnomalyPoint(BaseModel):
    timestamp: str
    metric: str
    value: float
    mean: float
    stddev: float
    z_score: float


class PeriodStats(BaseModel):
    label: str
    hours: str
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_ping_ms: float
    count: int


class TimePeriodStats(BaseModel):
    period: str  # morning, midday, afternoon, evening, night
    period_label: str  # "Morning (6-10)"
    hours: str  # "06:00-10:00"
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_ping_ms: float
    test_count: int
    compliance_pct: float  # percentage of tests meeting thresholds


class TimePeriodAnalysis(BaseModel):
    periods: list[TimePeriodStats]
    best_period: str
    worst_period: str


class PeakOffPeakAnalysis(BaseModel):
    peak: PeriodStats
    offpeak: PeriodStats
    night: PeriodStats
    best_period: str
    worst_period: str


class IspScoreBreakdown(BaseModel):
    speed_score: float
    reliability_score: float
    latency_score: float
    consistency_score: float


class IspScore(BaseModel):
    composite: float
    grade: str
    breakdown: IspScoreBreakdown


class TimeWindowResult(BaseModel):
    hour: int
    label: str
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_ping_ms: float


class BestWorstTimes(BaseModel):
    best_download: TimeWindowResult | None = None
    worst_download: TimeWindowResult | None = None
    best_upload: TimeWindowResult | None = None
    worst_upload: TimeWindowResult | None = None
    best_ping: TimeWindowResult | None = None
    worst_ping: TimeWindowResult | None = None


class CorrelationPair(BaseModel):
    metric_a: str
    metric_b: str
    coefficient: float


class CorrelationMatrix(BaseModel):
    pairs: list[CorrelationPair]
    metrics: list[str]


class DegradationAlert(BaseModel):
    metric: str
    severity: str
    description: str
    current_avg: float
    historical_avg: float
    drop_pct: float


class PredictionPoint(BaseModel):
    timestamp: str
    download_mbps: float
    upload_mbps: float
    ping_ms: float


class PredictiveTrend(BaseModel):
    points: list[PredictionPoint]
    confidence: str


class EnhancedStatisticsOut(BaseModel):
    basic: StatisticsOut
    hourly: list[HourlyAverage]
    daily: list[DayOfWeekAverage]
    trend: TrendAnalysis
    sla: SlaCompliance
    reliability: ReliabilityScore
    by_server: list[ServerStats]
    anomalies: list[AnomalyPoint] = []
    peak_offpeak: PeakOffPeakAnalysis | None = None
    time_periods: TimePeriodAnalysis | None = None
    isp_score: IspScore | None = None
    best_worst_times: BestWorstTimes | None = None
    correlations: CorrelationMatrix | None = None
    degradation_alerts: list[DegradationAlert] = []
    predictions: PredictiveTrend | None = None
