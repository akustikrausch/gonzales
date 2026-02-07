"""Real-time speed test screen with live gauge visualization."""

import asyncio

from textual.app import ComposeResult
from textual.containers import Container
from textual.screen import Screen
from textual.widgets import Footer, Header, Static

from gonzales.services.event_bus import event_bus
from gonzales.tui.widgets.live_gauge import LiveGauge


class TestScreen(Screen):
    BINDINGS = [
        ("d", "app.switch_mode('dashboard')", "Dashboard"),
        ("h", "app.switch_mode('history')", "History"),
        ("a", "app.switch_mode('statistics')", "Analytics"),
        ("s", "app.switch_mode('settings')", "Settings"),
        ("t", "run_test", "New Test"),
        ("?", "show_help", "Help"),
        ("q", "app.quit", "Quit"),
    ]

    def __init__(self, auto_start: bool = False, **kwargs):
        super().__init__(**kwargs)
        self._auto_start = auto_start
        self._test_task: asyncio.Task | None = None
        self._listen_task: asyncio.Task | None = None
        self._running = False

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Container(id="test-container"):
            yield Static("  ═══ SPEED TEST ═══", id="test-title")
            yield LiveGauge(id="live-gauge")
            yield Static("  Press [bold cyan]T[/] to start a new test", id="test-hint")
        yield Footer()

    def on_mount(self) -> None:
        from gonzales.services.measurement_service import measurement_service

        if self._auto_start:
            self._start_test()
        elif measurement_service.test_in_progress:
            # A test is running in the background (user navigated away and back).
            # Reconnect to the event bus to pick up remaining progress/completion.
            self._running = True
            gauge = self.query_one("#live-gauge", LiveGauge)
            gauge.set_phase("started")
            hint = self.query_one("#test-hint", Static)
            hint.update("  [yellow]Test in progress...[/]")
            self._listen_task = asyncio.create_task(self._listen_events())

    def on_unmount(self) -> None:
        # Only cancel the listener; do NOT cancel _test_task so the speedtest
        # keeps running in the background and results are saved to the DB.
        if self._listen_task and not self._listen_task.done():
            self._listen_task.cancel()
            self._listen_task = None

    def action_run_test(self) -> None:
        if not self._running:
            self._start_test()

    def _start_test(self) -> None:
        self._running = True
        gauge = self.query_one("#live-gauge", LiveGauge)
        gauge.set_phase("started")
        hint = self.query_one("#test-hint", Static)
        hint.update("  [yellow]Test in progress...[/]")

        # Start listening for events first, then trigger the test
        self._listen_task = asyncio.create_task(self._listen_events())
        self._test_task = asyncio.create_task(self._trigger_test())

    async def _trigger_test(self) -> None:
        """Trigger the speed test via the measurement service."""
        try:
            from gonzales.db.engine import async_session
            from gonzales.services.measurement_service import measurement_service

            async with async_session() as session:
                await measurement_service.run_test(session, manual=True)
        except asyncio.CancelledError:
            # Screen unmounted while test was starting; the measurement_service
            # holds its own lock and will finish independently.
            pass
        except Exception as e:
            try:
                gauge = self.query_one("#live-gauge", LiveGauge)
                gauge.set_error(str(e))
                self._finish_test()
            except Exception:
                # Screen already unmounted, UI update not possible
                pass

    async def _listen_events(self) -> None:
        """Subscribe to event bus and update the gauge in real-time."""
        gauge = self.query_one("#live-gauge", LiveGauge)

        try:
            async for event in event_bus.subscribe():
                event_type = event.get("event", "")
                data = event.get("data", {})
                phase = data.get("phase", "")

                if event_type == "started":
                    gauge.set_phase("started")

                elif event_type == "progress":
                    if phase == "ping":
                        gauge.set_phase("ping")
                        gauge.set_ping(
                            data.get("ping_ms", 0),
                            data.get("progress", 0),
                        )
                    elif phase == "download":
                        gauge.set_phase("download")
                        gauge.set_bandwidth(
                            data.get("bandwidth_mbps", 0),
                            data.get("progress", 0),
                            data.get("elapsed", 0),
                        )
                    elif phase == "upload":
                        gauge.set_phase("upload")
                        gauge.set_bandwidth(
                            data.get("bandwidth_mbps", 0),
                            data.get("progress", 0),
                            data.get("elapsed", 0),
                        )

                elif event_type == "complete":
                    gauge.set_result(data)
                    self._finish_test()
                    break

                elif event_type == "error":
                    gauge.set_error(data.get("message", "Test failed"))
                    self._finish_test()
                    break

        except asyncio.CancelledError:
            pass
        except Exception as e:
            gauge.set_error(str(e))
            self._finish_test()

    def _finish_test(self) -> None:
        self._running = False
        hint = self.query_one("#test-hint", Static)
        hint.update("  Press [bold cyan]T[/] to start a new test")

    def action_show_help(self) -> None:
        """Show help modal."""
        self.app.push_screen("help")
