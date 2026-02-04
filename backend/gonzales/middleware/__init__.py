"""Middleware components for the Gonzales API."""

from gonzales.middleware.rate_limit import RateLimitMiddleware

__all__ = ["RateLimitMiddleware"]
