from fastapi import APIRouter, Depends, Request

from gonzales.api.dependencies import require_api_key
from gonzales.config import settings
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.schemas.config import ConfigOut, ConfigUpdate
from gonzales.services.scheduler_service import scheduler_service

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=ConfigOut)
@limiter.limit(RATE_LIMITS["read"])
async def get_config(request: Request):
    return ConfigOut(
        test_interval_minutes=settings.test_interval_minutes,
        download_threshold_mbps=settings.download_threshold_mbps,
        upload_threshold_mbps=settings.upload_threshold_mbps,
        tolerance_percent=settings.tolerance_percent,
        preferred_server_id=settings.preferred_server_id,
        manual_trigger_cooldown_seconds=settings.manual_trigger_cooldown_seconds,
        theme=settings.theme,
        isp_name=settings.isp_name,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        debug=settings.debug,
    )


@router.put("", response_model=ConfigOut, dependencies=[Depends(require_api_key)])
@limiter.limit(RATE_LIMITS["config_update"])
async def update_config(request: Request, update: ConfigUpdate):
    if update.test_interval_minutes is not None:
        settings.test_interval_minutes = update.test_interval_minutes
        scheduler_service.reschedule(update.test_interval_minutes)
    if update.download_threshold_mbps is not None:
        settings.download_threshold_mbps = update.download_threshold_mbps
    if update.upload_threshold_mbps is not None:
        settings.upload_threshold_mbps = update.upload_threshold_mbps
    if update.tolerance_percent is not None:
        settings.tolerance_percent = update.tolerance_percent
    if update.preferred_server_id is not None:
        settings.preferred_server_id = update.preferred_server_id
    if update.manual_trigger_cooldown_seconds is not None:
        settings.manual_trigger_cooldown_seconds = update.manual_trigger_cooldown_seconds
    if update.theme is not None:
        settings.theme = update.theme
    if update.isp_name is not None:
        settings.isp_name = update.isp_name

    settings.save_config()

    return ConfigOut(
        test_interval_minutes=settings.test_interval_minutes,
        download_threshold_mbps=settings.download_threshold_mbps,
        upload_threshold_mbps=settings.upload_threshold_mbps,
        tolerance_percent=settings.tolerance_percent,
        preferred_server_id=settings.preferred_server_id,
        manual_trigger_cooldown_seconds=settings.manual_trigger_cooldown_seconds,
        theme=settings.theme,
        isp_name=settings.isp_name,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        debug=settings.debug,
    )
