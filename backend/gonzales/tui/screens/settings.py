from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Input, Label, Static, Switch


class SettingsScreen(Screen):
    BINDINGS = [
        ("d", "app.switch_mode('dashboard')", "Dashboard"),
        ("h", "app.switch_mode('history')", "History"),
        ("a", "app.switch_mode('statistics')", "Analytics"),
        ("s", "app.switch_mode('settings')", "Settings"),
        ("t", "test_now", "Test"),
        ("ctrl+s", "save_settings", "Save"),
        ("?", "show_help", "Help"),
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
                yield Static("")
                with Horizontal(id="randomize-row"):
                    yield Label("Randomize Schedule:")
                    yield Switch(id="randomize-switch", value=False)
                yield Static("")
                with Horizontal(id="settings-buttons"):
                    yield Button("Save [Ctrl+S]", id="save-btn", variant="primary")
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
        self.query_one("#randomize-switch", Switch).value = config.get(
            "scheduler_randomize", False
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
            "scheduler_randomize": self.query_one(
                "#randomize-switch", Switch
            ).value,
        }

    def show_status(self, msg: str) -> None:
        self.query_one("#settings-status", Static).update(f"  {msg}")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "save-btn":
            self.action_save_settings()

    def action_test_now(self) -> None:
        self.app.run_test_screen()

    def action_save_settings(self) -> None:
        """Save current settings."""
        from gonzales.config import settings
        from gonzales.services.scheduler_service import scheduler_service

        try:
            new_settings = self.get_settings()
            interval_changed = (
                settings.test_interval_minutes != new_settings["test_interval_minutes"]
            )
            randomize_changed = (
                settings.scheduler_randomize != new_settings["scheduler_randomize"]
            )
            settings.test_interval_minutes = new_settings["test_interval_minutes"]
            settings.download_threshold_mbps = new_settings["download_threshold_mbps"]
            settings.upload_threshold_mbps = new_settings["upload_threshold_mbps"]
            settings.scheduler_randomize = new_settings["scheduler_randomize"]
            settings.save_config()
            if interval_changed or randomize_changed:
                scheduler_service.reschedule(settings.test_interval_minutes)
            self.show_status("[green]Settings saved successfully![/]")
        except Exception as e:
            self.show_status(f"[red]Error saving settings: {e}[/]")

    def action_show_help(self) -> None:
        """Show help modal."""
        self.app.push_screen("help")
