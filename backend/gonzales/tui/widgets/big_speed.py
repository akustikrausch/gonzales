"""Large ASCII art speed number using block characters."""

from textual.widgets import Static

# 3-line-high, 5-char-wide digit font using block characters
DIGIT_FONT: dict[str, list[str]] = {
    "0": ["█████", "█   █", "█████"],
    "1": ["  ██ ", "   █ ", "  ███"],
    "2": ["█████", "  ███", "█████"],
    "3": ["█████", "  ███", "█████"],
    "4": ["█   █", "█████", "    █"],
    "5": ["█████", "███  ", "█████"],
    "6": ["█████", "████ ", "█████"],
    "7": ["█████", "   █ ", "  █  "],
    "8": ["█████", "█████", "█████"],
    "9": ["█████", " ████", "█████"],
    ".": ["     ", "     ", "  █  "],
    " ": ["     ", "     ", "     "],
}

# Differentiate similar digits with internal gaps
DIGIT_FONT_DETAIL: dict[str, list[str]] = {
    "0": ["████ ", "█  █ ", "████ "],
    "1": [" ██  ", "  █  ", " ███ "],
    "2": ["████ ", " ██  ", "████ "],
    "3": ["████ ", " ███ ", "████ "],
    "4": ["█  █ ", "████ ", "   █ "],
    "5": ["████ ", "███  ", "████ "],
    "6": ["████ ", "████ ", "████ "],
    "7": ["████ ", "  █  ", " █   "],
    "8": ["████ ", "████ ", "████ "],
    "9": ["████ ", "████ ", " ███ "],
    ".": ["     ", "     ", " █   "],
    " ": ["     ", "     ", "     "],
}


def render_big_number(value: str, color: str) -> str:
    """Render a numeric string as 3-line-tall ASCII art with Rich color markup.

    Args:
        value: String of digits and dots, e.g. "423.7"
        color: Rich color name, e.g. "cyan"

    Returns:
        Multi-line string with Rich markup.
    """
    lines: list[list[str]] = [[], [], []]

    for ch in value:
        glyph = DIGIT_FONT_DETAIL.get(ch, DIGIT_FONT_DETAIL.get(" "))
        if glyph is None:
            continue
        for row in range(3):
            lines[row].append(glyph[row])

    result: list[str] = []
    for row in range(3):
        joined = " ".join(lines[row])
        result.append(f"[{color}]{joined}[/]")

    return "\n".join(result)


class BigSpeed(Static):
    """Widget that displays a large ASCII art speed number."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._value = "0.0"
        self._color = "cyan"
        self._unit = "Mbps"

    def set_speed(self, value: float, color: str = "cyan", unit: str = "Mbps") -> None:
        self._value = f"{value:.1f}"
        self._color = color
        self._unit = unit
        self.update(self._render())

    def _render(self) -> str:
        big = render_big_number(self._value, self._color)
        # Add unit on the right of the bottom line
        unit_line = f"[{self._color}]{' ' * 6}{self._unit}[/]"
        return f"{big}\n{unit_line}"

    def render(self) -> str:
        return self._render()
