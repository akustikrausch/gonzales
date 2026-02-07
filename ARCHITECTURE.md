# Gonzales - Internet Speed Monitor

## Project Overview

Gonzales is a local network speed monitoring tool. It runs automated internet speed tests at configurable intervals using the Ookla Speedtest CLI, stores results in SQLite, and provides both a web dashboard and a terminal UI for visualization. Designed to monitor and document ISP bandwidth and stability issues.

## Architecture

### Backend (`backend/gonzales/`)

Python FastAPI application with async SQLAlchemy and APScheduler.

- **Entry point**: `__main__.py` runs uvicorn with startup security warning, `main.py` contains the FastAPI app factory with lifespan (DB init, scheduler start/stop, security warning when host != 127.0.0.1 and no API key)
- **Config**: `config.py` -- Pydantic Settings, all env vars prefixed `GONZALES_`. Mutable keys (interval, thresholds, preferred_server_id, cooldown, theme, isp_name, data_retention_days, webhook_url, smart_scheduler_*) persisted to `config.json`
- **Database**: `db/engine.py` (async SQLite + WAL mode), `db/models.py` (Measurement, TestFailure), `db/repository.py` (query layer)
- **Services**:
  - `services/speedtest_runner.py` -- Ookla CLI subprocess. `run()` for simple execution, `run_with_progress()` for SSE streaming with progress events, `list_servers()` for server enumeration
  - `services/measurement_service.py` -- orchestrates tests, threshold checks, asyncio lock, publishes events to event_bus
  - `services/scheduler_service.py` -- APScheduler recurring test execution
  - `services/statistics_service.py` -- basic stats (percentiles, aggregates) + enhanced stats (hourly, daily, trend regression, SLA compliance, reliability score, per-server breakdown) + innovative insights (anomaly detection, ISP score, peak/off-peak, correlations, degradation alerts, predictions)
  - `services/event_bus.py` -- async pub/sub for real-time SSE streaming. `EventBus` class with per-subscriber `asyncio.Queue` fan-out
  - `services/export_service.py` -- CSV + PDF + professional compliance report generation
  - `services/smart_scheduler_service.py` -- adaptive test intervals based on network stability (normal/burst/recovery phases, daily data budget)
  - `services/root_cause_service.py` -- multi-layer network health analysis (DNS/local/ISP), fingerprinting, hop correlations, recommendations
  - `services/qos_service.py` -- QoS profile evaluation (gaming, streaming, video calls, remote work)
  - `services/topology_service.py` -- traceroute analysis, hop tracking, network diagnosis
  - `services/retention_service.py` -- data retention enforcement (delete data older than N days)
  - `services/webhook_service.py` -- webhook notifications for events
- **API**: `api/v1/` -- REST endpoints for measurements, statistics, status, export, speedtest, config, servers, outages, qos, topology, summary, smart-scheduler, root-cause
- **Security**: `core/security.py` -- CORS (configurable origins), TrustedHost, GZip, security headers
- **TUI**: `tui/app.py` -- Textual app with demoscene styling, 4 screens (dashboard, history, settings, real-time test)
  - `tui/screens/test.py` -- Real-time test screen with event bus subscription
  - `tui/widgets/live_gauge.py` -- ASCII gauge with big speed numbers, animated data flow, elapsed timer, sparkline, progress bar, box-drawing results
  - `tui/widgets/big_speed.py` -- 3-line-tall ASCII art digit renderer using block characters
  - `tui/widgets/data_flow.py` -- 5-row animated ASCII data flow visualization (scroll direction and density scale with phase/bandwidth)

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
  - `src/hooks/useAnimatedNumber.ts` -- requestAnimationFrame number animation with easeOutExpo, animates from current visual position (not previous target) for smooth transitions during rapid polling
  - `src/hooks/useSpeedHistory.ts` -- accumulates {time, value} bandwidth samples during download/upload with throttled re-renders (~250ms)
