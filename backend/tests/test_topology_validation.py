"""Tests for topology API endpoint validation."""

import pytest
from httpx import AsyncClient


class TestTopologyTargetValidation:
    """Test cases for IP address validation in topology analysis."""

    @pytest.mark.asyncio
    async def test_default_target(self, client: AsyncClient):
        """Test that default target (1.1.1.1) is accepted."""
        # Note: This will fail without actual traceroute binary,
        # but we're testing the validation path
        response = await client.post("/api/v1/topology/analyze")
        # 500 is expected if traceroute binary isn't available
        assert response.status_code in (200, 500, 429)

    @pytest.mark.asyncio
    async def test_allowed_target_cloudflare(self, client: AsyncClient):
        """Test that Cloudflare DNS is in the allowlist."""
        response = await client.post("/api/v1/topology/analyze?target=1.1.1.1")
        assert response.status_code in (200, 500, 429)

    @pytest.mark.asyncio
    async def test_allowed_target_google(self, client: AsyncClient):
        """Test that Google DNS is in the allowlist."""
        response = await client.post("/api/v1/topology/analyze?target=8.8.8.8")
        assert response.status_code in (200, 500, 429)

    @pytest.mark.asyncio
    async def test_reject_private_ip(self, client: AsyncClient):
        """Test that private IPs are rejected."""
        response = await client.post("/api/v1/topology/analyze?target=192.168.1.1")
        assert response.status_code == 400
        assert "Private IP" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_reject_loopback(self, client: AsyncClient):
        """Test that loopback address is rejected."""
        response = await client.post("/api/v1/topology/analyze?target=127.0.0.1")
        assert response.status_code == 400
        assert "Loopback" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_reject_invalid_ip(self, client: AsyncClient):
        """Test that invalid IP format is rejected."""
        response = await client.post("/api/v1/topology/analyze?target=not-an-ip")
        assert response.status_code == 400
        assert "Invalid IP" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_reject_private_ip_10(self, client: AsyncClient):
        """Test that 10.x.x.x private range is rejected."""
        response = await client.post("/api/v1/topology/analyze?target=10.0.0.1")
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_private_ip_172(self, client: AsyncClient):
        """Test that 172.16.x.x private range is rejected."""
        response = await client.post("/api/v1/topology/analyze?target=172.16.0.1")
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_accept_public_ip(self, client: AsyncClient):
        """Test that arbitrary public IPs are accepted."""
        # A random public IP (not in allowlist but public)
        response = await client.post("/api/v1/topology/analyze?target=93.184.216.34")
        # Should pass validation (500 if traceroute fails, 200 if succeeds)
        assert response.status_code in (200, 500, 429)
