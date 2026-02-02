from pydantic import BaseModel


class SpeedtestServer(BaseModel):
    id: int
    host: str = ""
    port: int = 0
    name: str = ""
    location: str = ""
    country: str = ""


class ServerListOut(BaseModel):
    servers: list[SpeedtestServer]
