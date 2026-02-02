from pydantic import BaseModel, Field


class ConfigOut(BaseModel):
    test_interval_minutes: int
    download_threshold_mbps: float
    upload_threshold_mbps: float
    host: str
    port: int
    log_level: str
    debug: bool


class ConfigUpdate(BaseModel):
    test_interval_minutes: int | None = Field(default=None, ge=1, le=1440)
    download_threshold_mbps: float | None = Field(default=None, ge=0)
    upload_threshold_mbps: float | None = Field(default=None, ge=0)
