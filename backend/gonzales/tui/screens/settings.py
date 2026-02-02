from textual.app import ComposeResult
from textual.containers import Container, Vertical
from textual.screen import Screen
from textual.widgets import Footer, Header, Input, Label, Static


class SettingsScreen(Screen):
    BINDINGS = [
        ("d", "app.switch_mode('dashboard')", "Dashboard"),
        ("h", "app.switch_mode('history')", "History"),
        ("s", "app.switch_mode('settings')", "Settings"),
        ("q", "app.quit", "Quit"),
    ]

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Container(id="settings-container"):
            yield Static("  ═══ SETTINGS ═══", id="settings-title")
            with Vertical(id="settings-form"):
                yield Label("Test Interval (minutes):")
                yield Input(
                    placeholder="5",
                    id="interval-input",
                    type="integer",
                )
                yield Label("Download Threshold (Mbps):")
                yield Input(
                    placeholder="1000.0",
                    id="dl-threshold-input",
                    type="number",
                )
                yield Label("Upload Threshold (Mbps):")
                yield Input(
                    placeholder="500.0",
                    id="ul-threshold-input",
                    type="number",
                )
            yield Static("", id="settings-status")
        yield Footer()

    def load_settings(self, config: dict) -> None:
        self.query_one("#interval-input", Input).value = str(
            config.get("test_interval_minutes", 5)
        )
        self.query_one("#dl-threshold-input", Input).value = str(
            config.get("download_threshold_mbps", 1000.0)
        )
        self.query_one("#ul-threshold-input", Input).value = str(
            config.get("upload_threshold_mbps", 500.0)
        )

    def get_settings(self) -> dict:
        return {
            "test_interval_minutes": int(
                self.query_one("#interval-input", Input).value or "5"
            ),
            "download_threshold_mbps": float(
                self.query_one("#dl-threshold-input", Input).value or "1000.0"
            ),
            "upload_threshold_mbps": float(
                self.query_one("#ul-threshold-input", Input).value or "500.0"
            ),
        }

    def show_status(self, msg: str) -> None:
        self.query_one("#settings-status", Static).update(f"  {msg}")
