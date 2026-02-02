from datetime import datetime

from pydantic import BaseModel, Field


class MeasurementOut(BaseModel):
    id: int
    timestamp: datetime
    download_bps: float
    upload_bps: float
    download_mbps: float
    upload_mbps: float
    ping_latency_ms: float
    ping_jitter_ms: float
    packet_loss_pct: float | None = None
    isp: str
    server_id: int
    server_name: str
    server_location: str
    server_country: str
    internal_ip: str
    external_ip: str
    interface_name: str
    is_vpn: bool
    result_id: str
    result_url: str
    below_download_threshold: bool
    below_upload_threshold: bool

    model_config = {"from_attributes": True}


class MeasurementPage(BaseModel):
    items: list[MeasurementOut]
    total: int
    page: int
    page_size: int
    pages: int


class MeasurementListParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    start_date: datetime | None = None
    end_date: datetime | None = None
