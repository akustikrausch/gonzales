"""Tests for the REST API endpoints."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from gonzales.db.models import Measurement
from gonzales.db.repository import MeasurementRepository

from .conftest import TestSessionLocal


async def _seed_measurements(count: int = 5, base_dl: float = 500.0):
    """Insert test measurements into the DB."""
    base = datetime(2025, 6, 1, 12, 0, tzinfo=timezone.utc)
    async with TestSessionLocal() as session:
        repo = MeasurementRepository(session)
        for i in range(count):
            m = Measurement(
                download_bps=(base_dl + i * 10) * 125_000,
                upload_bps=250 * 125_000,
                download_mbps=base_dl + i * 10,
                upload_mbps=250.0,
                ping_latency_ms=12.0,
                ping_jitter_ms=2.0,
                packet_loss_pct=0.0,
                isp="Test ISP",
                server_id=1,
                server_name="Test Server",
                server_location="Berlin",
                server_country="DE",
                internal_ip="192.168.1.1",
                external_ip="1.2.3.4",
                interface_name="eth0",
                is_vpn=False,
                result_id=f"test-{i}",
                result_url=f"https://speedtest.net/{i}",
                raw_json="{}",
                below_download_threshold=False,
                below_upload_threshold=False,
                timestamp=base + timedelta(hours=i),
            )
            await repo.create(m)


class TestMeasurementsAPI:
    async def test_list_empty(self, client):
        resp = await client.get("/api/v1/measurements")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    async def test_list_with_data(self, client):
        await _seed_measurements(3)
        resp = await client.get("/api/v1/measurements")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    async def test_list_pagination(self, client):
        await _seed_measurements(5)
        resp = await client.get("/api/v1/measurements?page=1&page_size=2")
        data = resp.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["pages"] == 3

    async def test_get_latest(self, client):
        await _seed_measurements(3)
        resp = await client.get("/api/v1/measurements/latest")
        assert resp.status_code == 200
        data = resp.json()
        assert data["download_mbps"] == 520.0  # 500 + 2*10

    async def test_get_latest_empty(self, client):
        resp = await client.get("/api/v1/measurements/latest")
        assert resp.status_code == 200
        assert resp.json() is None

    async def test_get_by_id(self, client):
        await _seed_measurements(1)
        resp = await client.get("/api/v1/measurements/1")
        assert resp.status_code == 200
        assert resp.json()["id"] == 1

    async def test_get_by_id_not_found(self, client):
        resp = await client.get("/api/v1/measurements/999")
        assert resp.status_code == 404

    async def test_delete_measurement(self, client):
        await _seed_measurements(1)
        resp = await client.delete("/api/v1/measurements/1")
        assert resp.status_code == 200
        assert resp.json()["detail"] == "Measurement deleted"

        resp = await client.get("/api/v1/measurements/1")
        assert resp.status_code == 404

    async def test_delete_not_found(self, client):
        resp = await client.delete("/api/v1/measurements/999")
        assert resp.status_code == 404


class TestStatisticsAPI:
    async def test_basic_stats_empty(self, client):
        resp = await client.get("/api/v1/statistics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_tests"] == 0
        assert data["download"] is None

    async def test_basic_stats_with_data(self, client):
        await _seed_measurements(5)
        resp = await client.get("/api/v1/statistics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_tests"] == 5
        assert data["download"] is not None
        assert data["download"]["min"] == 500.0
        assert data["download"]["max"] == 540.0

    async def test_enhanced_stats(self, client):
        await _seed_measurements(5)
        resp = await client.get("/api/v1/statistics/enhanced")
        assert resp.status_code == 200
        data = resp.json()
        assert "basic" in data
        assert "hourly" in data
        assert len(data["hourly"]) == 24
        assert "daily" in data
        assert len(data["daily"]) == 7
        assert "trend" in data
        assert "sla" in data
        assert "reliability" in data


class TestStatusAPI:
    async def test_status(self, client):
        resp = await client.get("/api/v1/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "scheduler" in data
        assert "uptime_seconds" in data
        assert "total_measurements" in data
        assert data["total_measurements"] == 0


class TestAPIKeyProtection:
    async def test_delete_without_key_when_key_set(self, client):
        await _seed_measurements(1)
        with patch("gonzales.api.dependencies.settings") as mock_settings:
            mock_settings.api_key = "secret123"
            resp = await client.delete("/api/v1/measurements/1")
            assert resp.status_code == 403

    async def test_delete_with_correct_key(self, client):
        await _seed_measurements(1)
        with patch("gonzales.api.dependencies.settings") as mock_settings:
            mock_settings.api_key = "secret123"
            resp = await client.delete(
                "/api/v1/measurements/1",
                headers={"X-API-Key": "secret123"},
            )
            assert resp.status_code == 200

    async def test_delete_with_wrong_key(self, client):
        await _seed_measurements(1)
        with patch("gonzales.api.dependencies.settings") as mock_settings:
            mock_settings.api_key = "secret123"
            resp = await client.delete(
                "/api/v1/measurements/1",
                headers={"X-API-Key": "wrongkey"},
            )
            assert resp.status_code == 403

    async def test_no_key_required_when_not_configured(self, client):
        await _seed_measurements(1)
        with patch("gonzales.api.dependencies.settings") as mock_settings:
            mock_settings.api_key = ""
            resp = await client.delete("/api/v1/measurements/1")
            assert resp.status_code == 200
