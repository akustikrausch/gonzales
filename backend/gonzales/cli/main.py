"""Gonzales CLI - Main entry point."""

import typer

from gonzales import __version__

# Create main Typer app
app = typer.Typer(
    name="gonzales",
    help="Gonzales - Internet Speed Monitor CLI",
    no_args_is_help=True,
    add_completion=True,
)


def version_callback(value: bool) -> None:
    """Show version and exit."""
    if value:
        typer.echo(f"Gonzales v{__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        False,
        "--version",
        "-v",
        callback=version_callback,
        is_eager=True,
        help="Show version and exit",
    ),
) -> None:
    """Gonzales - Internet Speed Monitor CLI.

    Run speed tests, view history, analyze statistics, and manage configuration
    from the command line.
    """
    pass


# Import and register commands
from gonzales.cli.commands.config import config_cmd
from gonzales.cli.commands.export import export_cmd
from gonzales.cli.commands.history import history_cmd
from gonzales.cli.commands.run import run_cmd, server_cmd
from gonzales.cli.commands.stats import stats_cmd
from gonzales.cli.commands.status import status_cmd

app.command(name="run")(run_cmd)
app.command(name="status")(status_cmd)
app.command(name="history")(history_cmd)
app.command(name="stats")(stats_cmd)
app.command(name="export")(export_cmd)
app.command(name="config")(config_cmd)
app.command(name="server")(server_cmd)


if __name__ == "__main__":
    app()
