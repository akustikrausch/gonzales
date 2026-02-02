from textual.app import ComposeResult
from textual.containers import Container
from textual.screen import Screen
from textual.widgets import DataTable, Footer, Header, Static


class HistoryScreen(Screen):
    BINDINGS = [
        ("d", "app.switch_mode('dashboard')", "Dashboard"),
        ("h", "app.switch_mode('history')", "History"),
        ("s", "app.switch_mode('settings')", "Settings"),
        ("t", "test_now", "Test"),
        ("q", "app.quit", "Quit"),
    ]

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Container(id="history-container"):
            yield Static("  ═══ MEASUREMENT HISTORY ═══", id="history-title")
            yield DataTable(id="history-table")
        yield Footer()

    def on_mount(self) -> None:
        table = self.query_one("#history-table", DataTable)
        table.add_columns(
            "ID", "Timestamp", "DL (Mbps)", "UL (Mbps)",
            "Ping (ms)", "Server", "Violations",
        )

    def update_data(self, measurements: list[dict]) -> None:
        table = self.query_one("#history-table", DataTable)
        table.clear()
        for m in measurements:
            violations = []
            if m.get("below_download_threshold"):
                violations.append("DL")
            if m.get("below_upload_threshold"):
                violations.append("UL")
            violation_str = ", ".join(violations) if violations else "—"

            table.add_row(
                str(m.get("id", "")),
                str(m.get("timestamp", ""))[:19],
                f"{m.get('download_mbps', 0):.1f}",
                f"{m.get('upload_mbps', 0):.1f}",
                f"{m.get('ping_latency_ms', 0):.1f}",
                m.get("server_name", "")[:25],
                violation_str,
            )

    def action_test_now(self) -> None:
        self.app.run_test_screen()
