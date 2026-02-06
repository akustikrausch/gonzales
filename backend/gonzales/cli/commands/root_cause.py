"""Root-Cause Analysis CLI commands."""

import typer

from gonzales.cli.output import get_console, print_json
from gonzales.cli.utils import run_async
from gonzales.db.engine import async_session, init_db
from gonzales.services.root_cause_service import root_cause_service


# Create subcommand group
app = typer.Typer(
    name="root-cause",
    help="Root-cause analysis commands (network diagnostics)",
    no_args_is_help=True,
)


@app.command(name="analyze")
@run_async
async def root_cause_analyze_cmd(
    days: int = typer.Option(
        30,
        "--days",
        "-d",
        help="Number of days to analyze (7-90)",
    ),
    min_confidence: float = typer.Option(
        0.5,
        "--min-confidence",
        help="Minimum confidence for issues (0.0-1.0)",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Run root-cause analysis on recent data."""
    await init_db()

    console = get_console()

    if not json_output:
        console.print("[dim]Analyzing network data...[/dim]")

    async with async_session() as session:
        analysis = await root_cause_service.analyze(session, days, min_confidence)

    if json_output:
        print_json(analysis.model_dump(mode="json"))
        return

    console.print()
    console.print("[bold cyan]Root-Cause Analysis[/bold cyan]")
    console.print()

    # Network Health Score
    health = analysis.network_health_score
    if health >= 80:
        health_color = "green"
        health_label = "Excellent"
    elif health >= 60:
        health_color = "yellow"
        health_label = "Good"
    elif health >= 40:
        health_color = "orange3"
        health_label = "Fair"
    else:
        health_color = "red"
        health_label = "Poor"

    console.print(f"[bold]Network Health Score: [{health_color}]{health:.0f}/100 ({health_label})[/{health_color}][/bold]")
    console.print()

    # Layer Scores
    console.print("[bold]Layer Health[/bold]")
    layers = [
        ("DNS", analysis.layer_scores.dns_score),
        ("Local Network", analysis.layer_scores.local_network_score),
        ("ISP Backbone", analysis.layer_scores.isp_backbone_score),
        ("ISP Last-Mile", analysis.layer_scores.isp_lastmile_score),
        ("Server", analysis.layer_scores.server_score),
    ]

    for name, score in layers:
        bar_length = int(score / 5)  # 0-20 chars
        bar = "█" * bar_length + "░" * (20 - bar_length)
        if score >= 80:
            color = "green"
        elif score >= 60:
            color = "yellow"
        else:
            color = "red"
        console.print(f"  {name:15} [{color}]{bar}[/{color}] {score:.0f}")
    console.print()

    # Primary Issue
    if analysis.primary_cause:
        cause = analysis.primary_cause
        severity_colors = {"critical": "red", "warning": "yellow", "info": "blue"}
        sev_color = severity_colors.get(cause.severity, "white")

        console.print("[bold]Primary Issue[/bold]")
        console.print(f"  [{sev_color}]{cause.category.upper()}[/{sev_color}]: {cause.description}")
        console.print(f"  Severity: [{sev_color}]{cause.severity}[/{sev_color}] | Confidence: {cause.confidence:.0%}")
        if cause.evidence:
            console.print("  Evidence:")
            for evidence in cause.evidence[:3]:
                console.print(f"    • {evidence}")
        console.print()

    # Secondary Issues
    if analysis.secondary_causes:
        console.print(f"[bold]Additional Issues ({len(analysis.secondary_causes)})[/bold]")
        for cause in analysis.secondary_causes[:3]:
            severity_colors = {"critical": "red", "warning": "yellow", "info": "blue"}
            sev_color = severity_colors.get(cause.severity, "white")
            console.print(f"  • [{sev_color}]{cause.category}[/{sev_color}]: {cause.description}")
        if len(analysis.secondary_causes) > 3:
            console.print(f"  [dim]...and {len(analysis.secondary_causes) - 3} more[/dim]")
        console.print()

    # Recommendations
    if analysis.recommendations:
        console.print("[bold]Recommendations[/bold]")
        for i, rec in enumerate(analysis.recommendations[:5], 1):
            difficulty_colors = {"easy": "green", "moderate": "yellow", "advanced": "red"}
            diff_color = difficulty_colors.get(rec.difficulty, "white")
            console.print(f"  {i}. [{diff_color}][{rec.difficulty.upper()}][/{diff_color}] {rec.title}")
            console.print(f"     [dim]{rec.description}[/dim]")
        console.print()

    # Time Patterns
    if analysis.time_patterns:
        console.print("[bold]Time Patterns[/bold]")
        for pattern in analysis.time_patterns[:2]:
            console.print(f"  • {pattern.pattern_type}: {pattern.description}")
            if pattern.degradation_pct:
                console.print(f"    Degradation: [red]{pattern.degradation_pct:.0f}%[/red]")
        console.print()


@app.command(name="fingerprints")
@run_async
async def root_cause_fingerprints_cmd(
    days: int = typer.Option(
        30,
        "--days",
        "-d",
        help="Number of days to analyze",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show detected problem fingerprints."""
    await init_db()

    async with async_session() as session:
        analysis = await root_cause_service.analyze(session, days)

    all_causes = []
    if analysis.primary_cause:
        all_causes.append(analysis.primary_cause)
    all_causes.extend(analysis.secondary_causes)

    if json_output:
        print_json([c.model_dump(mode="json") for c in all_causes])
        return

    console = get_console()
    console.print()
    console.print("[bold cyan]Problem Fingerprints[/bold cyan]")
    console.print()

    if not all_causes:
        console.print("[green]✓ No issues detected[/green]")
        return

    for cause in all_causes:
        severity_colors = {"critical": "red", "warning": "yellow", "info": "blue"}
        sev_color = severity_colors.get(cause.severity, "white")

        console.print(f"[bold][{sev_color}]{cause.category.upper()}[/{sev_color}][/bold]")
        console.print(f"  {cause.description}")
        console.print(f"  Severity: [{sev_color}]{cause.severity}[/{sev_color}] | "
                      f"Confidence: {cause.confidence:.0%} | "
                      f"Occurrences: {cause.occurrence_count}")
        if cause.first_detected:
            console.print(f"  First detected: {cause.first_detected.strftime('%Y-%m-%d %H:%M')}")
        if cause.evidence:
            console.print("  Evidence:")
            for evidence in cause.evidence:
                console.print(f"    • {evidence}")
        console.print()


@app.command(name="recommendations")
@run_async
async def root_cause_recommendations_cmd(
    days: int = typer.Option(
        30,
        "--days",
        "-d",
        help="Number of days to analyze",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show actionable recommendations."""
    await init_db()

    async with async_session() as session:
        analysis = await root_cause_service.analyze(session, days)

    if json_output:
        print_json([r.model_dump() for r in analysis.recommendations])
        return

    console = get_console()
    console.print()
    console.print("[bold cyan]Recommendations[/bold cyan]")
    console.print()

    if not analysis.recommendations:
        console.print("[green]✓ No recommendations - your network looks healthy![/green]")
        return

    for i, rec in enumerate(analysis.recommendations, 1):
        difficulty_colors = {"easy": "green", "moderate": "yellow", "advanced": "red"}
        diff_color = difficulty_colors.get(rec.difficulty, "white")

        console.print(f"[bold]{i}. {rec.title}[/bold]")
        console.print(f"   Category: {rec.category} | "
                      f"Difficulty: [{diff_color}]{rec.difficulty}[/{diff_color}] | "
                      f"Priority: {rec.priority}")
        console.print(f"   {rec.description}")
        if rec.expected_impact:
            console.print(f"   Expected impact: [green]{rec.expected_impact}[/green]")
        console.print()


@app.command(name="hops")
@run_async
async def root_cause_hops_cmd(
    days: int = typer.Option(
        30,
        "--days",
        "-d",
        help="Number of days to analyze",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show hop-speed correlations (bottleneck detection)."""
    await init_db()

    async with async_session() as session:
        analysis = await root_cause_service.analyze(session, days)

    if json_output:
        print_json([h.model_dump() for h in analysis.hop_correlations])
        return

    console = get_console()
    console.print()
    console.print("[bold cyan]Hop-Speed Correlations[/bold cyan]")
    console.print()

    if not analysis.hop_correlations:
        console.print("[dim]No topology data available for correlation analysis[/dim]")
        console.print("[dim]Run a network topology scan to collect hop data[/dim]")
        return

    console.print("Hop  IP Address           Latency    Correlation  Bottleneck")
    console.print("───  ────────────────────  ─────────  ───────────  ──────────")

    for hop in analysis.hop_correlations:
        ip = hop.ip_address or "* * *"
        ip_display = ip[:20].ljust(20)
        latency = f"{hop.avg_latency_ms:.1f} ms".rjust(9)

        # Color correlation
        corr = hop.latency_correlation
        if corr < -0.4:
            corr_color = "red"
        elif corr < -0.2:
            corr_color = "yellow"
        else:
            corr_color = "green"
        corr_display = f"[{corr_color}]{corr:+.2f}[/{corr_color}]".rjust(11)

        bottleneck = "[red]YES[/red]" if hop.is_bottleneck else "[green]no[/green]"

        console.print(f"{hop.hop_number:3}  {ip_display}  {latency}  {corr_display}     {bottleneck}")

    console.print()
    console.print("[dim]Negative correlation = higher latency correlates with slower speeds[/dim]")
    console.print("[dim]Bottleneck = correlation < -0.4 (strong negative)[/dim]")
