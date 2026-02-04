"""History command."""

from datetime import datetime, timedelta
from typing import Optional

import typer

from gonzales.cli.output import get_console, print_json, print_table
from gonzales.cli.utils import run_async
from gonzales.db.engine import async_session, init_db
from gonzales.db.repository import MeasurementRepository


@run_async
async def history_cmd(
    limit: int = typer.Option(
        10,
        "--limit",
        "-n",
        help="Number of measurements to show",
    ),
    days: Optional[int] = typer.Option(
        None,
        "--days",
        "-d",
        help="Show measurements from last N days",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show more details",
    ),
) -> None:
    """Show measurement history."""
    await init_db()

    start_date = None
    if days:
        start_date = datetime.now() - timedelta(days=days)

    async with async_session() as session:
        repo = MeasurementRepository(session)
        measurements, total = await repo.get_paginated(
            page=1,
            page_size=min(limit, 100),
            start_date=start_date,
            sort_by="timestamp",
            sort_order="desc",
        )

    if json_output:
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
                "below_download_threshold": m.below_download_threshold,
                "below_upload_threshold": m.below_upload_threshold,
            }
            for m in measurements
        ]
        print_json({"total": total, "showing": len(data), "measurements": data})
        return

    console = get_console()
    console.print()

    if verbose:
        columns = ["ID", "Time", "Download", "Upload", "Ping", "Jitter", "Server"]
        rows = [
            [
                m.id,
                m.timestamp.strftime("%Y-%m-%d %H:%M"),
                f"{m.download_mbps:.1f}",
                f"{m.upload_mbps:.1f}",
                f"{m.ping_latency_ms:.1f}",
                f"{m.ping_jitter_ms:.1f}",
                m.server_name[:20] if m.server_name else "N/A",
            ]
            for m in measurements
        ]
    else:
        columns = ["Time", "Download", "Upload", "Ping"]
        rows = [
            [
                m.timestamp.strftime("%Y-%m-%d %H:%M"),
                f"{m.download_mbps:.1f} Mbps",
                f"{m.upload_mbps:.1f} Mbps",
                f"{m.ping_latency_ms:.1f} ms",
            ]
            for m in measurements
        ]

    print_table(
        f"Speed Test History (showing {len(measurements)} of {total})",
        columns,
        rows,
    )
