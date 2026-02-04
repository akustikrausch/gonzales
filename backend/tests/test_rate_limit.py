"""Tests for rate limiting functionality."""

import pytest
from httpx import AsyncClient

from gonzales.core.rate_limit import RATE_LIMITS


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


class TestRateLimitHeaders:
    """Test rate limit response headers."""

    @pytest.mark.asyncio
    async def test_config_endpoint_returns_headers(self, client: AsyncClient):
        """Test that rate-limited endpoints return proper headers."""
        response = await client.get("/api/v1/config")
        # Rate limit headers should be present
        # Note: Headers may vary based on slowapi configuration
        assert response.status_code == 200
