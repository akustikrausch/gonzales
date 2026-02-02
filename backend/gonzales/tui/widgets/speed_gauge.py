from textual.app import ComposeResult
from textual.widgets import Static


class SpeedGauge(Static):
    """Displays a speed value with a retro gauge bar."""

    def __init__(
        self,
        label: str = "",
        value: float = 0.0,
        unit: str = "Mbps",
        max_value: float = 1000.0,
        threshold: float = 0.0,
        bar_char: str = "█",
        bar_width: int = 40,
        color: str = "cyan",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._label = label
        self._value = value
        self._unit = unit
        self._max_value = max_value
        self._threshold = threshold
        self._bar_char = bar_char
        self._bar_width = bar_width
        self._color = color

    def compose(self) -> ComposeResult:
        yield Static(self._render_gauge())

    def update_value(self, value: float) -> None:
        self._value = value
        self.query_one(Static).update(self._render_gauge())

    def _render_gauge(self) -> str:
        filled = int((self._value / self._max_value) * self._bar_width) if self._max_value > 0 else 0
        filled = min(filled, self._bar_width)
        empty = self._bar_width - filled

        bar = self._bar_char * filled + "░" * empty

        violation = ""
        if self._threshold > 0 and self._value < self._threshold:
            violation = " ⚠ BELOW THRESHOLD"

        return (
            f"  {self._label}\n"
            f"  [{self._color}]{self._value:>8.1f}[/] {self._unit}\n"
            f"  [{self._color}]{bar}[/]{violation}"
        )
