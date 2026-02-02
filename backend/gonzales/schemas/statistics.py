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


class EnhancedStatisticsOut(BaseModel):
    basic: StatisticsOut
    hourly: list[HourlyAverage]
    daily: list[DayOfWeekAverage]
    trend: TrendAnalysis
    sla: SlaCompliance
    reliability: ReliabilityScore
    by_server: list[ServerStats]
