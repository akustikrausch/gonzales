from fastapi import APIRouter

from gonzales.config import settings
from gonzales.schemas.config import ConfigOut, ConfigUpdate
from gonzales.services.scheduler_service import scheduler_service

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=ConfigOut)
async def get_config():
    return ConfigOut(
        test_interval_minutes=settings.test_interval_minutes,
        download_threshold_mbps=settings.download_threshold_mbps,
        upload_threshold_mbps=settings.upload_threshold_mbps,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        debug=settings.debug,
    )


@router.put("", response_model=ConfigOut)
async def update_config(update: ConfigUpdate):
    if update.test_interval_minutes is not None:
        settings.test_interval_minutes = update.test_interval_minutes
        scheduler_service.reschedule(update.test_interval_minutes)
    if update.download_threshold_mbps is not None:
        settings.download_threshold_mbps = update.download_threshold_mbps
    if update.upload_threshold_mbps is not None:
        settings.upload_threshold_mbps = update.upload_threshold_mbps

    settings.save_config()

    return ConfigOut(
        test_interval_minutes=settings.test_interval_minutes,
        download_threshold_mbps=settings.download_threshold_mbps,
        upload_threshold_mbps=settings.upload_threshold_mbps,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        debug=settings.debug,
    )
