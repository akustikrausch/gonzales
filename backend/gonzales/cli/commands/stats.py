"""Statistics command."""

from datetime import datetime, timedelta

import typer

from gonzales.cli.output import get_console, print_json
from gonzales.cli.utils import run_async
from gonzales.config import settings
from gonzales.db.engine import async_session, init_db
from gonzales.services.statistics_service import statistics_service


@run_async
async def stats_cmd(
    days: int = typer.Option(
        7,
        "--days",
        "-d",
        help="Number of days to analyze",
    ),
    enhanced: bool = typer.Option(
        False,
        "--enhanced",
        "-e",
        help="Show enhanced statistics (trends, SLA, etc.)",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show statistics for measurements."""
    await init_db()

    start_date = datetime.now() - timedelta(days=days) if days > 0 else None

    async with async_session() as session:
        if enhanced:
            stats = await statistics_service.get_enhanced_statistics(
                session, start_date=start_date
            )
            stats_dict = stats.model_dump()
        else:
            stats = await statistics_service.get_statistics(
                session, start_date=start_date
            )
            stats_dict = stats.model_dump()

    if json_output:
        print_json(stats_dict)
        return

    console = get_console()
    console.print()
    console.print(f"[bold cyan]Statistics (last {days} days)[/bold cyan]")
    console.print()

    if enhanced:
        basic = stats.basic
    else:
        basic = stats

    console.print(f"[bold]Total Tests:[/bold] {basic.total_tests}")
    console.print()

    if basic.download:
        console.print("[bold]Download Speed[/bold]")
        console.print(f"  Min: {basic.download.min:.1f} Mbps")
        console.print(f"  Max: {basic.download.max:.1f} Mbps")
        console.print(f"  Avg: {basic.download.avg:.1f} Mbps")
        console.print(f"  Median: {basic.download.median:.1f} Mbps")
        console.print()

    if basic.upload:
        console.print("[bold]Upload Speed[/bold]")
        console.print(f"  Min: {basic.upload.min:.1f} Mbps")
        console.print(f"  Max: {basic.upload.max:.1f} Mbps")
        console.print(f"  Avg: {basic.upload.avg:.1f} Mbps")
        console.print(f"  Median: {basic.upload.median:.1f} Mbps")
        console.print()

    if basic.ping:
        console.print("[bold]Latency[/bold]")
        console.print(f"  Min: {basic.ping.min:.1f} ms")
        console.print(f"  Max: {basic.ping.max:.1f} ms")
        console.print(f"  Avg: {basic.ping.avg:.1f} ms")
        console.print()

    # Threshold violations
    console.print("[bold]Compliance[/bold]")
    console.print(f"  Download Threshold: {settings.download_threshold_mbps} Mbps")
    console.print(f"  Upload Threshold: {settings.upload_threshold_mbps} Mbps")
    console.print(f"  Download Violations: [red]{basic.download_violations}[/red]")
    console.print(f"  Upload Violations: [red]{basic.upload_violations}[/red]")

    if enhanced:
        console.print()
        console.print("[bold]SLA Compliance[/bold]")
        console.print(f"  Download: {stats.sla.download_compliance_pct:.1f}%")
        console.print(f"  Upload: {stats.sla.upload_compliance_pct:.1f}%")

        if stats.isp_score:
            console.print()
            console.print("[bold]ISP Score[/bold]")
            console.print(f"  Grade: [bold]{stats.isp_score.grade}[/bold]")
            console.print(f"  Score: {stats.isp_score.composite:.0f}/100")

        if stats.connection_comparison:
            console.print()
            console.print("[bold]Connection Comparison[/bold]")
            console.print(f"  Best Download: {stats.connection_comparison.best_for_download}")
            console.print(f"  Best Upload: {stats.connection_comparison.best_for_upload}")
            console.print(f"  Recommendation: {stats.connection_comparison.recommendation}")
