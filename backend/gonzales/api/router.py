from fastapi import APIRouter

from gonzales.api.v1 import config, export, measurements, outages, qos, root_cause, servers, smart_scheduler, speedtest, statistics, status, summary, topology

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(measurements.router)
api_router.include_router(statistics.router)
api_router.include_router(status.router)
api_router.include_router(export.router)
api_router.include_router(speedtest.router)
api_router.include_router(config.router)
api_router.include_router(servers.router)
api_router.include_router(qos.router)
api_router.include_router(topology.router)
api_router.include_router(outages.router)
api_router.include_router(summary.router)
api_router.include_router(smart_scheduler.router)
api_router.include_router(root_cause.router)
