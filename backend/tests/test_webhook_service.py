"""Tests for the webhook notification service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiohttp import ClientError

from gonzales.services.webhook_service import WebhookService


class TestWebhookService:
    """Test cases for WebhookService."""

    @pytest.mark.asyncio
    async def test_send_notification_disabled_when_no_url(self):
        """Test that notifications are skipped when no webhook URL is configured."""
        service = WebhookService()

        with patch("gonzales.services.webhook_service.settings") as mock_settings:
            mock_settings.webhook_url = ""
            result = await service.send_notification("test_event", {"key": "value"})

        assert result is False

    @pytest.mark.asyncio
    async def test_send_notification_success(self):
        """Test successful webhook notification."""
        service = WebhookService()

        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.__aenter__.return_value = mock_response

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session.closed = False

        with patch("gonzales.services.webhook_service.settings") as mock_settings:
            mock_settings.webhook_url = "https://example.com/webhook"
            service._session = mock_session

            result = await service.send_notification("test_event", {"key": "value"})

        assert result is True
        mock_session.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_notification_http_error(self):
        """Test webhook notification with HTTP error response."""
        service = WebhookService()

        mock_response = AsyncMock()
        mock_response.status = 500
        mock_response.__aenter__.return_value = mock_response

        mock_session = MagicMock()
        mock_session.post.return_value = mock_response
        mock_session.closed = False

        with patch("gonzales.services.webhook_service.settings") as mock_settings:
            mock_settings.webhook_url = "https://example.com/webhook"
            service._session = mock_session

            result = await service.send_notification("test_event", {})

        assert result is False

    @pytest.mark.asyncio
    async def test_send_notification_client_error(self):
        """Test webhook notification with client error."""
        service = WebhookService()

        mock_session = MagicMock()
        mock_session.post.side_effect = ClientError("Connection failed")
        mock_session.closed = False

        with patch("gonzales.services.webhook_service.settings") as mock_settings:
            mock_settings.webhook_url = "https://example.com/webhook"
            service._session = mock_session

            result = await service.send_notification("test_event", {})

        assert result is False

    @pytest.mark.asyncio
    async def test_notify_speedtest_complete(self):
        """Test speedtest complete notification."""
        service = WebhookService()

        with patch.object(service, "send_notification", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await service.notify_speedtest_complete(
                download_mbps=500.123,
                upload_mbps=250.456,
                ping_ms=10.5,
                jitter_ms=2.3,
                server_name="Test Server",
                below_threshold=False,
            )

        assert result is True
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args[0][0] == "speedtest_complete"
        assert call_args[0][1]["download_mbps"] == 500.12
        assert call_args[0][1]["upload_mbps"] == 250.46
        assert call_args[0][1]["below_threshold"] is False

    @pytest.mark.asyncio
    async def test_notify_outage_detected(self):
        """Test outage detected notification."""
        service = WebhookService()

        with patch.object(service, "send_notification", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await service.notify_outage_detected(
                consecutive_failures=3,
                error_message="Connection timeout",
            )

        assert result is True
        mock_send.assert_called_once_with(
            "outage_detected",
            {
                "consecutive_failures": 3,
                "error_message": "Connection timeout",
            },
        )

    @pytest.mark.asyncio
    async def test_notify_outage_resolved(self):
        """Test outage resolved notification."""
        service = WebhookService()

        with patch.object(service, "send_notification", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await service.notify_outage_resolved(
                duration_seconds=300.5,
                consecutive_failures=5,
            )

        assert result is True
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args[0][0] == "outage_resolved"
        assert call_args[0][1]["duration_seconds"] == 301
        assert call_args[0][1]["duration_minutes"] == 5.0
        assert call_args[0][1]["consecutive_failures"] == 5

    @pytest.mark.asyncio
    async def test_notify_threshold_violation(self):
        """Test threshold violation notification."""
        service = WebhookService()

        with patch.object(service, "send_notification", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await service.notify_threshold_violation(
                download_mbps=800.0,
                upload_mbps=400.0,
                download_threshold=1000.0,
                upload_threshold=500.0,
            )

        assert result is True
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args[0][0] == "threshold_violation"
        assert call_args[0][1]["download_deficit_pct"] == 20.0
        assert call_args[0][1]["upload_deficit_pct"] == 20.0

    @pytest.mark.asyncio
    async def test_close_session(self):
        """Test session cleanup."""
        service = WebhookService()

        mock_session = MagicMock()
        mock_session.closed = False
        mock_session.close = AsyncMock()
        service._session = mock_session

        await service.close()

        mock_session.close.assert_called_once()
