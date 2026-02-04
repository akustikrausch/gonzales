"""Webhook notification service for external integrations.

This module provides webhook notifications for speed test events,
allowing integration with services like Slack, Discord, Home Assistant, etc.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any

import aiohttp

from gonzales.config import settings
from gonzales.core.logging import logger


class WebhookService:
    """Service for sending webhook notifications.

    Sends HTTP POST requests to configured webhook URL when
    speed test events occur (completion, failures, outages).
    """

    def __init__(self) -> None:
        """Initialize the webhook service."""
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create the aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            )
        return self._session

    async def close(self) -> None:
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def send_notification(
        self,
        event_type: str,
        data: dict[str, Any],
    ) -> bool:
        """Send a webhook notification.

        Args:
            event_type: Type of event (e.g., 'speedtest_complete', 'outage_detected').
            data: Event data to include in the payload.

        Returns:
            True if the webhook was sent successfully, False otherwise.
        """
        if not settings.webhook_url:
            return False

        payload = {
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "gonzales",
            "data": data,
        }

        try:
            session = await self._get_session()
            async with session.post(
                settings.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as response:
                if response.status < 400:
                    logger.debug(
                        "Webhook sent successfully: %s (status=%d)",
                        event_type,
                        response.status,
                    )
                    return True
                else:
                    logger.warning(
                        "Webhook failed: %s (status=%d)",
                        event_type,
                        response.status,
                    )
                    return False
        except asyncio.TimeoutError:
            logger.warning("Webhook timeout for event: %s", event_type)
            return False
        except aiohttp.ClientError as e:
            logger.warning("Webhook error for %s: %s", event_type, e)
            return False
        except Exception as e:
            logger.error("Unexpected webhook error for %s: %s", event_type, e)
            return False

    async def notify_speedtest_complete(
        self,
        download_mbps: float,
        upload_mbps: float,
        ping_ms: float,
        jitter_ms: float,
        server_name: str,
        below_threshold: bool = False,
    ) -> bool:
        """Send notification when a speed test completes.

        Args:
            download_mbps: Download speed in Mbps.
            upload_mbps: Upload speed in Mbps.
            ping_ms: Ping latency in milliseconds.
            jitter_ms: Jitter in milliseconds.
            server_name: Name of the test server.
            below_threshold: Whether the result was below configured thresholds.

        Returns:
            True if notification was sent successfully.
        """
        return await self.send_notification(
            "speedtest_complete",
            {
                "download_mbps": round(download_mbps, 2),
                "upload_mbps": round(upload_mbps, 2),
                "ping_ms": round(ping_ms, 2),
                "jitter_ms": round(jitter_ms, 2),
                "server_name": server_name,
                "below_threshold": below_threshold,
            },
        )

    async def notify_outage_detected(
        self,
        consecutive_failures: int,
        error_message: str,
    ) -> bool:
        """Send notification when an outage is detected.

        Args:
            consecutive_failures: Number of consecutive test failures.
            error_message: Error message from the last failure.

        Returns:
            True if notification was sent successfully.
        """
        return await self.send_notification(
            "outage_detected",
            {
                "consecutive_failures": consecutive_failures,
                "error_message": error_message,
            },
        )

    async def notify_outage_resolved(
        self,
        duration_seconds: float,
        consecutive_failures: int,
    ) -> bool:
        """Send notification when an outage is resolved.

        Args:
            duration_seconds: Duration of the outage in seconds.
            consecutive_failures: Number of failures during the outage.

        Returns:
            True if notification was sent successfully.
        """
        return await self.send_notification(
            "outage_resolved",
            {
                "duration_seconds": round(duration_seconds, 0),
                "duration_minutes": round(duration_seconds / 60, 1),
                "consecutive_failures": consecutive_failures,
            },
        )

    async def notify_threshold_violation(
        self,
        download_mbps: float,
        upload_mbps: float,
        download_threshold: float,
        upload_threshold: float,
    ) -> bool:
        """Send notification when speed is below threshold.

        Args:
            download_mbps: Actual download speed.
            upload_mbps: Actual upload speed.
            download_threshold: Expected download threshold.
            upload_threshold: Expected upload threshold.

        Returns:
            True if notification was sent successfully.
        """
        return await self.send_notification(
            "threshold_violation",
            {
                "download_mbps": round(download_mbps, 2),
                "upload_mbps": round(upload_mbps, 2),
                "download_threshold": round(download_threshold, 2),
                "upload_threshold": round(upload_threshold, 2),
                "download_deficit_pct": round(
                    (1 - download_mbps / download_threshold) * 100, 1
                )
                if download_threshold > 0
                else 0,
                "upload_deficit_pct": round(
                    (1 - upload_mbps / upload_threshold) * 100, 1
                )
                if upload_threshold > 0
                else 0,
            },
        )


webhook_service = WebhookService()
