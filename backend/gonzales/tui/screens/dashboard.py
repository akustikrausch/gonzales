from datetime import datetime, timezone

from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Footer, Header, Static

from gonzales.tui.widgets.ascii_banner import BANNER, SUBTITLE
from gonzales.tui.widgets.sparkline import Sparkline
from gonzales.tui.widgets.speed_gauge import SpeedGauge


class DashboardScreen(Screen):
    BINDINGS = [
        ("d", "app.switch_mode('dashboard')", "Dashboard"),
        ("h", "app.switch_mode('history')", "History"),
        ("a", "app.switch_mode('statistics')", "Analytics"),
        ("s", "app.switch_mode('settings')", "Settings"),
        ("t", "test_now", "Test"),
        ("?", "show_help", "Help"),
        ("q", "app.quit", "Quit"),
    ]

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Container(id="dashboard-container"):
            yield Static(BANNER, id="banner", classes="banner-art")
            yield Static(SUBTITLE, id="subtitle", classes="banner-subtitle")
            yield Static("", id="status-line")
            with Horizontal(id="gauges"):
                yield SpeedGauge(
                    label="↓ DOWNLOAD",
                    color="cyan",
                    max_value=1000.0,
                    id="dl-gauge",
                )
                yield SpeedGauge(
                    label="↑ UPLOAD",
                    color="magenta",
                    max_value=500.0,
                    id="ul-gauge",
                )
            with Horizontal(id="ping-row"):
                yield Static("  Ping: -- ms", id="ping-display")
                yield Static("  Jitter: -- ms", id="jitter-display")
                yield Static("  Packet Loss: --%", id="loss-display")
            with Vertical(id="sparklines"):
                yield Sparkline(label="DL History", id="dl-sparkline")
                yield Sparkline(label="UL History", id="ul-sparkline")
                yield Sparkline(label="Ping History", id="ping-sparkline")
            yield Static("  Next test: --:--", id="countdown")
            yield Static("", id="last-test-info")
        yield Footer()

    def update_measurement(self, data: dict) -> None:
        dl_gauge = self.query_one("#dl-gauge", SpeedGauge)
        ul_gauge = self.query_one("#ul-gauge", SpeedGauge)
        dl_gauge.update_value(data.get("download_mbps", 0))
        ul_gauge.update_value(data.get("upload_mbps", 0))

        ping = data.get("ping_latency_ms", 0)
        jitter = data.get("ping_jitter_ms", 0)
        loss = data.get("packet_loss_pct")

        self.query_one("#ping-display", Static).update(f"  Ping: {ping:.1f} ms")
        self.query_one("#jitter-display", Static).update(f"  Jitter: {jitter:.1f} ms")
        loss_str = f"{loss:.1f}%" if loss is not None else "N/A"
        self.query_one("#loss-display", Static).update(f"  Packet Loss: {loss_str}")

        ts = data.get("timestamp", "")
        server = data.get("server_name", "")
        isp = data.get("isp", "")
        self.query_one("#last-test-info", Static).update(
            f"  Last: {ts}  |  Server: {server}  |  ISP: {isp}"
        )

    def update_sparklines(self, dl_vals: list[float], ul_vals: list[float], ping_vals: list[float]) -> None:
        self.query_one("#dl-sparkline", Sparkline).update_values(dl_vals)
        self.query_one("#ul-sparkline", Sparkline).update_values(ul_vals)
        self.query_one("#ping-sparkline", Sparkline).update_values(ping_vals)

    def update_countdown(self, seconds_remaining: int) -> None:
        minutes = seconds_remaining // 60
        secs = seconds_remaining % 60
        self.query_one("#countdown", Static).update(f"  Next test: {minutes:02d}:{secs:02d}")

    def update_status(self, msg: str) -> None:
        self.query_one("#status-line", Static).update(f"  {msg}")

    def action_test_now(self) -> None:
        self.app.run_test_screen()

    def action_show_help(self) -> None:
        """Show help modal."""
        self.app.push_screen("help")
