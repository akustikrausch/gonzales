"""ASCII Chart widgets for TUI statistics display."""

from textual.widgets import Static

# Unicode box drawing characters for vertical bars
BAR_CHARS = " ▁▂▃▄▅▆▇█"
BLOCK_FULL = "█"
BLOCK_HALF = "▄"


class AsciiBarChart(Static):
    """Horizontal bar chart using Unicode block characters."""

    def __init__(
        self,
        data: list[tuple[str, float]] | None = None,
        max_value: float | None = None,
        bar_width: int = 40,
        color: str = "cyan",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._data = data or []
        self._max_value = max_value
        self._bar_width = bar_width
        self._color = color

    def update_data(
        self,
        data: list[tuple[str, float]],
        max_value: float | None = None,
    ) -> None:
        self._data = data
        if max_value is not None:
            self._max_value = max_value
        self.update(self._render())

    def _render(self) -> str:
        if not self._data:
            return "  (no data)"

        max_val = self._max_value or max(v for _, v in self._data)
        if max_val == 0:
            max_val = 1

        lines = []
        max_label_len = max(len(label) for label, _ in self._data)

        for label, value in self._data:
            bar_len = int((value / max_val) * self._bar_width)
            bar = BLOCK_FULL * bar_len
            padded_label = label.ljust(max_label_len)
            lines.append(f"  {padded_label} │ [{self._color}]{bar}[/] {value:.1f}")

        return "\n".join(lines)

    def render(self) -> str:
        return self._render()


class AsciiLineChart(Static):
    """Simple line chart using Unicode characters."""

    def __init__(
        self,
        values: list[float] | None = None,
        height: int = 8,
        width: int = 60,
        color: str = "cyan",
        show_axis: bool = True,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._values = values or []
        self._height = height
        self._width = width
        self._color = color
        self._show_axis = show_axis

    def update_values(self, values: list[float]) -> None:
        self._values = values
        self.update(self._render())

    def _render(self) -> str:
        if not self._values:
            return "  (no data)"

        display_values = self._values[-self._width :]
        if not display_values:
            return "  (no data)"

        min_val = min(display_values)
        max_val = max(display_values)
        val_range = max_val - min_val

        if val_range == 0:
            val_range = 1
            min_val = min_val - 0.5
            max_val = max_val + 0.5

        lines = []

        for row in range(self._height, 0, -1):
            threshold = min_val + (row / self._height) * val_range
            line_chars = []

            if self._show_axis:
                if row == self._height:
                    line_chars.append(f"{max_val:6.1f} │")
                elif row == 1:
                    line_chars.append(f"{min_val:6.1f} │")
                else:
                    line_chars.append("       │")

            for val in display_values:
                if val >= threshold:
                    line_chars.append(f"[{self._color}]█[/]")
                elif val >= threshold - (val_range / self._height / 2):
                    line_chars.append(f"[{self._color}]▄[/]")
                else:
                    line_chars.append(" ")

            lines.append("".join(line_chars))

        if self._show_axis:
            axis_line = "       └" + "─" * len(display_values)
            lines.append(axis_line)

        return "\n".join(lines)

    def render(self) -> str:
        return self._render()


class HourlyChart(Static):
    """Chart showing hourly averages as vertical bars."""

    def __init__(
        self,
        hourly_data: dict[int, float] | None = None,
        color: str = "cyan",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._hourly_data = hourly_data or {}
        self._color = color

    def update_data(self, hourly_data: dict[int, float]) -> None:
        self._hourly_data = hourly_data
        self.update(self._render())

    def _render(self) -> str:
        if not self._hourly_data:
            return "  (no hourly data)"

        max_val = max(self._hourly_data.values()) if self._hourly_data else 1
        if max_val == 0:
            max_val = 1

        bar_height = 6
        lines = []

        for row in range(bar_height, 0, -1):
            threshold = (row / bar_height) * max_val
            chars = []
            for hour in range(24):
                val = self._hourly_data.get(hour, 0)
                if val >= threshold:
                    chars.append(f"[{self._color}]█[/]")
                elif val >= threshold - (max_val / bar_height / 2):
                    chars.append(f"[{self._color}]▄[/]")
                else:
                    chars.append(" ")
            lines.append("  " + " ".join(chars))

        hour_labels = "  " + " ".join(f"{h:02d}" if h % 4 == 0 else "  " for h in range(24))
        lines.append(hour_labels)

        return "\n".join(lines)

    def render(self) -> str:
        return self._render()
