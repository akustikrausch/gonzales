from fastapi import APIRouter

from gonzales.schemas.server import ServerListOut, SpeedtestServer
from gonzales.services.speedtest_runner import speedtest_runner

router = APIRouter(prefix="/servers", tags=["servers"])


@router.get("", response_model=ServerListOut)
async def get_servers():
    raw_servers = await speedtest_runner.list_servers()
    servers = [
        SpeedtestServer(
            id=s.get("id", 0),
            host=s.get("host", ""),
            port=s.get("port", 0),
            name=s.get("name", ""),
            location=s.get("location", ""),
            country=s.get("country", ""),
        )
        for s in raw_servers
    ]
    return ServerListOut(servers=servers)
