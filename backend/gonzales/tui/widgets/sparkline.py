from textual.widgets import Static

SPARK_CHARS = "▁▂▃▄▅▆▇█"


class Sparkline(Static):
    """Unicode sparkline chart for speed history."""

    def __init__(self, label: str = "", values: list[float] | None = None, width: int = 60, **kwargs):
        super().__init__(**kwargs)
        self._label = label
        self._values = values or []
        self._width = width

    def update_values(self, values: list[float]) -> None:
        self._values = values
        self.update(self._render())

    def _render(self) -> str:
        if not self._values:
            return f"  {self._label}: (no data)"

        display_values = self._values[-self._width :]
        min_val = min(display_values)
        max_val = max(display_values)
        val_range = max_val - min_val

        if val_range == 0:
            spark = SPARK_CHARS[4] * len(display_values)
        else:
            spark = ""
            for v in display_values:
                idx = int(((v - min_val) / val_range) * (len(SPARK_CHARS) - 1))
                idx = min(idx, len(SPARK_CHARS) - 1)
                spark += SPARK_CHARS[idx]

        return f"  {self._label}: {spark}"

    def render(self) -> str:
        return self._render()
