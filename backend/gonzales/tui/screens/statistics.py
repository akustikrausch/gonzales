"""Statistics screen with analytics and charts."""

from textual.app import ComposeResult
from textual.containers import Container, Horizontal, ScrollableContainer, Vertical
from textual.screen import Screen
from textual.widgets import Footer, Header, Static

from gonzales.tui.widgets.ascii_chart import AsciiBarChart, HourlyChart


class StatisticsScreen(Screen):
    """Screen displaying detailed statistics and charts."""

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
        with ScrollableContainer(id="stats-container"):
            yield Static("[bold cyan]═══ STATISTICS & ANALYTICS ═══[/]", id="stats-title")
            yield Static("", id="stats-period")

            with Horizontal(id="summary-row"):
                with Vertical(id="download-stats", classes="stats-box"):
                    yield Static("[bold cyan]↓ DOWNLOAD[/]", classes="stats-header")
                    yield Static("", id="dl-min")
                    yield Static("", id="dl-max")
                    yield Static("", id="dl-avg")
                    yield Static("", id="dl-median")

                with Vertical(id="upload-stats", classes="stats-box"):
                    yield Static("[bold magenta]↑ UPLOAD[/]", classes="stats-header")
                    yield Static("", id="ul-min")
                    yield Static("", id="ul-max")
                    yield Static("", id="ul-avg")
                    yield Static("", id="ul-median")

                with Vertical(id="ping-stats", classes="stats-box"):
                    yield Static("[bold yellow]◉ LATENCY[/]", classes="stats-header")
                    yield Static("", id="ping-min")
                    yield Static("", id="ping-max")
                    yield Static("", id="ping-avg")

            yield Static("")
            yield Static("[bold]Compliance[/]", classes="section-header")
            yield Static("", id="compliance-info")

            yield Static("")
            yield Static("[bold]Hourly Download Averages (24h)[/]", classes="section-header")
            yield HourlyChart(id="hourly-download", color="cyan")

            yield Static("")
            yield Static("[bold]Hourly Upload Averages (24h)[/]", classes="section-header")
            yield HourlyChart(id="hourly-upload", color="magenta")

            yield Static("")
            yield Static("[bold]Connection Type Comparison[/]", classes="section-header")
            yield AsciiBarChart(id="connection-chart", color="green")

            yield Static("")
            yield Static("[bold]ISP Score[/]", classes="section-header")
            yield Static("", id="isp-score-info")

        yield Footer()

    def update_stats(self, stats: dict) -> None:
        """Update statistics display with data from API."""
        basic = stats.get("basic", stats)

        total = basic.get("total_tests", 0)
        period = stats.get("period_days", 7)
        self.query_one("#stats-period", Static).update(
            f"  Period: Last {period} days  |  Total Tests: {total}"
        )

        dl = basic.get("download")
        if dl:
            self.query_one("#dl-min", Static).update(f"  Min: {dl['min']:.1f} Mbps")
            self.query_one("#dl-max", Static).update(f"  Max: {dl['max']:.1f} Mbps")
            self.query_one("#dl-avg", Static).update(f"  Avg: {dl['avg']:.1f} Mbps")
            self.query_one("#dl-median", Static).update(f"  Median: {dl['median']:.1f} Mbps")

        ul = basic.get("upload")
        if ul:
            self.query_one("#ul-min", Static).update(f"  Min: {ul['min']:.1f} Mbps")
            self.query_one("#ul-max", Static).update(f"  Max: {ul['max']:.1f} Mbps")
            self.query_one("#ul-avg", Static).update(f"  Avg: {ul['avg']:.1f} Mbps")
            self.query_one("#ul-median", Static).update(f"  Median: {ul['median']:.1f} Mbps")

        ping = basic.get("ping")
        if ping:
            self.query_one("#ping-min", Static).update(f"  Min: {ping['min']:.1f} ms")
            self.query_one("#ping-max", Static).update(f"  Max: {ping['max']:.1f} ms")
            self.query_one("#ping-avg", Static).update(f"  Avg: {ping['avg']:.1f} ms")

        dl_violations = basic.get("download_violations", 0)
        ul_violations = basic.get("upload_violations", 0)
        self.query_one("#compliance-info", Static).update(
            f"  Download violations: [red]{dl_violations}[/]  |  "
            f"Upload violations: [red]{ul_violations}[/]"
        )

        sla = stats.get("sla")
        if sla:
            dl_comp = sla.get("download_compliance_pct", 0)
            ul_comp = sla.get("upload_compliance_pct", 0)
            compliance_text = self.query_one("#compliance-info", Static)
            current = compliance_text.render()
            compliance_text.update(
                f"  Download violations: [red]{dl_violations}[/]  |  "
                f"Upload violations: [red]{ul_violations}[/]\n"
                f"  SLA Compliance - Download: {dl_comp:.1f}%  |  Upload: {ul_comp:.1f}%"
            )

        isp_score = stats.get("isp_score")
        if isp_score:
            grade = isp_score.get("grade", "N/A")
            score = isp_score.get("composite", 0)
            self.query_one("#isp-score-info", Static).update(
                f"  Grade: [bold]{grade}[/]  |  Score: {score:.0f}/100"
            )

    def update_hourly(self, hourly_download: dict, hourly_upload: dict) -> None:
        """Update hourly charts with data."""
        self.query_one("#hourly-download", HourlyChart).update_data(hourly_download)
        self.query_one("#hourly-upload", HourlyChart).update_data(hourly_upload)

    def update_connection_comparison(self, comparison: dict) -> None:
        """Update connection type comparison chart."""
        if not comparison:
            return

        types = comparison.get("types", [])
        if not types:
            return

        chart_data = [
            (t.get("connection_type", "unknown"), t.get("avg_download_mbps", 0))
            for t in types
        ]
        self.query_one("#connection-chart", AsciiBarChart).update_data(chart_data)

    def action_test_now(self) -> None:
        self.app.run_test_screen()

    def action_show_help(self) -> None:
        """Show help modal."""
        self.app.push_screen("help")
