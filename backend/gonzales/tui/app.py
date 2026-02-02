"""Gonzales Terminal UI - Demoscene-style speed monitor."""

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from textual.app import App

from gonzales.config import settings
from gonzales.db.engine import async_session, init_db
from gonzales.db.repository import MeasurementRepository
from gonzales.services.measurement_service import measurement_service
from gonzales.services.scheduler_service import scheduler_service
from gonzales.services.speedtest_runner import speedtest_runner
from gonzales.tui.screens.dashboard import DashboardScreen
from gonzales.tui.screens.history import HistoryScreen
from gonzales.tui.screens.settings import SettingsScreen

CSS_PATH = Path(__file__).parent / "styles" / "gonzales.tcss"


class GonzalesApp(App):
    TITLE = "GONZALES Speed Monitor"
    SUB_TITLE = "by Warp9"
    CSS_PATH = CSS_PATH

    MODES = {
        "dashboard": DashboardScreen,
        "history": HistoryScreen,
        "settings": SettingsScreen,
    }

    def __init__(self):
        super().__init__()
        self._countdown_task: asyncio.Task | None = None
        self._refresh_task: asyncio.Task | None = None

    async def on_mount(self) -> None:
        try:
            speedtest_runner.validate_binary()
        except Exception:
            pass

        await init_db()
        scheduler_service.start()

        self.switch_mode("dashboard")
        self._refresh_task = asyncio.create_task(self._auto_refresh())
        self._countdown_task = asyncio.create_task(self._countdown_loop())

    async def _auto_refresh(self) -> None:
        while True:
            try:
                await self._refresh_data()
            except Exception:
                pass
            await asyncio.sleep(10)

    async def _refresh_data(self) -> None:
        async with async_session() as session:
            repo = MeasurementRepository(session)
            latest = await repo.get_latest()
            measurements, _ = await repo.get_paginated(page=1, page_size=50)

        screen = self.screen
        if isinstance(screen, DashboardScreen):
            if latest:
                screen.update_measurement({
                    "download_mbps": latest.download_mbps,
                    "upload_mbps": latest.upload_mbps,
                    "ping_latency_ms": latest.ping_latency_ms,
                    "ping_jitter_ms": latest.ping_jitter_ms,
                    "packet_loss_pct": latest.packet_loss_pct,
                    "timestamp": latest.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "server_name": latest.server_name,
                    "isp": latest.isp,
                })
            if measurements:
                dl_vals = [m.download_mbps for m in reversed(measurements)]
                ul_vals = [m.upload_mbps for m in reversed(measurements)]
                ping_vals = [m.ping_latency_ms for m in reversed(measurements)]
                screen.update_sparklines(dl_vals, ul_vals, ping_vals)

        elif isinstance(screen, HistoryScreen):
            screen.update_data([
                {
                    "id": m.id,
                    "timestamp": m.timestamp.isoformat(),
                    "download_mbps": m.download_mbps,
                    "upload_mbps": m.upload_mbps,
                    "ping_latency_ms": m.ping_latency_ms,
                    "server_name": m.server_name,
                    "below_download_threshold": m.below_download_threshold,
                    "below_upload_threshold": m.below_upload_threshold,
                }
                for m in measurements
            ])

        elif isinstance(screen, SettingsScreen):
            screen.load_settings({
                "test_interval_minutes": settings.test_interval_minutes,
                "download_threshold_mbps": settings.download_threshold_mbps,
                "upload_threshold_mbps": settings.upload_threshold_mbps,
            })

    async def _countdown_loop(self) -> None:
        while True:
            try:
                next_run = scheduler_service.next_run_time
                if next_run:
                    now = datetime.now(timezone.utc)
                    if next_run.tzinfo is None:
                        from datetime import timezone as tz
                        next_run = next_run.replace(tzinfo=tz.utc)
                    diff = (next_run - now).total_seconds()
                    remaining = max(0, int(diff))
                else:
                    remaining = 0

                screen = self.screen
                if isinstance(screen, DashboardScreen):
                    screen.update_countdown(remaining)
            except Exception:
                pass
            await asyncio.sleep(1)

    def run_manual_test(self) -> None:
        asyncio.create_task(self._do_manual_test())

    async def _do_manual_test(self) -> None:
        screen = self.screen
        if isinstance(screen, DashboardScreen):
            screen.update_status("⚡ Running speed test...")

        try:
            async with async_session() as session:
                result = await measurement_service.run_test(session, manual=True)
            if isinstance(screen, DashboardScreen):
                screen.update_status(
                    f"✓ Test complete: ↓{result.download_mbps:.1f} ↑{result.upload_mbps:.1f} Mbps"
                )
            await self._refresh_data()
        except Exception as e:
            if isinstance(screen, DashboardScreen):
                screen.update_status(f"✗ Test failed: {e}")

    async def action_quit(self) -> None:
        if self._countdown_task:
            self._countdown_task.cancel()
        if self._refresh_task:
            self._refresh_task.cancel()
        scheduler_service.stop()
        self.exit()


def main():
    app = GonzalesApp()
    app.run()


if __name__ == "__main__":
    main()
