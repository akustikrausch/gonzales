"""Help screen modal with keyboard shortcuts and documentation."""

from textual.app import ComposeResult
from textual.containers import Center, Container, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, Static


HELP_TEXT = """
[bold cyan]═══════════════════════════════════════════════════════════════[/]
[bold cyan]                    GONZALES KEYBOARD SHORTCUTS                  [/]
[bold cyan]═══════════════════════════════════════════════════════════════[/]

[bold]Navigation[/]
  [cyan]d[/]     Dashboard - Main speed display
  [cyan]h[/]     History - View past measurements
  [cyan]a[/]     Analytics - Statistics and charts
  [cyan]s[/]     Settings - Configure thresholds and intervals

[bold]Actions[/]
  [cyan]t[/]     Run speed test
  [cyan]r[/]     Refresh data
  [cyan]?[/]     Show this help screen

[bold]History Screen[/]
  [cyan]1-5[/]   Sort by column (1=Time, 2=Download, 3=Upload, 4=Ping, 5=Server)
  [cyan]↑/↓[/]   Navigate rows
  [cyan]PgUp[/]  Previous page
  [cyan]PgDn[/]  Next page

[bold]General[/]
  [cyan]Tab[/]   Move focus to next element
  [cyan]Esc[/]   Close modal / Cancel
  [cyan]q[/]     Quit application

[bold cyan]═══════════════════════════════════════════════════════════════[/]
[dim]         Gonzales - Open Source Internet Speed Monitor            [/]
[dim]         https://github.com/akustikrausch/gonzales                 [/]
[bold cyan]═══════════════════════════════════════════════════════════════[/]
"""


class HelpScreen(ModalScreen):
    """Modal screen showing keyboard shortcuts and help information."""

    BINDINGS = [
        ("escape", "dismiss", "Close"),
        ("q", "dismiss", "Close"),
        ("?", "dismiss", "Close"),
    ]

    def compose(self) -> ComposeResult:
        with Container(id="help-modal"):
            with Vertical(id="help-content"):
                yield Static(HELP_TEXT, id="help-text")
                with Center():
                    yield Button("Close [Esc]", id="close-btn", variant="primary")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "close-btn":
            self.dismiss()
