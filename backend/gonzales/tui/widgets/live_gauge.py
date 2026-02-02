"""Animated ASCII gauge for real-time speed test visualization."""

from textual.widgets import Static

# Block characters for gradient fill
BLOCKS = " ░▒▓█"
SPARK_CHARS = "▁▂▃▄▅▆▇█"

# Phase colors (Rich markup)
PHASE_COLORS = {
    "idle": "white",
    "started": "cyan",
    "ping": "yellow",
    "download": "cyan",
    "upload": "magenta",
    "complete": "green",
    "error": "red",
}


class LiveGauge(Static):
    """Large animated gauge showing real-time bandwidth during a speed test."""

    def __init__(self, bar_width: int = 50, **kwargs):
        super().__init__(**kwargs)
        self._bar_width = bar_width
        self._phase = "idle"
        self._bandwidth = 0.0
        self._progress = 0.0
        self._ping_ms = 0.0
        self._max_bandwidth = 100.0
        self._history: list[float] = []
        self._result: dict | None = None

    def set_phase(self, phase: str) -> None:
        self._phase = phase
        if phase in ("download", "upload"):
            self._history = []
            self._bandwidth = 0.0
            self._max_bandwidth = 100.0
        self.update(self._render())

    def set_bandwidth(self, mbps: float, progress: float = 0.0) -> None:
        self._bandwidth = mbps
        self._progress = progress
        self._history.append(mbps)
        if len(self._history) > self._bar_width:
            self._history = self._history[-self._bar_width:]
        self._max_bandwidth = max(self._max_bandwidth, mbps * 1.2, 10)
        self.update(self._render())

    def set_ping(self, ping_ms: float, progress: float = 0.0) -> None:
        self._ping_ms = ping_ms
        self._progress = progress
        self.update(self._render())

    def set_result(self, result: dict) -> None:
        self._result = result
        self._phase = "complete"
        self.update(self._render())

    def set_error(self, message: str) -> None:
        self._phase = "error"
        self._result = {"error": message}
        self.update(self._render())

    def _render_bar(self, value: float, max_val: float, color: str) -> str:
        ratio = min(1.0, value / max_val) if max_val > 0 else 0
        filled_exact = ratio * self._bar_width
        filled = int(filled_exact)
        remainder = filled_exact - filled

        bar = "█" * filled
        if remainder > 0 and filled < self._bar_width:
            idx = min(int(remainder * (len(BLOCKS) - 1)), len(BLOCKS) - 1)
            bar += BLOCKS[idx]
            filled += 1
        bar += "░" * max(0, self._bar_width - len(bar))

        return f"  [{color}]│{bar}│[/]"

    def _render_sparkline(self, values: list[float], color: str) -> str:
        if not values:
            return ""
        display = values[-self._bar_width:]
        min_val = min(display) if display else 0
        max_val = max(display) if display else 1
        val_range = max_val - min_val

        spark = ""
        for v in display:
            if val_range == 0:
                idx = 4
            else:
                idx = int(((v - min_val) / val_range) * (len(SPARK_CHARS) - 1))
                idx = min(idx, len(SPARK_CHARS) - 1)
            spark += SPARK_CHARS[idx]

        return f"  [{color}]{spark}[/]"

    def _render_progress_bar(self, progress: float, color: str, label: str) -> str:
        pct = min(100, progress * 100)
        filled = int(pct / 100 * 30)
        bar = "█" * filled + "░" * (30 - filled)
        return f"  [{color}]{label} [{bar}] {pct:5.1f}%[/]"

    def _render(self) -> str:
        color = PHASE_COLORS.get(self._phase, "white")
        lines: list[str] = []

        if self._phase == "idle":
            lines.append("")
            lines.append(f"  [{color}]◆ Waiting for test...[/]")
            lines.append("")

        elif self._phase == "started":
            lines.append("")
            lines.append(f"  [{color}]◆ INITIALIZING TEST[/]")
            lines.append(f"  [{color}]  Connecting to server...[/]")
            lines.append("")

        elif self._phase == "ping":
            lines.append("")
            lines.append(f"  [{color}]◆ MEASURING LATENCY[/]")
            lines.append("")
            lines.append(f"  [{color}]  Ping: {self._ping_ms:>8.1f} ms[/]")
            lines.append("")
            lines.append(self._render_progress_bar(self._progress, color, "Progress"))
            lines.append("")

        elif self._phase == "download":
            lines.append("")
            lines.append(f"  [{color}]◆ DOWNLOAD TEST[/]")
            lines.append("")
            lines.append(f"  [{color}]  {self._bandwidth:>10.1f} Mbps[/]")
            lines.append("")
            lines.append(self._render_bar(self._bandwidth, self._max_bandwidth, color))
            lines.append("")
            if self._history:
                lines.append(self._render_sparkline(self._history, color))
            lines.append("")
            lines.append(self._render_progress_bar(self._progress, color, "Progress"))
            lines.append("")

        elif self._phase == "upload":
            lines.append("")
            lines.append(f"  [{color}]◆ UPLOAD TEST[/]")
            lines.append("")
            lines.append(f"  [{color}]  {self._bandwidth:>10.1f} Mbps[/]")
            lines.append("")
            lines.append(self._render_bar(self._bandwidth, self._max_bandwidth, color))
            lines.append("")
            if self._history:
                lines.append(self._render_sparkline(self._history, color))
            lines.append("")
            lines.append(self._render_progress_bar(self._progress, color, "Progress"))
            lines.append("")

        elif self._phase == "complete" and self._result:
            dl = self._result.get("download_mbps", 0)
            ul = self._result.get("upload_mbps", 0)
            ping = self._result.get("ping_ms", 0)
            jitter = self._result.get("jitter_ms", 0)

            lines.append("")
            lines.append(f"  [green]◆ TEST COMPLETE[/]")
            lines.append("")
            lines.append("  ╔══════════════════════════════════════════╗")
            lines.append("  ║            SPEED TEST RESULTS            ║")
            lines.append("  ╠══════════════════════════════════════════╣")
            lines.append(f"  ║  [cyan]↓ Download:  {dl:>10.1f} Mbps[/]           ║")
            lines.append(f"  ║  [magenta]↑ Upload:    {ul:>10.1f} Mbps[/]           ║")
            lines.append(f"  ║  [yellow]● Ping:      {ping:>10.1f} ms[/]             ║")
            lines.append(f"  ║  [yellow]◎ Jitter:    {jitter:>10.1f} ms[/]             ║")
            lines.append("  ╚══════════════════════════════════════════╝")
            lines.append("")

        elif self._phase == "error":
            msg = self._result.get("error", "Unknown error") if self._result else "Unknown error"
            lines.append("")
            lines.append(f"  [red]◆ TEST FAILED[/]")
            lines.append(f"  [red]  {msg}[/]")
            lines.append("")

        return "\n".join(lines)

    def render(self) -> str:
        return self._render()
