"""Export command."""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import typer

from gonzales.cli.output import get_console, print_error, print_success
from gonzales.cli.utils import run_async
from gonzales.db.engine import async_session, init_db
from gonzales.db.repository import MeasurementRepository
from gonzales.services.export_service import export_service
from gonzales.services.statistics_service import statistics_service


@run_async
async def export_cmd(
    format: str = typer.Option(
        "csv",
        "--format",
        "-f",
        help="Export format: csv or json",
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: stdout or auto-named file)",
    ),
    days: Optional[int] = typer.Option(
        None,
        "--days",
        "-d",
        help="Export last N days only",
    ),
    pdf: bool = typer.Option(
        False,
        "--pdf",
        help="Generate PDF report instead",
    ),
) -> None:
    """Export measurements to file."""
    await init_db()

    console = get_console()

    start_date = None
    if days:
        start_date = datetime.now() - timedelta(days=days)

    async with async_session() as session:
        repo = MeasurementRepository(session)
        measurements = await repo.get_all_in_range(start_date)

        if not measurements:
            print_error("No measurements to export")
            raise typer.Exit(code=1)

        if pdf:
            # PDF export
            stats = await statistics_service.get_statistics(session, start_date)
            stats_dict = {
                "download": (
                    {
                        "min": stats.download.min,
                        "max": stats.download.max,
                        "avg": stats.download.avg,
                        "median": stats.download.median,
                    }
                    if stats.download
                    else None
                ),
                "upload": (
                    {
                        "min": stats.upload.min,
                        "max": stats.upload.max,
                        "avg": stats.upload.avg,
                        "median": stats.upload.median,
                    }
                    if stats.upload
                    else None
                ),
                "ping": (
                    {
                        "min": stats.ping.min,
                        "max": stats.ping.max,
                        "avg": stats.ping.avg,
                        "median": stats.ping.median,
                    }
                    if stats.ping
                    else None
                ),
            }

            content = export_service.generate_pdf(measurements, stats_dict, start_date)

            if output is None:
                output = Path(f"gonzales_report_{datetime.now():%Y%m%d_%H%M%S}.pdf")

            output.write_bytes(content)
            print_success(f"PDF report saved to: {output}")

        elif format.lower() == "json":
            import json

            data = [
                {
                    "id": m.id,
                    "timestamp": m.timestamp.isoformat(),
                    "download_mbps": round(m.download_mbps, 2),
                    "upload_mbps": round(m.upload_mbps, 2),
                    "ping_latency_ms": round(m.ping_latency_ms, 2),
                    "ping_jitter_ms": round(m.ping_jitter_ms, 2),
                    "server_name": m.server_name,
                    "server_location": m.server_location,
                    "isp": m.isp,
                }
                for m in measurements
            ]

            json_content = json.dumps(data, indent=2)

            if output:
                output.write_text(json_content)
                print_success(f"JSON exported to: {output}")
            else:
                print(json_content)

        else:  # CSV
            content = export_service.generate_csv(measurements)

            if output:
                output.write_text(content)
                print_success(f"CSV exported to: {output}")
            else:
                print(content)

        console.print(f"[dim]Exported {len(measurements)} measurements[/dim]")
