# Gonzales - Internet Speed Monitor

## Project Overview

Gonzales is a local network speed monitoring tool by Warp9. It runs automated internet speed tests at configurable intervals using the Ookla Speedtest CLI, stores results in SQLite, and provides both a web dashboard and a terminal UI for visualization.

## Architecture

### Backend (`backend/gonzales/`)

Python FastAPI application with async SQLAlchemy and APScheduler.

- **Entry point**: `__main__.py` runs uvicorn, `main.py` contains the FastAPI app factory with lifespan (DB init, scheduler start/stop)
- **Config**: `config.py` — Pydantic Settings, all env vars prefixed `GONZALES_`
- **Database**: `db/engine.py` (async SQLite + WAL mode), `db/models.py` (Measurement, TestFailure), `db/repository.py` (query layer)
- **Services**: `services/speedtest_runner.py` (Ookla CLI subprocess), `services/measurement_service.py` (orchestrates tests, threshold checks, asyncio lock), `services/scheduler_service.py` (APScheduler), `services/statistics_service.py` (percentiles, aggregates), `services/export_service.py` (CSV + PDF)
- **API**: `api/v1/` — REST endpoints for measurements, statistics, status, export, speedtest trigger, config. All under `/api/v1`
- **Security**: `core/security.py` — CORS, TrustedHost, GZip, security headers
- **TUI**: `tui/app.py` — Textual app with demoscene styling, 3 screens (dashboard, history, settings)

### Frontend (`frontend/`)

React 19 + TypeScript + Vite 6 + Tailwind CSS 4 SPA.

- **API client**: `src/api/client.ts` (fetch wrapper), `src/api/types.ts` (TypeScript interfaces matching backend schemas)
- **Hooks**: `src/hooks/useApi.ts` — TanStack Query hooks for all API calls
- **Pages**: Dashboard, History, Statistics, Export, Settings
- **Components**: Organized by feature — `dashboard/`, `statistics/`, `history/`, `export/`, `common/`, `layout/`
- **Built output**: Copied to `backend/gonzales/static/` and served by FastAPI at `/`

## Key Patterns

- All database access is async via SQLAlchemy + aiosqlite
- Speed tests are protected by an `asyncio.Lock` to prevent concurrent runs
- Manual triggers have a 60-second cooldown
- Scheduler uses APScheduler `AsyncIOScheduler` with `max_instances=1`
- Frontend uses TanStack Query with 30s polling for auto-refresh
- Subprocess calls use list args (no `shell=True`)

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

## Database

SQLite at `gonzales.db` (created automatically in the working directory). WAL mode enabled. Two tables: `measurements` (speed test results) and `test_failures` (error log).

## Environment Variables

All prefixed with `GONZALES_`. See `.env.example`. Key settings: `HOST`, `PORT`, `TEST_INTERVAL_MINUTES`, `DOWNLOAD_THRESHOLD_MBPS`, `UPLOAD_THRESHOLD_MBPS`, `LOG_LEVEL`, `DEBUG`.

## External Dependencies

- **Ookla Speedtest CLI** must be installed and available in PATH (`speedtest` command). The app warns at startup if not found but still starts.
