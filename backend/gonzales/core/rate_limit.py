"""Rate limiting configuration for the Gonzales API.

Uses slowapi to implement rate limiting on sensitive endpoints to prevent
abuse and ensure fair resource usage.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from gonzales.config import settings


def _get_identifier(request: Request) -> str:
    """Get identifier for rate limiting.

    Uses X-Forwarded-For header when running behind a proxy (HA addon),
    otherwise falls back to remote address.
    """
    if settings.ha_addon:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the first IP in the chain (client IP)
            return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Create the limiter instance
limiter = Limiter(
    key_func=_get_identifier,
    default_limits=["100/minute"],  # Default: 100 requests per minute
    storage_uri="memory://",  # In-memory storage (resets on restart)
    strategy="fixed-window",
)

# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Trigger speedtest: expensive operation, limit to 5 per minute
    "speedtest_trigger": "5/minute",
    # Config changes: sensitive, limit to 20 per minute
    "config_update": "20/minute",
    # Delete operations: destructive, limit to 10 per minute
    "delete": "10/minute",
    # Export operations: resource intensive, limit to 10 per minute
    "export": "10/minute",
    # Read operations: generous limits
    "read": "200/minute",
}
