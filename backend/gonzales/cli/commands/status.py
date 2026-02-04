"""Status command."""

import typer

from gonzales import __version__
from gonzales.cli.output import get_console, print_json
from gonzales.cli.utils import run_async
from gonzales.config import settings
from gonzales.db.engine import async_session, init_db
from gonzales.db.repository import MeasurementRepository
from gonzales.services.scheduler_service import scheduler_service


@run_async
async def status_cmd(
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show current status (last measurement, scheduler, config)."""
    await init_db()

    async with async_session() as session:
        repo = MeasurementRepository(session)
        latest = await repo.get_latest()
        total = await repo.count()

    status_data = {
        "version": __version__,
        "config": {
            "test_interval_minutes": settings.test_interval_minutes,
            "download_threshold_mbps": settings.download_threshold_mbps,
            "upload_threshold_mbps": settings.upload_threshold_mbps,
            "tolerance_percent": settings.tolerance_percent,
            "preferred_server_id": settings.preferred_server_id,
        },
        "scheduler": {
            "running": scheduler_service.running,
            "next_run_time": (
                scheduler_service.next_run_time.isoformat()
                if scheduler_service.next_run_time
                else None
            ),
        },
        "last_measurement": None,
        "total_measurements": total,
    }

    if latest:
        status_data["last_measurement"] = {
            "id": latest.id,
            "timestamp": latest.timestamp.isoformat(),
            "download_mbps": round(latest.download_mbps, 2),
            "upload_mbps": round(latest.upload_mbps, 2),
            "ping_latency_ms": round(latest.ping_latency_ms, 2),
        }

    if json_output:
        print_json(status_data)
        return

    console = get_console()
    console.print()
    console.print(f"[bold cyan]Gonzales v{__version__}[/bold cyan]")
    console.print()

    # Config
    console.print("[bold]Configuration[/bold]")
    console.print(f"  Test Interval: {settings.test_interval_minutes} min")
    console.print(f"  Download Threshold: {settings.download_threshold_mbps} Mbps")
    console.print(f"  Upload Threshold: {settings.upload_threshold_mbps} Mbps")
    console.print(f"  Tolerance: {settings.tolerance_percent}%")
    console.print()

    # Scheduler
    console.print("[bold]Scheduler[/bold]")
    if scheduler_service.running:
        next_run = scheduler_service.next_run_time
        console.print("  Status: [green]Running[/green]")
        if next_run:
            console.print(f"  Next Run: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        console.print("  Status: [yellow]Not running (CLI mode)[/yellow]")
    console.print()

    # Last Measurement
    console.print("[bold]Last Measurement[/bold]")
    if latest:
        console.print(f"  Time: {latest.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
        console.print(f"  Download: [blue]{latest.download_mbps:.1f} Mbps[/blue]")
        console.print(f"  Upload: [green]{latest.upload_mbps:.1f} Mbps[/green]")
        console.print(f"  Ping: [yellow]{latest.ping_latency_ms:.1f} ms[/yellow]")
    else:
        console.print("  [dim]No measurements yet[/dim]")

    console.print()
    console.print(f"[dim]Total Measurements: {total}[/dim]")