- **Layout**: `src/components/layout/` -- AppShell (responsive flex), Sidebar (collapsible on tablet), Header (theme toggle + run test), MobileNav (fixed bottom nav)
- **Speedtest**: `src/components/speedtest/` -- LiveTestView (SSE progress with canvas particle system, live speed graph, elapsed timer, phase transition animations), SpeedNeedle (240° bottom-centered SVG gauge with glow filters, gradient arc, pulsing tip), ProgressRing (SVG circular progress with optional glow), DataFlowCanvas (HTML Canvas particle system with 60-120 glowing particles, direction/density scales with bandwidth, prefers-reduced-motion fallback), LiveSpeedGraph (pure SVG area chart with glow filter and pulsing dot), ElapsedTimer (M:SS elapsed display)
- **Pages**: Dashboard (with live test overlay), History, Statistics (tabbed: Overview/Time Analysis/Trends/Servers/Insights), Export, Settings (with server picker + theme selector), QoS (quality of service profiles), Topology (network path analysis), Root Cause (network health analysis), Docs (built-in documentation). All pages lazy-loaded via React.lazy()
- **Statistics**: `src/components/statistics/` -- HourlyHeatmap, DayOfWeekChart (radar), TrendChart (area with prediction lines), SlaCard, ReliabilityCard, ServerComparison (bar), IspScoreCard, PeakAnalysis, QualityTimeline, CorrelationMatrix, DegradationAlert
- **Common**: `src/components/common/` -- AnimatedNumber (easeOutExpo counting), PageTransition (route fade/slide)
- **Built output**: Copied to `backend/gonzales/static/` and served by FastAPI at `/`. Code-split: vendor, charts, query as separate chunks

## Key Patterns

- All database access is async via SQLAlchemy + aiosqlite
- Speed tests are protected by an `asyncio.Lock` to prevent concurrent runs
- Manual triggers have a configurable cooldown (default 60s)
- Scheduler uses APScheduler `AsyncIOScheduler` with `max_instances=1`
- Frontend uses TanStack Query with 30s polling for auto-refresh
- Subprocess calls use list args (no `shell=True`)
- SSE streaming: backend publishes progress events to EventBus (max 20 subscribers, 5min timeout), `/api/v1/speedtest/stream` yields SSE events with `application/octet-stream` content-type (bypasses HA Core compression), frontend `useSSE` hook consumes via `fetch()`+`ReadableStream` (not EventSource, which rejects non-text/event-stream)
- Polling fallback for HA Ingress: when SSE doesn't work (5s timeout), polls `/api/v1/status` every 2s. Status endpoint exposes `test_progress` (phase, bandwidth_mbps, progress, ping_ms, elapsed) from `event_bus._last_event` when a test is running. Grace period of 60s before treating `test_in_progress=false` as completion.
- Version check: `useVersionCheck` compares `FRONTEND_VERSION` constant against `status.version` from backend. On mismatch, reloads once (tracked via `sessionStorage` to prevent infinite loops when HA Ingress proxy caches old assets)
- Optional API key auth: `GONZALES_API_KEY` env var. When set, mutating endpoints (PUT config, POST trigger, DELETE measurements) require `X-API-Key` header. Read-only endpoints remain open. Startup warns if host != 127.0.0.1 and no API key is configured.
- Security headers: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy. CORS restricted to configured origins with specific methods/headers.
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

## Tests

Backend tests in `backend/tests/` (114 tests, run with `cd backend && python3 -m pytest tests/ -v`):

