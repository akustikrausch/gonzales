"""Animated ASCII gauge for real-time speed test visualization."""

from textual.widgets import Static

from gonzales.tui.widgets.big_speed import render_big_number

# Block characters for gradient fill
BLOCKS = " ░▒▓█"
SPARK_CHARS = "▁▂▃▄▅▆▇█"

# Data flow characters by density level
FLOW_SPARSE = list(". : ·".split())
FLOW_MEDIUM = list("| ! * ░".split())
FLOW_DENSE = list("# = ▒ ▓ █".split())
FLOW_ALL = FLOW_SPARSE + FLOW_MEDIUM + FLOW_DENSE

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
        self._elapsed = 0.0
        self._max_bandwidth = 100.0
        self._history: list[float] = []
        self._result: dict | None = None
        self._flow_offset = 0
        self._flow_timer = None

    def set_phase(self, phase: str) -> None:
        old_phase = self._phase
        self._phase = phase
        if phase in ("download", "upload"):
            if old_phase != phase:
                self._history = []
                self._bandwidth = 0.0
                self._max_bandwidth = 100.0
                self._elapsed = 0.0
                self._flow_offset = 0
            if self._flow_timer is None:
                self._flow_timer = self.set_interval(0.2, self._flow_tick)
        elif self._flow_timer is not None:
            self._flow_timer.stop()
            self._flow_timer = None
        self.update(self._render())

    def set_bandwidth(self, mbps: float, progress: float = 0.0, elapsed: float = 0.0) -> None:
        self._bandwidth = mbps
        self._progress = progress
        self._elapsed = elapsed
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
        if self._flow_timer is not None:
            self._flow_timer.stop()
            self._flow_timer = None
        self.update(self._render())

    def set_error(self, message: str) -> None:
        self._phase = "error"
        self._result = {"error": message}
        if self._flow_timer is not None:
            self._flow_timer.stop()
            self._flow_timer = None
        self.update(self._render())

    def _flow_tick(self) -> None:
        """Advance the data flow animation by one step."""
        self._flow_offset += 1
        self.update(self._render())

    def _format_elapsed(self) -> str:
        """Format elapsed seconds as M:SS."""
        total = int(self._elapsed)
        minutes = total // 60
        seconds = total % 60
        return f"{minutes}:{seconds:02d}"

    def _render_data_flow(self, color: str, width: int) -> list[str]:
        """Render 5 rows of animated data flow characters."""
        import random

        rows = 5
        density = min(0.85, 0.05 + self._bandwidth / 600)

        lines: list[str] = []
        # Use flow_offset as a seed modifier for deterministic-ish but animated look
        rng = random.Random(42 + self._flow_offset)

        for row_idx in range(rows):
            row_chars: list[str] = []
            # Shift the seed per row for visual variety
            row_rng = random.Random(
                (42 + self._flow_offset + row_idx * 7) if self._phase == "download"
                else (42 - self._flow_offset + (rows - row_idx) * 7)
            )
            for col in range(width):
                if row_rng.random() < density:
                    if density < 0.2:
                        ch = row_rng.choice(FLOW_SPARSE)
                    elif density < 0.5:
                        ch = row_rng.choice(FLOW_SPARSE + FLOW_MEDIUM)
                    else:
                        ch = row_rng.choice(FLOW_ALL)
                    row_chars.append(ch)
                else:
                    row_chars.append(" ")
            lines.append(f"  [{color}]{''.join(row_chars)}[/]")

        return lines

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

        elif self._phase in ("download", "upload"):
            phase_label = "DOWNLOAD TEST" if self._phase == "download" else "UPLOAD TEST"
            elapsed_str = self._format_elapsed()
            arrow = "↓" if self._phase == "download" else "↑"

            lines.append("")
            # Phase header with elapsed time (right-aligned)
            header = f"  [{color}]◆ {phase_label}[/]"
            # Pad to align elapsed time to right
            pad_len = max(0, self._bar_width - len(phase_label) - 4)
            lines.append(f"  [{color}]◆ {phase_label}{' ' * pad_len}{elapsed_str}[/]")
            lines.append("")

            # Big ASCII speed number
            big_text = render_big_number(f"{self._bandwidth:.1f}", color)
            for bl in big_text.split("\n"):
                lines.append(f"    {bl}")
            lines.append("")

            # Data flow animation
            flow_width = min(self._bar_width, 40)
            flow_lines = self._render_data_flow(color, flow_width)
            lines.extend(flow_lines)
            lines.append("")

            # Bandwidth bar
            lines.append(self._render_bar(self._bandwidth, self._max_bandwidth, color))
            lines.append("")

            # Sparkline history
            if self._history:
                lines.append(self._render_sparkline(self._history, color))
                lines.append("")

            # Progress bar
            lines.append(self._render_progress_bar(self._progress, color, "Progress"))
            lines.append("")

        elif self._phase == "complete" and self._result:
            dl = self._result.get("download_mbps", 0)
            ul = self._result.get("upload_mbps", 0)
            ping = self._result.get("ping_ms", 0)
            jitter = self._result.get("jitter_ms", 0)

            lines.append("")
            lines.append("  [green bold]◆ TEST COMPLETE[/]")
            lines.append("")
            lines.append("  ╔══════════════════════════════════════════╗")
            lines.append("  ║         [bold]SPEED TEST RESULTS[/]              ║")
            lines.append("  ╠══════════════════════════════════════════╣")
            lines.append(f"  ║  [cyan bold]↓ Download:  {dl:>10.1f} Mbps[/]           ║")
            lines.append(f"  ║  [magenta bold]↑ Upload:    {ul:>10.1f} Mbps[/]           ║")
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

    def on_unmount(self) -> None:
        if self._flow_timer is not None:
            self._flow_timer.stop()
            self._flow_timer = None
