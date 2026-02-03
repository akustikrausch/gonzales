from collections.abc import AsyncGenerator

from fastapi import HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.db.engine import get_session

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def require_api_key(
    request: Request,
    api_key: str | None = Security(_api_key_header),
) -> None:
    """Protect mutating endpoints when GONZALES_API_KEY is set.

    If no API key is configured, all requests are allowed (backwards compatible).
    If an API key is configured, the request must include a matching X-API-Key header.

    In Home Assistant addon mode, requests through Ingress are trusted.
    HA Ingress handles authentication, so we trust all requests in addon mode.
    """
    if not settings.api_key:
        return

    # In HA addon mode, trust all requests - Ingress handles auth
    # We check for common HA headers OR just trust if ha_addon is enabled
    # since the addon runs behind HA's authentication layer
    if settings.ha_addon:
        # Check for any HA Ingress indicators (case-insensitive)
        ha_headers = ["x-ingress-path", "x-ha-access", "x-hassio-key", "x-supervisor-token"]
        for header in ha_headers:
            if header in request.headers:
                return
        # Even without headers, in addon mode we trust the request
        # because the addon only receives requests through HA's Ingress proxy
        return

    if api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key",
        )
