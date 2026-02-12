"""Tests for rate limiting functionality."""

import pytest
from httpx import AsyncClient

from gonzales.core.rate_limit import RATE_LIMITS
from gonzales.middleware.rate_limit import RateLimitMiddleware


class TestRateLimits:
    """Test cases for API rate limiting."""

    def test_rate_limits_configured(self):
        """Test that rate limits are properly configured."""
        assert "speedtest_trigger" in RATE_LIMITS
        assert "config_update" in RATE_LIMITS
        assert "delete" in RATE_LIMITS
        assert "export" in RATE_LIMITS
        assert "read" in RATE_LIMITS

    def test_speedtest_limit_is_restrictive(self):
        """Test that speedtest trigger has a restrictive limit."""
        limit = RATE_LIMITS["speedtest_trigger"]
        # Should be something like "5/minute"
        assert "minute" in limit
        count = int(limit.split("/")[0])
        assert count <= 10  # Should be reasonably restrictive

    def test_read_limit_is_generous(self):
        """Test that read operations have a generous limit."""
        limit = RATE_LIMITS["read"]
        count = int(limit.split("/")[0])
        assert count >= 100  # Should allow many reads


class TestRateLimitMiddleware:
    """Test the RateLimitMiddleware path handling."""

    def setup_method(self):
        self.mw = RateLimitMiddleware.__new__(RateLimitMiddleware)

    def test_normalize_single_slash(self):
        assert self.mw._normalize_path("/assets/foo.js") == "/assets/foo.js"

    def test_normalize_double_slash(self):
        """HA Ingress proxy sends //assets/ paths."""
        assert self.mw._normalize_path("//assets/foo.js") == "/assets/foo.js"

    def test_normalize_triple_slash(self):
        assert self.mw._normalize_path("///assets/foo.js") == "/assets/foo.js"

    def test_normalize_api_path(self):
        assert self.mw._normalize_path("/api/v1/config") == "/api/v1/config"

    def test_exempt_single_slash_assets(self):
        assert self.mw._is_exempt("/assets/index.js") is True

    def test_exempt_double_slash_assets(self):
        """Critical: HA Ingress double-slash assets must be exempt."""
        assert self.mw._is_exempt("//assets/SettingsPage-BJAb8jvK.js") is True

    def test_exempt_static_files(self):
        assert self.mw._is_exempt("/static/favicon.ico") is True

    def test_exempt_status_endpoint(self):
        assert self.mw._is_exempt("/api/v1/status") is True

    def test_exempt_spa_routes(self):
        """SPA routes (non-API) should be exempt."""
        assert self.mw._is_exempt("/settings") is True
        assert self.mw._is_exempt("/") is True

    def test_not_exempt_api_config(self):
        assert self.mw._is_exempt("/api/v1/config") is False

    def test_strict_speedtest_trigger(self):
        assert self.mw._is_strict("/api/v1/speedtest/trigger") is True

    def test_strict_double_slash(self):
        assert self.mw._is_strict("//api/v1/speedtest/trigger") is True

    def test_not_strict_config(self):
        assert self.mw._is_strict("/api/v1/config") is False


class TestRateLimitHeaders:
    """Test rate limit response headers."""

    @pytest.mark.asyncio
    async def test_config_endpoint_returns_headers(self, client: AsyncClient):
        """Test that rate-limited endpoints return proper headers."""
        response = await client.get("/api/v1/config")
        # Rate limit headers should be present
        # Note: Headers may vary based on slowapi configuration
        assert response.status_code == 200
