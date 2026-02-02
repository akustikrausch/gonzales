from collections.abc import AsyncGenerator

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.config import settings
from gonzales.db.engine import get_session

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def require_api_key(
    api_key: str | None = Security(_api_key_header),
) -> None:
    """Protect mutating endpoints when GONZALES_API_KEY is set.

    If no API key is configured, all requests are allowed (backwards compatible).
    If an API key is configured, the request must include a matching X-API-Key header.
    """
    if not settings.api_key:
        return
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key",
        )
