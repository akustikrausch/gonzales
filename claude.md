# Gonzales - Internet Speed Monitor

## Project Overview

Gonzales is a local network speed monitoring tool. It runs automated internet speed tests at configurable intervals using the Ookla Speedtest CLI, stores results in SQLite, and provides both a web dashboard and a terminal UI for visualization. Designed to prove ISP bandwidth and stability issues.

## Architecture

### Backend (`backend/gonzales/`)

Python FastAPI application with async SQLAlchemy and APScheduler.

- **Entry point**: `__main__.py` runs uvicorn, `main.py` contains the FastAPI app factory with lifespan (DB init, scheduler start/stop)
- **Config**: `config.py` -- Pydantic Settings, all env vars prefixed `GONZALES_`. Mutable keys (interval, thresholds, preferred_server_id, cooldown, theme) persisted to `config.json`
- **Database**: `db/engine.py` (async SQLite + WAL mode), `db/models.py` (Measurement, TestFailure), `db/repository.py` (query layer)
- **Services**:
  - `services/speedtest_runner.py` -- Ookla CLI subprocess. `run()` for simple execution, `run_with_progress()` for SSE streaming with progress events, `list_servers()` for server enumeration
  - `services/measurement_service.py` -- orchestrates tests, threshold checks, asyncio lock, publishes events to event_bus
  - `services/scheduler_service.py` -- APScheduler recurring test execution
  - `services/statistics_service.py` -- basic stats (percentiles, aggregates) + enhanced stats (hourly, daily, trend regression, SLA compliance, reliability score, per-server breakdown)
  - `services/event_bus.py` -- async pub/sub for real-time SSE streaming. `EventBus` class with per-subscriber `asyncio.Queue` fan-out
  - `services/export_service.py` -- CSV + PDF generation
- **API**: `api/v1/` -- REST endpoints for measurements, statistics (basic + enhanced), status, export, speedtest trigger + SSE stream, config, servers
- **Security**: `core/security.py` -- CORS (configurable origins), TrustedHost, GZip, security headers
- **TUI**: `tui/app.py` -- Textual app with demoscene styling, 3 screens (dashboard, history, settings)

### Frontend (`frontend/`)

React 19 + TypeScript + Vite 6 + Tailwind CSS 4 SPA with Liquid Glass design system.

- **Design System**: `src/design-system/` -- CSS custom properties (tokens.css), glass material classes (liquid-glass.css), animations (animations.css). Supports auto/light/dark themes via `data-theme` attribute
- **UI Components**: `src/components/ui/` -- GlassCard, GlassButton, GlassInput, GlassBadge, GlassSelect, GlassProgress, Spinner, Logo
- **API client**: `src/api/client.ts` (fetch wrapper), `src/api/types.ts` (TypeScript interfaces matching backend schemas including enhanced statistics, servers)
- **Hooks**:
  - `src/hooks/useApi.ts` -- TanStack Query hooks for all API calls including enhanced statistics and servers
  - `src/hooks/useSSE.ts` -- EventSource hook for real-time speed test streaming
  - `src/hooks/useTheme.ts` -- theme state management (auto/light/dark)
  - `src/hooks/useMediaQuery.ts` -- responsive breakpoint hooks (useIsMobile, useIsTablet, useIsDesktop)
- **Layout**: `src/components/layout/` -- AppShell (responsive flex), Sidebar (collapsible on tablet), Header (theme toggle + run test), MobileNav (fixed bottom nav)
- **Speedtest**: `src/components/speedtest/` -- LiveTestView (SSE progress display), SpeedNeedle (SVG gauge), ProgressRing (SVG circular progress)
- **Pages**: Dashboard (with live test overlay), History, Statistics (tabbed: Overview/Time Analysis/Trends/Servers), Export, Settings (with server picker + theme selector)
- **Statistics**: `src/components/statistics/` -- HourlyHeatmap, DayOfWeekChart (radar), TrendChart (area), SlaCard, ReliabilityCard, ServerComparison (bar)
- **Built output**: Copied to `backend/gonzales/static/` and served by FastAPI at `/`

## Key Patterns

- All database access is async via SQLAlchemy + aiosqlite
- Speed tests are protected by an `asyncio.Lock` to prevent concurrent runs
- Manual triggers have a configurable cooldown (default 60s)
- Scheduler uses APScheduler `AsyncIOScheduler` with `max_instances=1`
- Frontend uses TanStack Query with 30s polling for auto-refresh
- Subprocess calls use list args (no `shell=True`)
- SSE streaming: backend publishes progress events to EventBus, `/api/v1/speedtest/stream` yields SSE events, frontend `useSSE` hook consumes via native EventSource API
- Design system uses CSS custom properties for theming; `data-theme` attribute on `<html>` for manual override
- Responsive layout: mobile (<768px) shows bottom nav, tablet (768-1023px) shows collapsed sidebar, desktop (1024px+) shows full sidebar

## Commands

```bash
make install    # Install all dependencies
make build      # Build frontend and copy to backend/gonzales/static
make run        # Start the server (python3 -m gonzales)
make tui        # Start terminal UI
make frontend-dev  # Vite dev server with API proxy
make test       # Run pytest
make lint       # Run ruff + eslint
make clean      # Remove build artifacts
```

## API Endpoints

All under `/api/v1`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/measurements` | Paginated list (page, page_size, date range, sort) |
| GET | `/measurements/latest` | Most recent result |
| GET | `/measurements/{id}` | Single measurement |
| DELETE | `/measurements/{id}` | Delete measurement |
| GET | `/statistics` | Basic stats with percentiles |
| GET | `/statistics/enhanced` | Enhanced stats (hourly, daily, trend, SLA, reliability, per-server) |
| GET | `/status` | Scheduler state, uptime, DB size |
| GET | `/export/csv` | Download CSV |
| GET | `/export/pdf` | Download PDF report |
| POST | `/speedtest/trigger` | Run test manually |
| GET | `/speedtest/stream` | SSE stream for real-time test progress |
| GET | `/config` | Current config |
| PUT | `/config` | Update config (interval, thresholds, preferred_server_id, cooldown, theme) |
| GET | `/servers` | List available speedtest servers |

## Database

SQLite at `gonzales.db` (created automatically in the working directory). WAL mode enabled. Two tables: `measurements` (speed test results) and `test_failures` (error log).

## Environment Variables

All prefixed with `GONZALES_`. See `.env.example`. Key settings: `HOST`, `PORT`, `TEST_INTERVAL_MINUTES`, `DOWNLOAD_THRESHOLD_MBPS`, `UPLOAD_THRESHOLD_MBPS`, `LOG_LEVEL`, `DEBUG`, `PREFERRED_SERVER_ID`, `THEME`.

## External Dependencies

- **Ookla Speedtest CLI** must be installed and available in PATH (`speedtest` command). The app warns at startup if not found but still starts.
- All Python dependencies are pure Python or have ARM64 wheels, making the project compatible with Raspberry Pi (ARM64)
