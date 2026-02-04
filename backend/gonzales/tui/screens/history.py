from textual.app import ComposeResult
from textual.containers import Container
from textual.screen import Screen
from textual.widgets import DataTable, Footer, Header, Static


class HistoryScreen(Screen):
    BINDINGS = [
        ("d", "app.switch_mode('dashboard')", "Dashboard"),
        ("h", "app.switch_mode('history')", "History"),
        ("a", "app.switch_mode('statistics')", "Analytics"),
        ("s", "app.switch_mode('settings')", "Settings"),
        ("t", "test_now", "Test"),
        ("1", "sort_by_time", "Sort:Time"),
        ("2", "sort_by_download", "Sort:DL"),
        ("3", "sort_by_upload", "Sort:UL"),
        ("4", "sort_by_ping", "Sort:Ping"),
        ("?", "show_help", "Help"),
        ("q", "app.quit", "Quit"),
    ]

    def __init__(self):
        super().__init__()
        self._data: list[dict] = []
        self._sort_key = "timestamp"
        self._sort_reverse = True

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
        self._data = measurements
        self._refresh_table()

    def action_test_now(self) -> None:
        self.app.run_test_screen()

    def action_show_help(self) -> None:
        """Show help modal."""
        self.app.push_screen("help")

    def action_sort_by_time(self) -> None:
        """Sort by timestamp."""
        self._toggle_sort("timestamp")

    def action_sort_by_download(self) -> None:
        """Sort by download speed."""
        self._toggle_sort("download_mbps")

    def action_sort_by_upload(self) -> None:
        """Sort by upload speed."""
        self._toggle_sort("upload_mbps")

    def action_sort_by_ping(self) -> None:
        """Sort by ping latency."""
        self._toggle_sort("ping_latency_ms")

    def _toggle_sort(self, key: str) -> None:
        """Toggle sort order or change sort key."""
        if self._sort_key == key:
            self._sort_reverse = not self._sort_reverse
        else:
            self._sort_key = key
            self._sort_reverse = key == "timestamp"
        self._refresh_table()

    def _refresh_table(self) -> None:
        """Refresh table with current sort settings."""
        if not self._data:
            return
        sorted_data = sorted(
            self._data,
            key=lambda x: x.get(self._sort_key, 0),
            reverse=self._sort_reverse,
        )
        table = self.query_one("#history-table", DataTable)
        table.clear()
        for m in sorted_data:
            violations = []
            if m.get("below_download_threshold"):
                violations.append("DL")
            if m.get("below_upload_threshold"):
                violations.append("UL")
            violation_str = ", ".join(violations) if violations else "-"

            table.add_row(
                str(m.get("id", "")),
                str(m.get("timestamp", ""))[:19],
                f"{m.get('download_mbps', 0):.1f}",
                f"{m.get('upload_mbps', 0):.1f}",
                f"{m.get('ping_latency_ms', 0):.1f}",
                m.get("server_name", "")[:25],
                violation_str,
            )
