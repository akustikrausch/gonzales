"""Animated ASCII data flow visualization for speed test phases."""

import random

from textual.widgets import Static

# Character sets ordered by visual density (sparse -> dense)
CHARS_SPARSE = ". : ·"
CHARS_MEDIUM = "| ! * ░"
CHARS_DENSE = "# = ▒ ▓ █"
ALL_CHARS = CHARS_SPARSE.split() + CHARS_MEDIUM.split() + CHARS_DENSE.split()

PHASE_COLORS = {
    "download": "cyan",
    "upload": "magenta",
}


class DataFlowAscii(Static):
    """5-row animated data flow visualization.

    Characters scroll down (download) or up (upload).
    Density scales with bandwidth.
    """

    ROWS = 5
    DEFAULT_WIDTH = 40

    def __init__(self, width: int = 40, **kwargs):
        super().__init__(**kwargs)
        self._flow_width = width
        self._direction = "download"
        self._bandwidth = 0.0
        self._color = "cyan"
        self._active = False
        self._grid: list[list[str]] = [
            [" "] * width for _ in range(self.ROWS)
        ]
        self._timer = None

    def set_active(self, active: bool, direction: str = "download", color: str = "cyan") -> None:
        self._active = active
        self._direction = direction
        self._color = color
        if active and self._timer is None:
            self._timer = self.set_interval(0.2, self._tick)
        elif not active and self._timer is not None:
            self._timer.stop()
            self._timer = None
            # Clear grid
            self._grid = [
                [" "] * self._flow_width for _ in range(self.ROWS)
            ]
            self.update(self._render())

    def set_bandwidth(self, bandwidth: float) -> None:
        self._bandwidth = bandwidth

    def _density(self) -> float:
        """Return fill density 0.0-1.0 based on bandwidth."""
        if self._bandwidth <= 0:
            return 0.05
        # Scale: 10 Mbps -> 0.1, 100 Mbps -> 0.4, 500+ Mbps -> 0.8
        return min(0.85, 0.05 + self._bandwidth / 600)

    def _pick_char(self) -> str:
        """Pick a character based on bandwidth density."""
        density = self._density()
        if density < 0.2:
            pool = CHARS_SPARSE.split()
        elif density < 0.5:
            pool = CHARS_SPARSE.split() + CHARS_MEDIUM.split()
        else:
            pool = ALL_CHARS
        return random.choice(pool)

    def _tick(self) -> None:
        if not self._active:
            return

        density = self._density()
        w = self._flow_width

        if self._direction == "download":
            # Shift rows down, new row at top
            self._grid.pop()
            new_row = [
                self._pick_char() if random.random() < density else " "
                for _ in range(w)
            ]
            self._grid.insert(0, new_row)
        else:
            # Shift rows up, new row at bottom
            self._grid.pop(0)
            new_row = [
                self._pick_char() if random.random() < density else " "
                for _ in range(w)
            ]
            self._grid.append(new_row)

        self.update(self._render())

    def _render(self) -> str:
        color = self._color
        lines: list[str] = []
        for row in self._grid:
            line = "".join(row)
            lines.append(f"  [{color}]{line}[/]")
        return "\n".join(lines)

    def render(self) -> str:
        return self._render()

    def on_unmount(self) -> None:
        if self._timer is not None:
            self._timer.stop()
            self._timer = None