- **`conftest.py`** -- Shared fixtures: in-memory SQLite engine, session, measurement factory, FastAPI test app with overridden DB dependency, httpx AsyncClient
- **`test_statistics_pure.py`** -- Pure function tests (no DB): `_percentile`, `_stddev`, `_linear_regression`, `_pearson`, `_compute_speed_stats`, `_compute_isp_score`, `_detect_anomalies`, `_compute_peak_offpeak`, `_detect_degradation`
- **`test_event_bus.py`** -- EventBus pub/sub: publish/subscribe, fan-out, subscriber count/limit, complete/error termination, cleanup after disconnect
- **`test_repository.py`** -- Repository CRUD with in-memory SQLite: create, get_by_id, get_latest, get_paginated (pagination, sorting, date filters), delete, count, get_statistics, TestFailureRepository
- **`test_api.py`** -- REST API via httpx: measurements CRUD, statistics (basic + enhanced), status, API key authentication (protected/unprotected/wrong key)
- **`test_retention_service.py`** -- Data retention service tests
- **`test_rate_limit.py`** -- Rate limiting middleware tests
- **`test_topology_validation.py`** -- Topology IP validation and security tests
- **`test_measurement_service.py`** -- Measurement service orchestration tests
- **`test_webhook_service.py`** -- Webhook notification service tests

## API Endpoints

All under `/api/v1`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/measurements` | Paginated list (page, page_size, date range, sort) |
| GET | `/measurements/latest` | Most recent result |
| GET | `/measurements/{id}` | Single measurement |
| DELETE | `/measurements/{id}` | Delete measurement |
| DELETE | `/measurements/all` | Delete all measurements (requires `?confirm=true`) |
| GET | `/statistics` | Basic stats with percentiles |
| GET | `/statistics/enhanced` | Enhanced stats + insights (hourly, daily, trend, SLA, reliability, per-server, anomalies, ISP score, peak/off-peak, correlations, degradation, predictions) |
| GET | `/summary` | AI-friendly status summary (supports `?format=markdown`) |
| GET | `/status` | Scheduler state, uptime, DB size |
| PUT | `/status/scheduler` | Enable/disable the scheduler |
| GET | `/export/csv` | Download CSV |
| GET | `/export/pdf` | Download PDF report |
| GET | `/export/report/professional` | Professional compliance report (PDF) |
| POST | `/speedtest/trigger` | Run test manually |
| GET | `/speedtest/stream` | SSE stream for real-time test progress |
| GET | `/config` | Current config |
| PUT | `/config` | Update config (interval, thresholds, preferred_server_id, cooldown, theme, isp_name, data_retention_days, webhook_url) |
| GET | `/servers` | List available speedtest servers |
| GET | `/outages` | List detected outages |
| GET | `/outages/statistics` | Aggregated outage statistics |
| GET | `/qos/profiles` | All QoS profiles with requirements |
| GET | `/qos/current` | QoS status for latest measurement |
| GET | `/qos/evaluate/{id}` | Evaluate measurement against QoS profiles |
| GET | `/qos/history/{profile_id}` | QoS compliance history |
| POST | `/topology/analyze` | Run traceroute analysis |
| GET | `/topology/latest` | Most recent topology analysis |
| GET | `/topology/history` | Recent topology analyses |
| GET | `/topology/diagnosis` | Aggregated network diagnosis |
| GET | `/topology/{id}` | Specific topology analysis |
| GET | `/smart-scheduler/status` | Smart scheduler status |
| GET/PUT | `/smart-scheduler/config` | Smart scheduler configuration |
| POST | `/smart-scheduler/enable` | Enable smart scheduling |
| POST | `/smart-scheduler/disable` | Disable smart scheduling |
| GET/POST | `/root-cause/analysis` | Root-cause analysis with recommendations |

## Database

SQLite at `gonzales.db` (created automatically in the working directory). WAL mode enabled. Two tables: `measurements` (speed test results) and `test_failures` (error log).

## Environment Variables

All prefixed with `GONZALES_`. See `.env.example`. Key settings: `HOST`, `PORT`, `TEST_INTERVAL_MINUTES`, `DOWNLOAD_THRESHOLD_MBPS`, `UPLOAD_THRESHOLD_MBPS`, `LOG_LEVEL`, `DEBUG`, `PREFERRED_SERVER_ID`, `THEME`, `API_KEY` (required when host != 127.0.0.1).

## External Dependencies

- **Ookla Speedtest CLI** must be installed and available in PATH (`speedtest` command). The app warns at startup if not found but still starts.
- All Python dependencies are pure Python or have ARM64 wheels, making the project compatible with Raspberry Pi (ARM64)
