"""Config command."""

from typing import Optional

import typer

from gonzales.cli.output import get_console, print_error, print_json, print_success
from gonzales.config import MUTABLE_KEYS, settings


def config_cmd(
    key: Optional[str] = typer.Argument(
        None,
        help="Config key to get/set (e.g., test_interval_minutes)",
    ),
    value: Optional[str] = typer.Option(
        None,
        "--set",
        "-s",
        help="Value to set for the key",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
    list_keys: bool = typer.Option(
        False,
        "--list",
        "-l",
        help="List all configurable keys",
    ),
) -> None:
    """View or modify configuration."""
    console = get_console()

    # List available keys
    if list_keys:
        if json_output:
            print_json({"mutable_keys": list(MUTABLE_KEYS)})
        else:
            console.print("[bold]Configurable keys:[/bold]")
            for k in sorted(MUTABLE_KEYS):
                current = getattr(settings, k, None)
                console.print(f"  {k}: [cyan]{current}[/cyan]")
        return

    # Show all config
    if key is None:
        config_dict = {
            "test_interval_minutes": settings.test_interval_minutes,
            "download_threshold_mbps": settings.download_threshold_mbps,
            "upload_threshold_mbps": settings.upload_threshold_mbps,
            "tolerance_percent": settings.tolerance_percent,
            "preferred_server_id": settings.preferred_server_id,
            "manual_trigger_cooldown_seconds": settings.manual_trigger_cooldown_seconds,
            "theme": settings.theme,
            "isp_name": settings.isp_name,
            "host": settings.host,
            "port": settings.port,
            "log_level": settings.log_level,
            "debug": settings.debug,
        }

        if json_output:
            print_json(config_dict)
        else:
            console.print()
            console.print("[bold cyan]Current Configuration[/bold cyan]")
            console.print()
            for k, v in config_dict.items():
                mutable = "[dim](mutable)[/dim]" if k in MUTABLE_KEYS else "[dim](readonly)[/dim]"
                console.print(f"  {k}: [cyan]{v}[/cyan] {mutable}")
        return

    # Check if key exists
    if not hasattr(settings, key):
        print_error(f"Unknown config key: {key}")
        raise typer.Exit(code=1)

    # Get/set specific key
    if key not in MUTABLE_KEYS and value is not None:
        print_error(f"'{key}' is not a mutable config key")
        console.print(f"Mutable keys: {', '.join(sorted(MUTABLE_KEYS))}")
        raise typer.Exit(code=1)

    if value is not None:
        # Set value
        current_value = getattr(settings, key)

        # Type conversion
        if isinstance(current_value, bool):
            typed_value = value.lower() in ("true", "1", "yes", "on")
        elif isinstance(current_value, int):
            try:
                typed_value = int(value)
            except ValueError:
                print_error(f"'{value}' is not a valid integer")
                raise typer.Exit(code=1)
        elif isinstance(current_value, float):
            try:
                typed_value = float(value)
            except ValueError:
                print_error(f"'{value}' is not a valid number")
                raise typer.Exit(code=1)
        else:
            typed_value = value

        setattr(settings, key, typed_value)
        settings.save_config()

        if json_output:
            print_json({"key": key, "old_value": current_value, "new_value": typed_value})
        else:
            print_success(f"Updated {key}: {current_value} -> {typed_value}")
    else:
        # Get value
        current_value = getattr(settings, key)

        if json_output:
            print_json({key: current_value})
        else:
            console.print(f"{key}: [cyan]{current_value}[/cyan]")
