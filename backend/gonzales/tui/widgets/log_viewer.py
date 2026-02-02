from textual.widgets import Static


class LogViewer(Static):
    """Simple log message viewer widget."""

    MAX_LINES = 50

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._lines: list[str] = []

    def add_line(self, line: str) -> None:
        self._lines.append(line)
        if len(self._lines) > self.MAX_LINES:
            self._lines = self._lines[-self.MAX_LINES :]
        self.update(self._render())

    def clear_lines(self) -> None:
        self._lines = []
        self.update(self._render())

    def _render(self) -> str:
        if not self._lines:
            return "  (no log messages)"
        return "\n".join(f"  {line}" for line in self._lines[-20:])

    def render(self) -> str:
        return self._render()
