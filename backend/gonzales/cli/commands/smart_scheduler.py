"""Smart Scheduler CLI commands."""

import typer

from gonzales.cli.output import get_console, print_json
from gonzales.cli.utils import run_async
from gonzales.db.engine import async_session, init_db
from gonzales.services.smart_scheduler_service import smart_scheduler_service


# Create subcommand group
app = typer.Typer(
    name="smart-scheduler",
    help="Smart scheduler commands (adaptive test intervals)",
    no_args_is_help=True,
)


@app.command(name="status")
@run_async
async def smart_scheduler_status_cmd(
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show smart scheduler status."""
    await init_db()

    status = smart_scheduler_service.get_status()

    if json_output:
        print_json(status.model_dump())
        return

    console = get_console()
    console.print()
    console.print("[bold cyan]Smart Scheduler Status[/bold cyan]")
    console.print()

    # Enabled status
    if status.enabled:
        console.print("  Status: [green]Enabled[/green]")
    else:
        console.print("  Status: [yellow]Disabled[/yellow]")
        console.print()
        console.print("[dim]Enable with: gonzales smart-scheduler enable[/dim]")
        return

    # Phase
    phase_colors = {
        "normal": "green",
        "burst": "red",
        "recovery": "yellow",
    }
    phase_color = phase_colors.get(status.phase, "white")
    console.print(f"  Phase: [{phase_color}]{status.phase.upper()}[/{phase_color}]")
    console.print()

    # Intervals
    console.print("[bold]Intervals[/bold]")
    console.print(f"  Current: {status.current_interval_minutes} min")
    console.print(f"  Base: {status.base_interval_minutes} min")
    console.print()

    # Stability
    console.print("[bold]Network Stability[/bold]")
    stability_pct = status.stability_score * 100
    if stability_pct >= 85:
        stability_color = "green"
    elif stability_pct >= 60:
        stability_color = "yellow"
    else:
        stability_color = "red"
    console.print(f"  Score: [{stability_color}]{stability_pct:.0f}%[/{stability_color}]")
    console.print()

    # Data Budget
    console.print("[bold]Daily Data Budget[/bold]")
    console.print(f"  Used: {status.daily_data_used_mb:.1f} MB")
    console.print(f"  Budget: {status.daily_data_budget_mb:.0f} MB")
    console.print(f"  Remaining: {status.data_budget_remaining_pct:.0f}%")
    console.print()

    # Last decision
    if status.last_decision_reason:
        console.print(f"[dim]Last decision: {status.last_decision_reason}[/dim]")


@app.command(name="enable")
@run_async
async def smart_scheduler_enable_cmd() -> None:
    """Enable smart scheduling."""
    await init_db()

    async with async_session() as session:
        await smart_scheduler_service.enable(session)

    console = get_console()
    console.print("[green]✓[/green] Smart scheduling enabled")


@app.command(name="disable")
@run_async
async def smart_scheduler_disable_cmd() -> None:
    """Disable smart scheduling."""
    await init_db()

    async with async_session() as session:
        await smart_scheduler_service.disable(session)

    console = get_console()
    console.print("[yellow]✓[/yellow] Smart scheduling disabled")


@app.command(name="config")
@run_async
async def smart_scheduler_config_cmd(
    burst_interval: int = typer.Option(
        None,
        "--burst-interval",
        help="Burst mode interval in minutes (5-30)",
    ),
    daily_budget: float = typer.Option(
        None,
        "--daily-budget",
        help="Daily data budget in MB (100-10240)",
    ),
    stability_threshold: float = typer.Option(
        None,
        "--stability-threshold",
        help="Stability threshold (0.0-1.0)",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output current config as JSON",
    ),
) -> None:
    """View or update smart scheduler configuration."""
    await init_db()

    config = smart_scheduler_service.get_config()

    # If no options provided, show current config
    if all(v is None for v in [burst_interval, daily_budget, stability_threshold]) and not json_output:
        console = get_console()
        console.print()
        console.print("[bold cyan]Smart Scheduler Configuration[/bold cyan]")
        console.print()
        console.print(f"  Enabled: {config.enabled}")
        console.print(f"  Min Interval: {config.min_interval_minutes} min")
        console.print(f"  Max Interval: {config.max_interval_minutes} min")
        console.print(f"  Burst Interval: {config.burst_interval_minutes} min")
        console.print(f"  Burst Max Tests: {config.burst_max_tests}")
        console.print(f"  Daily Budget: {config.daily_data_budget_mb} MB")
        console.print(f"  Stability Threshold: {config.stability_threshold}")
        console.print(f"  Circuit Breaker: {config.circuit_breaker_tests} tests / {config.circuit_breaker_window_minutes} min")
        return

    if json_output:
        print_json(config.model_dump())
        return

    # Update config
    updates = {}
    if burst_interval is not None:
        updates["burst_interval_minutes"] = burst_interval
    if daily_budget is not None:
        updates["daily_data_budget_mb"] = daily_budget
    if stability_threshold is not None:
        updates["stability_threshold"] = stability_threshold

    if updates:
        async with async_session() as session:
            await smart_scheduler_service.update_config(session, updates)
        console = get_console()
        console.print("[green]✓[/green] Configuration updated")


@app.command(name="decisions")
@run_async
async def smart_scheduler_decisions_cmd(
    limit: int = typer.Option(
        10,
        "--limit",
        "-n",
        help="Number of decisions to show",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """Show recent scheduler decisions."""
    await init_db()

    async with async_session() as session:
        decisions = await smart_scheduler_service.get_decisions(session, limit)

    if json_output:
        print_json([d.model_dump() for d in decisions])
        return

    console = get_console()
    console.print()
    console.print("[bold cyan]Recent Scheduler Decisions[/bold cyan]")
    console.print()

    if not decisions:
        console.print("[dim]No decisions recorded yet[/dim]")
        return

    for decision in decisions:
        phase_colors = {"normal": "green", "burst": "red", "recovery": "yellow"}
        phase_color = phase_colors.get(decision.phase, "white")

        console.print(f"  [{phase_color}]{decision.phase.upper()}[/{phase_color}] "
                      f"{decision.previous_interval_minutes}min → {decision.new_interval_minutes}min")
        console.print(f"    [dim]{decision.timestamp.strftime('%Y-%m-%d %H:%M:%S')} | "
                      f"Stability: {decision.stability_score:.0%} | {decision.reason}[/dim]")
        console.print()
