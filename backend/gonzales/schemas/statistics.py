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
