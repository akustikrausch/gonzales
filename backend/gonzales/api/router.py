from fastapi import APIRouter

from gonzales.api.v1 import config, export, measurements, servers, speedtest, statistics, status

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(measurements.router)
api_router.include_router(statistics.router)
api_router.include_router(status.router)
api_router.include_router(export.router)
api_router.include_router(speedtest.router)
api_router.include_router(config.router)
api_router.include_router(servers.router)
