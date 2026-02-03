from pydantic import BaseModel, Field


class ConfigOut(BaseModel):
    test_interval_minutes: int
    download_threshold_mbps: float
    upload_threshold_mbps: float
    tolerance_percent: float
    preferred_server_id: int
    manual_trigger_cooldown_seconds: int
    theme: str
    host: str
    port: int
    log_level: str
    debug: bool


class ConfigUpdate(BaseModel):
    test_interval_minutes: int | None = Field(default=None, ge=1, le=1440)
    download_threshold_mbps: float | None = Field(default=None, ge=0)
    upload_threshold_mbps: float | None = Field(default=None, ge=0)
    tolerance_percent: float | None = Field(default=None, ge=0, le=50)
    preferred_server_id: int | None = Field(default=None, ge=0)
    manual_trigger_cooldown_seconds: int | None = Field(default=None, ge=0, le=3600)
    theme: str | None = Field(default=None, pattern=r"^(auto|light|dark)$")
