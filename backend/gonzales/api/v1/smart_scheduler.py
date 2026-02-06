"""API endpoints for smart scheduler."""

from fastapi import APIRouter, Depends, Request

from gonzales.api.dependencies import require_api_key
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.schemas.smart_scheduler import (
    SmartSchedulerConfig,
    SmartSchedulerConfigUpdate,
    SmartSchedulerStatus,
    SmartSchedulerEnableResponse,
)
from gonzales.services.smart_scheduler_service import smart_scheduler_service

router = APIRouter(prefix="/smart-scheduler", tags=["smart-scheduler"])


@router.get("/status", response_model=SmartSchedulerStatus)
@limiter.limit(RATE_LIMITS["read"])
async def get_smart_scheduler_status(request: Request) -> SmartSchedulerStatus:
    """Get current smart scheduler status.

    Returns the current phase, interval, stability score, data budget,
    and other status information.
    """
    return SmartSchedulerStatus(**smart_scheduler_service.status)


@router.get("/config", response_model=SmartSchedulerConfig)
@limiter.limit(RATE_LIMITS["read"])
async def get_smart_scheduler_config(request: Request) -> SmartSchedulerConfig:
    """Get smart scheduler configuration."""
    return SmartSchedulerConfig(**smart_scheduler_service.config)


@router.put(
    "/config",
    response_model=SmartSchedulerConfig,
    dependencies=[Depends(require_api_key)],
)
@limiter.limit(RATE_LIMITS["config_update"])
async def update_smart_scheduler_config(
    request: Request, update: SmartSchedulerConfigUpdate
) -> SmartSchedulerConfig:
    """Update smart scheduler configuration.

    Only provided fields will be updated.
    """
    smart_scheduler_service.configure(**update.model_dump(exclude_unset=True))
    return SmartSchedulerConfig(**smart_scheduler_service.config)


@router.post(
    "/enable",
    response_model=SmartSchedulerEnableResponse,
    dependencies=[Depends(require_api_key)],
)
@limiter.limit(RATE_LIMITS["config_update"])
async def enable_smart_scheduler(request: Request) -> SmartSchedulerEnableResponse:
    """Enable smart scheduling.

    When enabled, the scheduler will automatically adjust test intervals
    based on network conditions:
    - More frequent testing when anomalies are detected (burst mode)
    - Gradual recovery to normal intervals when stable
    - Longer intervals during stable off-peak hours
    """
    smart_scheduler_service.enable()
    return SmartSchedulerEnableResponse(
        message="Smart scheduler enabled",
        enabled=True,
    )


@router.post(
    "/disable",
    response_model=SmartSchedulerEnableResponse,
    dependencies=[Depends(require_api_key)],
)
@limiter.limit(RATE_LIMITS["config_update"])
async def disable_smart_scheduler(request: Request) -> SmartSchedulerEnableResponse:
    """Disable smart scheduling.

    When disabled, the scheduler will use the user-configured
    fixed interval for all tests.
    """
    smart_scheduler_service.disable()
    return SmartSchedulerEnableResponse(
        message="Smart scheduler disabled",
        enabled=False,
    )
