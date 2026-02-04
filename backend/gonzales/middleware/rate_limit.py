"""
Rate limiting middleware for API protection.

Implements a simple in-memory token bucket algorithm to limit
request rates per client IP address.
"""
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


@dataclass
class TokenBucket:
    """Token bucket for rate limiting."""
    capacity: int
    tokens: float = field(init=False)
    last_update: float = field(init=False)
    refill_rate: float  # tokens per second

    def __post_init__(self) -> None:
        self.tokens = float(self.capacity)
        self.last_update = time.monotonic()

    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from the bucket.

        Returns True if tokens were consumed, False if rate limited.
        """
        now = time.monotonic()
        elapsed = now - self.last_update
        self.last_update = now

        # Refill tokens based on elapsed time
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    @property
    def retry_after(self) -> int:
        """Seconds until enough tokens are available."""
        if self.tokens >= 1:
            return 0
        needed = 1 - self.tokens
        return int(needed / self.refill_rate) + 1


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using token bucket algorithm.

    Limits requests per IP address to prevent abuse while allowing
    burst traffic within reasonable limits.

    Configuration:
    - requests_per_minute: Average sustained request rate
    - burst_size: Maximum burst of requests allowed

    Example: 60 requests/minute with burst of 10 allows:
    - Sustained: 1 request per second
    - Burst: Up to 10 requests instantly, then rate limited
    """

    # Endpoints exempt from rate limiting
    EXEMPT_PATHS = {
        "/health",
        "/api/v1/status",
        "/api/v1/measurements/stream",  # SSE already rate-limited by nature
        "/docs",
        "/openapi.json",
    }

    # Endpoints with stricter limits (resource-intensive)
    STRICT_PATHS = {
        "/api/v1/measurements/trigger",
        "/api/v1/topology/analyze",
        "/api/v1/export",
    }

    def __init__(
        self,
        app,
        requests_per_minute: int = 120,
        burst_size: int = 20,
        strict_requests_per_minute: int = 6,
        strict_burst_size: int = 2,
        enabled: bool = True,
    ):
        super().__init__(app)
        self.enabled = enabled
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.strict_requests_per_minute = strict_requests_per_minute
        self.strict_burst_size = strict_burst_size

        # Normal rate limit buckets per IP
        self._buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(
                capacity=burst_size,
                refill_rate=requests_per_minute / 60.0,
            )
        )

        # Strict rate limit buckets for resource-intensive endpoints
        self._strict_buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(
                capacity=strict_burst_size,
                refill_rate=strict_requests_per_minute / 60.0,
            )
        )

        # Track last cleanup time
        self._last_cleanup = time.monotonic()
        self._cleanup_interval = 300  # Clean up every 5 minutes

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, considering proxy headers."""
        # Check X-Forwarded-For header (common for reverse proxies)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the first IP in the chain
            return forwarded.split(",")[0].strip()

        # Check X-Real-IP header (nginx default)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fall back to direct client IP
        if request.client:
            return request.client.host

        return "unknown"

    def _cleanup_old_buckets(self) -> None:
        """Remove stale buckets to prevent memory growth."""
        now = time.monotonic()
        if now - self._last_cleanup < self._cleanup_interval:
            return

        self._last_cleanup = now

        # Remove buckets that haven't been used in 10 minutes
        stale_threshold = 600
        stale_ips = [
            ip for ip, bucket in self._buckets.items()
            if now - bucket.last_update > stale_threshold
        ]
        for ip in stale_ips:
            del self._buckets[ip]

        # Same for strict buckets
        stale_ips = [
            ip for ip, bucket in self._strict_buckets.items()
            if now - bucket.last_update > stale_threshold
        ]
        for ip in stale_ips:
            del self._strict_buckets[ip]

    def _is_exempt(self, path: str) -> bool:
        """Check if path is exempt from rate limiting."""
        # Static files
        if path.startswith("/static/") or path.startswith("/assets/"):
            return True

        # Exact match exempt paths
        if path in self.EXEMPT_PATHS:
            return True

        return False

    def _is_strict(self, path: str) -> bool:
        """Check if path needs stricter rate limits."""
        return path in self.STRICT_PATHS

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request with rate limiting."""
        if not self.enabled:
            return await call_next(request)

        path = request.url.path

        # Skip rate limiting for exempt paths
        if self._is_exempt(path):
            return await call_next(request)

        # Periodic cleanup
        self._cleanup_old_buckets()

        client_ip = self._get_client_ip(request)

        # Choose appropriate bucket
        if self._is_strict(path):
            bucket = self._strict_buckets[client_ip]
            limit_type = "strict"
        else:
            bucket = self._buckets[client_ip]
            limit_type = "normal"

        # Try to consume a token
        if not bucket.consume():
            retry_after = bucket.retry_after
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please slow down.",
                    "retry_after": retry_after,
                    "limit_type": limit_type,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(
                        self.strict_requests_per_minute if self._is_strict(path)
                        else self.requests_per_minute
                    ),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after),
                },
            )

        # Add rate limit headers to successful responses
        response = await call_next(request)

        # Add informational headers
        response.headers["X-RateLimit-Limit"] = str(
            self.strict_requests_per_minute if self._is_strict(path)
            else self.requests_per_minute
        )
        response.headers["X-RateLimit-Remaining"] = str(int(bucket.tokens))

        return response
