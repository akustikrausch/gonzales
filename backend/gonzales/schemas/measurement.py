from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SortField(str, Enum):
    timestamp = "timestamp"
    download_mbps = "download_mbps"
    upload_mbps = "upload_mbps"
    ping_latency_ms = "ping_latency_ms"
    ping_jitter_ms = "ping_jitter_ms"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


class MeasurementOut(BaseModel):
    """
    Speed test measurement result.

    Contains all data from a single speed test including speeds,
    latency, server information, and threshold compliance.
    """

    id: int = Field(..., description="Unique measurement ID")
    timestamp: datetime = Field(..., description="When the test was performed (UTC)")
    download_bps: float = Field(..., description="Download speed in bits per second")
    upload_bps: float = Field(..., description="Upload speed in bits per second")
    download_mbps: float = Field(..., description="Download speed in megabits per second")
    upload_mbps: float = Field(..., description="Upload speed in megabits per second")
    ping_latency_ms: float = Field(..., description="Round-trip latency in milliseconds")
    ping_jitter_ms: float = Field(..., description="Latency variation in milliseconds")
    packet_loss_pct: float | None = Field(None, description="Packet loss percentage (0-100)")
    isp: str = Field(..., description="Internet Service Provider name")
    server_id: int = Field(..., description="Speed test server ID")
    server_name: str = Field(..., description="Speed test server name")
    server_location: str = Field(..., description="Server city/location")
    server_country: str = Field(..., description="Server country")
    internal_ip: str = Field(..., description="Local network IP address")
    external_ip: str = Field(..., description="Public IP address")
    interface_name: str = Field(..., description="Network interface used")
    is_vpn: bool = Field(..., description="Whether a VPN was detected")
    result_id: str = Field(..., description="Speedtest.net result ID")
    result_url: str = Field(..., description="URL to view result on speedtest.net")
    below_download_threshold: bool = Field(..., description="True if download was below threshold")
    below_upload_threshold: bool = Field(..., description="True if upload was below threshold")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 42,
                "timestamp": "2024-02-04T10:30:00Z",
                "download_bps": 99823456,
                "upload_bps": 44156789,
                "download_mbps": 95.2,
                "upload_mbps": 42.1,
                "ping_latency_ms": 12.5,
                "ping_jitter_ms": 2.3,
                "packet_loss_pct": 0.0,
                "isp": "Deutsche Telekom",
                "server_id": 12345,
                "server_name": "Cloudflare",
                "server_location": "Frankfurt",
                "server_country": "Germany",
                "internal_ip": "192.168.1.100",
                "external_ip": "203.0.113.42",
                "interface_name": "eth0",
                "is_vpn": False,
                "result_id": "abc123",
                "result_url": "https://www.speedtest.net/result/abc123",
                "below_download_threshold": False,
                "below_upload_threshold": False
            }
        }
    }


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
