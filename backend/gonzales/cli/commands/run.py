"""Run speedtest command."""

from typing import Optional

import typer

from gonzales.cli.output import get_console, print_error, print_json, print_measurement
from gonzales.cli.utils import run_async
from gonzales.config import settings
from gonzales.db.engine import async_session, init_db
from gonzales.services.measurement_service import measurement_service


@run_async
async def run_cmd(
    server_id: Optional[int] = typer.Option(
        None,
        "--server",
        "-s",
        help="Server ID to use for test",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
    quiet: bool = typer.Option(
        False,
        "--quiet",
        "-q",
        help="Minimal output (only results)",
    ),
) -> None:
    """Run a manual speed test."""
    console = get_console()

    if not quiet and not json_output:
        console.print("[bold cyan]Running speed test...[/bold cyan]")

    await init_db()

    # Temporarily set server ID if specified
    original_server_id = settings.preferred_server_id
    if server_id is not None:
        settings.preferred_server_id = server_id

    try:
        async with async_session() as session:
            # manual=False to bypass cooldown (CLI calls shouldn't be blocked)
            measurement = await measurement_service.run_test(session, manual=False)

            result = {
                "id": measurement.id,
                "timestamp": measurement.timestamp.isoformat(),
                "download_mbps": round(measurement.download_mbps, 2),
                "upload_mbps": round(measurement.upload_mbps, 2),
                "ping_latency_ms": round(measurement.ping_latency_ms, 2),
                "ping_jitter_ms": round(measurement.ping_jitter_ms, 2),
                "server_id": measurement.server_id,
                "server_name": measurement.server_name,
                "server_location": measurement.server_location,
                "isp": measurement.isp,
                "below_download_threshold": measurement.below_download_threshold,
                "below_upload_threshold": measurement.below_upload_threshold,
            }

            print_measurement(result, use_json=json_output)

            # Exit code 1 if thresholds violated
            if measurement.below_download_threshold or measurement.below_upload_threshold:
                raise typer.Exit(code=1)

    except typer.Exit:
        raise
    except Exception as e:
        if json_output:
            print_json({"error": str(e)})
        else:
            print_error(str(e))
        raise typer.Exit(code=2)
    finally:
        settings.preferred_server_id = original_server_id


def server_cmd() -> None:
    """Start the Gonzales web server.

    This is equivalent to running 'python -m gonzales'.
    """
    from gonzales.__main__ import main

    main()
