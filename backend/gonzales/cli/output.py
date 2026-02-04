"""Output formatting utilities for CLI."""

import json
import sys
from typing import Any

# Lazy import rich (only when not --json)
_console = None


def get_console():
    """Lazy-load rich console."""
    global _console
    if _console is None:
        try:
            from rich.console import Console

            _console = Console()
        except ImportError:
            # Fallback to basic console if rich is not installed
            _console = BasicConsole()
    return _console


class BasicConsole:
    """Basic console fallback when rich is not installed."""

    def print(self, text: str = "", *args, **kwargs) -> None:
        # Strip rich markup for basic output
        import re

        clean_text = re.sub(r"\[/?[^\]]+\]", "", str(text))
        print(clean_text)


def print_json(data: Any) -> None:
    """Print data as formatted JSON."""
    print(json.dumps(data, indent=2, default=str))


def print_table(
    title: str,
    columns: list[str],
    rows: list[list[Any]],
    use_json: bool = False,
) -> None:
    """Print data as formatted table or JSON."""
    if use_json:
        data = [dict(zip(columns, row)) for row in rows]
        print_json({"title": title, "data": data})
        return

    try:
        from rich.table import Table

        console = get_console()
        table = Table(title=title, show_header=True, header_style="bold cyan")
        for col in columns:
            table.add_column(col)
        for row in rows:
            table.add_row(*[str(cell) for cell in row])
        console.print(table)
    except ImportError:
        # Fallback to simple text table
        console = get_console()
        console.print(f"\n{title}")
        console.print("-" * 60)
        console.print("  ".join(f"{col:>12}" for col in columns))
        console.print("-" * 60)
        for row in rows:
            console.print("  ".join(f"{str(cell):>12}" for cell in row))


def print_status(label: str, value: Any, status: str = "info") -> None:
    """Print a status line with color."""
    console = get_console()
    color_map = {
        "success": "green",
        "warning": "yellow",
        "error": "red",
        "info": "cyan",
    }
    color = color_map.get(status, "white")
    console.print(f"[bold]{label}:[/bold] [{color}]{value}[/{color}]")


def print_measurement(m: dict, use_json: bool = False) -> None:
    """Print a measurement result."""
    if use_json:
        print_json(m)
        return

    console = get_console()
    console.print()
    console.print("[bold cyan]Speed Test Result[/bold cyan]")
    console.print(f"  [blue]Download:[/blue] {m['download_mbps']:.1f} Mbps")
    console.print(f"  [green]Upload:[/green] {m['upload_mbps']:.1f} Mbps")
    console.print(f"  [yellow]Ping:[/yellow] {m['ping_latency_ms']:.1f} ms")
    console.print(f"  [dim]Server:[/dim] {m.get('server_name', 'N/A')}, {m.get('server_location', 'N/A')}")
    console.print(f"  [dim]Time:[/dim] {m.get('timestamp', 'N/A')}")


def print_error(message: str) -> None:
    """Print an error message."""
    console = get_console()
    console.print(f"[red]Error:[/red] {message}")


def print_success(message: str) -> None:
    """Print a success message."""
    console = get_console()
    console.print(f"[green]Success:[/green] {message}")


def supports_color() -> bool:
    """Check if terminal supports colors."""
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()
