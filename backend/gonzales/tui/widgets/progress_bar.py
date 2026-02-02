from textual.widgets import Static

BLOCK_CHARS = " ░▒▓█"


class RetroProgressBar(Static):
    """Retro-style block-fill progress bar."""

    def __init__(
        self,
        label: str = "",
        total: float = 100.0,
        bar_width: int = 50,
        color: str = "cyan",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._label = label
        self._progress = 0.0
        self._total = total
        self._bar_width = bar_width
        self._color = color

    def update_progress(self, value: float) -> None:
        self._progress = min(value, self._total)
        self.update(self._render())

    def _render(self) -> str:
        pct = (self._progress / self._total * 100) if self._total > 0 else 0
        filled_exact = (self._progress / self._total * self._bar_width) if self._total > 0 else 0
        filled = int(filled_exact)
        remainder = filled_exact - filled

        bar = "█" * filled
        if remainder > 0 and filled < self._bar_width:
            idx = int(remainder * (len(BLOCK_CHARS) - 1))
            bar += BLOCK_CHARS[idx]
            filled += 1
        bar += " " * (self._bar_width - len(bar))

        return f"  {self._label} [{self._color}][{bar}][/] {pct:5.1f}%"

    def render(self) -> str:
        return self._render()
