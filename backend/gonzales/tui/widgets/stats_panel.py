from textual.widgets import Static


class StatsPanel(Static):
    """Panel showing statistics summary."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._stats: dict = {}

    def update_stats(self, stats: dict) -> None:
        self._stats = stats
        self.update(self._render())

    def _render(self) -> str:
        if not self._stats:
            return "  Statistics: (no data yet)"

        lines = ["  ╔══════════════════════════════════════╗"]
        lines.append("  ║        STATISTICS SUMMARY           ║")
        lines.append("  ╠══════════════════════════════════════╣")

        total = self._stats.get("total_tests", 0)
        lines.append(f"  ║  Total Tests: {total:<22} ║")

        for label, key in [("Download", "download"), ("Upload", "upload"), ("Ping", "ping")]:
            s = self._stats.get(key)
            if s:
                unit = "Mbps" if key != "ping" else "ms"
                lines.append(f"  ║  {label} ({unit}):{'':>19}║")
                lines.append(f"  ║    Min: {s.get('min', 0):>8.1f}  Max: {s.get('max', 0):>8.1f}  ║")
                lines.append(f"  ║    Avg: {s.get('avg', 0):>8.1f}  Med: {s.get('median', 0):>8.1f}  ║")

        lines.append("  ╚══════════════════════════════════════╝")
        return "\n".join(lines)

    def render(self) -> str:
        return self._render()
