"""Parser for Ookla Speedtest CLI JSON output."""

from pydantic import BaseModel, Field


class RawPing(BaseModel):
    jitter: float = 0.0
    latency: float = 0.0
    low: float = 0.0
    high: float = 0.0


class RawBandwidth(BaseModel):
    bandwidth: int = 0  # bytes per second
    bytes: int = 0
    elapsed: int = 0
    latency: dict | None = None


class RawServer(BaseModel):
    id: int = 0
    host: str = ""
    port: int = 0
    name: str = ""
    location: str = ""
    country: str = ""
    ip: str = ""


class RawInterface(BaseModel):
    internalIp: str = ""
    name: str = ""
    macAddr: str = ""
    isVpn: bool = False
    externalIp: str = ""


class RawResult(BaseModel):
    id: str = ""
    url: str = ""
    persisted: bool = False


class SpeedtestRawResult(BaseModel):
    type: str = ""
    timestamp: str = ""
    ping: RawPing = Field(default_factory=RawPing)
    download: RawBandwidth = Field(default_factory=RawBandwidth)
    upload: RawBandwidth = Field(default_factory=RawBandwidth)
    packetLoss: float | None = None
    isp: str = ""
    server: RawServer = Field(default_factory=RawServer)
    interface: RawInterface = Field(default_factory=RawInterface)
    result: RawResult = Field(default_factory=RawResult)

    @property
    def download_bps(self) -> float:
        return float(self.download.bandwidth * 8)

    @property
    def upload_bps(self) -> float:
        return float(self.upload.bandwidth * 8)

    @property
    def download_mbps(self) -> float:
        return self.download_bps / 1_000_000

    @property
    def upload_mbps(self) -> float:
        return self.upload_bps / 1_000_000
