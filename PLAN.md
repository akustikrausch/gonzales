# Gonzales - Development Plan

Full requirements: see REQUIREMENTS.md

---

## Completed Phases (v1)

These phases built the functional foundation. All code exists and works.

### Phase 1: Backend Core [DONE]
- [x] FastAPI app with async SQLAlchemy + aiosqlite + SQLite WAL
- [x] Speedtest runner (Ookla CLI subprocess, no shell=True)
- [x] APScheduler for recurring tests (configurable interval)
- [x] Measurement + TestFailure models and repository
- [x] REST API: measurements CRUD, statistics, status, export (CSV/PDF)
- [x] Event bus (async pub/sub) + SSE endpoint for real-time streaming
- [x] Server listing + selection (preferred_server_id)
- [x] Persistent config (config.json) with GET/PUT API
- [x] Enhanced statistics service (percentiles, hourly, daily, trend, SLA, reliability, per-server)
- [x] Pydantic schemas for all endpoints
- [x] Security middleware (CORS, TrustedHost, GZip, headers)
- [x] TUI with Textual + Rich (dashboard, history, settings screens)

### Phase 2: Frontend Foundation [DONE]
- [x] React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- [x] Liquid Glass design system (tokens.css, liquid-glass.css, animations.css)
- [x] Glass UI components (Card, Button, Input, Badge, Select, Progress, Spinner, Logo)
- [x] Responsive layout (AppShell, Sidebar, Header, MobileNav)
- [x] Hooks (useApi with TanStack Query, useSSE, useTheme, useMediaQuery)
- [x] 5 pages: Dashboard, History, Statistics, Settings, Export
- [x] Live test view with SpeedNeedle gauge + ProgressRing
- [x] Statistics components (9 visualization components)
- [x] Server picker + settings form
- [x] Light/dark/auto theme support

---

## Remaining Phases (v2) -- Elevate to "Best on Market"

Current quality: 7.8/10. Target: 9.5/10.

### Phase 3: Design System Polish [TODO]
**Goal**: Elevate glass design from "solid" to "Apple 2026 premium"

- [ ] Multi-layer glass depth (stacked translucent layers, not flat)
- [ ] Enhanced shadow system (3+ levels: subtle, medium, elevated, floating)
- [ ] Hover micro-interactions on ALL interactive elements:
  - Cards: shadow elevation + scale(1.01) + translateY(-2px)
  - Buttons: ripple effect on click + spring scale on press
  - Table rows: glass tint highlight
  - Nav items: icon shift + subtle label glow
- [ ] Skeleton loading states with shimmer animation
- [ ] Tooltip animations (scale-in from origin, 150ms ease-out)
- [ ] Improved glass-select and glass-table hover states
- [ ] Consistent focus-visible rings on all interactive elements

**Files to modify**:
- `frontend/src/design-system/tokens.css` -- Add shadow scale, depth tokens
- `frontend/src/design-system/liquid-glass.css` -- Enhanced hover states, multi-layer glass
- `frontend/src/design-system/animations.css` -- Shimmer, ripple, tooltip animations
- `frontend/src/components/ui/*` -- Update all primitives with new interactions

**Verify**: `npm run build` passes, visual inspection of hover states

---

### Phase 4: Page Transitions + Number Animations [DONE]
**Goal**: Add motion design that makes the app feel alive

- [x] Route transition animations (fade + subtle slide between pages)
- [x] Animated number counting (values animate from current to target)
  - Hook: `useAnimatedNumber(value, duration)` with easeOutExpo
  - Applied to: SpeedGauge, StatsOverview, SlaCard, ReliabilityCard
- [x] Chart draw-in animations (lines/bars animate progressively on mount)
  - Recharts `animationDuration` and `animationBegin` props
  - Stagger for multi-series charts (200ms offset)
- [x] Staggered list animations for history table rows (30ms per row, max 300ms)
- [x] Percentile bars animate width with staggered easeOutExpo transitions
- [x] Glass-styled chart tooltips (backdrop-filter blur)

**Files to create**:
- `frontend/src/hooks/useAnimatedNumber.ts`
- `frontend/src/components/common/AnimatedNumber.tsx`
- `frontend/src/components/common/PageTransition.tsx`

**Files to modify**:
- `frontend/src/App.tsx` -- Wrap routes in transition component
- `frontend/src/components/dashboard/SpeedGauge.tsx` -- Animated values
- `frontend/src/components/statistics/*` -- Chart animations
- `frontend/src/pages/*` -- Page entrance animations

**Verify**: `npm run build` passes, smooth transitions visible

---

### Phase 5: Futuristic Live Test View (Web) [DONE]
**Goal**: Make the live speed test a showpiece -- dramatic, cinematic, futuristic

- [x] Full-width dramatic entrance (scale + fade from center)
- [x] Enhanced SpeedNeedle with:
  - Glow effect around needle (SVG filter: drop-shadow with color)
  - Tick marks with gradient opacity (21 minor ticks, 5 major ticks)
  - Animated arc fill showing current speed range (gradient arc with glow filter)
  - Subtle pulse animation on the needle tip (SVG animate elements)
- [x] Real-time bandwidth with counting animation (useAnimatedNumber hook)
- [x] Phase transition animations (g-animate-scale on phase change)
- [x] Background data stream visualization (DataStreamLines with g-shimmer CSS animation)
- [x] Enhanced ProgressRing with glow filter (optional `glow` prop with SVG feGaussianBlur)
- [x] Results reveal: staggered card appearance with spring animation (ResultCard with delay)
- [x] Color theme per phase:
  - Ping: warm orange/amber glow (var(--g-orange))
  - Download: cool blue/cyan glow (var(--g-blue))
  - Upload: vibrant green/teal glow (var(--g-green))

**Files to modify**:
- `frontend/src/components/speedtest/LiveTestView.tsx`
- `frontend/src/components/speedtest/SpeedNeedle.tsx`
- `frontend/src/components/speedtest/ProgressRing.tsx`
- `frontend/src/design-system/animations.css` -- Glow keyframes

**Verify**: `npm run build` passes, trigger test and observe live view

---

### Phase 6: Innovative Statistics + Insights [DONE]
**Goal**: Statistics that no competitor offers

#### Backend additions:
- [x] Anomaly detection (flag >2 stddev outliers per metric)
- [x] Peak/off-peak analysis (business hours 8-18, evening 18-23, night 23-8)
- [x] ISP performance composite score (0-100 with A+/A/B/C/D/F grade)
- [x] Best/worst time window identification (per metric)
- [x] Correlation computation (Pearson: download vs upload vs ping vs jitter)
- [x] Degradation detection (recent 10 tests vs historical, 15/25/40% thresholds)
- [x] Predictive trend projection (7-day linear forecast with confidence level)

#### Frontend additions:
- [x] Anomaly highlighting (red dot cards with z-score and mean)
- [x] ISP Score card with animated circular gauge (ProgressRing + score bars)
- [x] Peak/Off-Peak comparison visualization (3 period cards + best/worst badges)
- [x] Network quality timeline (24-hour color-coded blocks with tooltips)
- [x] Correlation matrix heatmap (4x4 with color intensity)
- [x] Best/Worst time badges with Lucide icons
- [x] Predictive trend line (dashed) on trend chart
- [x] Degradation alert banner (severity-colored, auto-shows at page top)

**Backend files modified**:
- `backend/gonzales/services/statistics_service.py` -- 7 new analysis functions
- `backend/gonzales/schemas/statistics.py` -- 12 new Pydantic models

**Frontend files created**:
- `frontend/src/components/statistics/IspScoreCard.tsx`
- `frontend/src/components/statistics/PeakAnalysis.tsx`
- `frontend/src/components/statistics/QualityTimeline.tsx`
- `frontend/src/components/statistics/CorrelationMatrix.tsx`
- `frontend/src/components/statistics/DegradationAlert.tsx`

**Frontend files modified**:
- `frontend/src/api/types.ts` -- 12 new TypeScript interfaces
- `frontend/src/components/statistics/TrendChart.tsx` -- Prediction line support
- `frontend/src/pages/StatisticsPage.tsx` -- New "Insights" tab, degradation alerts

**Verify**: `npm run build` passes (794 KB JS, 36 KB CSS)

---

### Phase 7: TUI Real-Time Test View [DONE]
**Goal**: Terminal speed test visualization that matches the web version in drama

- [x] New TUI screen: `TestScreen` with real-time gauge
- [x] Subscribe to event bus during test (async generator, not polling)
- [x] ASCII speed gauge with gradient block characters (░▒▓█)
- [x] Live progress bar with phase label and percentage
- [x] Real-time bandwidth display updating per-event
- [x] Mini sparkline showing bandwidth over test duration (▁▂▃▄▅▆▇█)
- [x] Phase color transitions (neon palette: cyan/magenta/yellow/green/red)
- [x] Completion summary with formatted box-drawing results
- [x] Keybinding: `T` triggers test AND switches to TestScreen from any screen

**Files created**:
- `backend/gonzales/tui/screens/test.py` -- Real-time test screen with event bus subscription
- `backend/gonzales/tui/widgets/live_gauge.py` -- Animated ASCII gauge with sparkline + progress bar

**Files modified**:
- `backend/gonzales/tui/app.py` -- Added TestScreen mode, `run_test_screen()` method
- `backend/gonzales/tui/screens/dashboard.py` -- T binding switches to test screen
- `backend/gonzales/tui/screens/history.py` -- T binding switches to test screen
- `backend/gonzales/tui/widgets/ascii_banner.py` -- Added missing SUBTITLE constant
- `backend/gonzales/tui/styles/gonzales.tcss` -- Test screen styling

**Verify**: `make tui`, press T, observe real-time updates during test

---

### Phase 8: Tech Styleguide Document [DONE]
**Goal**: Comprehensive design reference for contributors and AI assistants

- [x] STYLEGUIDE.md with:
  - Design token reference (all CSS variables with values)
  - Color palette with hex codes and usage context
  - Typography scale (font sizes, weights, line heights)
  - Spacing scale (4px base, all steps)
  - Border radius scale
  - Shadow system (all levels)
  - Glass component catalog (each component with props and usage)
  - Animation classes (names, durations, easing curves)
  - Icon guidelines (Lucide only, size conventions, color rules)
  - Responsive breakpoints (mobile/tablet/desktop px values)
  - Theme implementation (data-theme attribute, CSS variable overrides)
  - Do's and Don'ts with concrete examples
  - TUI style reference (neon palette, ASCII conventions)

**Files created**:
- `STYLEGUIDE.md`

**Verify**: Cross-referenced with actual CSS files (tokens.css, animations.css, liquid-glass.css)

---

### Phase 9: Home Assistant Integration [TODO]
**Goal**: Separate repo with HACS-compatible HA custom integration

- [ ] Create `gonzales-ha` repo structure
- [ ] `custom_components/gonzales/manifest.json` (HA Feb 2026 compatible)
- [ ] Config flow (host, port, polling interval)
- [ ] Coordinator with async polling from Gonzales API
- [ ] Sensor entities:
  - Download speed (Mbps)
  - Upload speed (Mbps)
  - Ping latency (ms)
  - Ping jitter (ms)
  - Packet loss (%)
  - Last test time
  - ISP performance score
- [ ] Diagnostic sensors (scheduler status, uptime, DB size)
- [ ] Device info (Gonzales instance as device)
- [ ] HACS `hacs.json` for custom repository install
- [ ] README with installation and configuration guide

**Repo**: `gonzales-ha/` (separate from main gonzales repo)

**Verify**: HACS validation, HA config flow loads, sensors populate

---

### Phase 10: Git Hygiene + Privacy Protection [DONE]
**Goal**: Ensure no private/runtime files are ever pushed to git

#### Strategy:
- Runtime files (config, DB, logs) are gitignored and auto-created on first run
- Template files (`*.example`) are committed as reference for users
- Backend startup ensures required directories exist

#### Deliverables:
- [x] Enhanced `.gitignore`:
  - Added `config.json` (runtime user settings)
  - Added `*.sqlite` (alternative DB extension)
  - Added `backend/logs/` and `frontend/logs/` explicitly
  - Added `*.bak`, `*.tmp`, `*.orig` (temp files)
  - Added `*.tsbuildinfo` (TypeScript build cache)
  - Verified all sensitive patterns covered
- [x] Removed tracked build artifact from git index (`git rm --cached tsconfig.tsbuildinfo`)
- [x] Create template files:
  - `config.json.example` -- Default config with all MUTABLE_KEYS documented
  - `.env.example` -- Updated with all Settings fields (added DB_PATH, CORS_ORIGINS, SPEEDTEST_BINARY, MANUAL_TRIGGER_COOLDOWN_SECONDS)
- [x] Backend auto-creation on startup:
  - `logs/` directory created by logging setup (logging.py)
  - `config.json` created on first settings save (save_config())
  - `gonzales.db` created by init_db() with WAL mode
- [x] Added "Runtime Files" section in README explaining:
  - Which files are gitignored and why (table format)
  - How to configure via config.json or .env
  - What gets auto-created on first run
  - Updated config tables in both EN and DE sections with all variables

**Files modified**:
- `.gitignore` -- Added config.json, *.sqlite, *.tsbuildinfo, *.bak, *.tmp, *.orig
- `config.json.example` -- New template file with all MUTABLE_KEYS
- `.env.example` -- Added missing variables, organized into sections
- `README.md` -- Added Runtime Files section, updated config tables (EN + DE)

**Verify**: `git status` shows no private files, templates exist, fresh clone works

---

### Phase 11: Final Polish + Verification [TODO]
**Goal**: Everything builds, looks perfect, zero errors

- [ ] Frontend build passes (`npm run build`)
- [ ] TypeScript strict mode passes (`tsc --noEmit`)
- [ ] No unused imports or dead code
- [ ] All Lucide icons consistent (no emoji anywhere)
- [ ] Backend lint passes (`ruff check`)
- [ ] Backend tests exist and pass for critical services
- [ ] Code splitting for bundle size optimization
- [ ] README.md fully up to date
- [ ] claude.md reflects final architecture
- [ ] All API endpoints documented and verified
- [ ] Copy built frontend to backend/gonzales/static/
- [ ] Manual end-to-end test: start server, run test, check all pages

**Verify**: Full build pipeline, visual inspection of all pages and TUI

---

## Architecture Decisions

1. **SQLite with WAL mode** -- No external DB, concurrent read/write support
2. **APScheduler** -- In-process, no Redis/Celery needed
3. **SSE over WebSockets** -- Simpler protocol, native EventSource browser API
4. **TanStack Query** -- Server state with 30s polling + cache invalidation
5. **Liquid Glass CSS** -- Custom design system, no UI library dependency
6. **Tailwind CSS 4** -- Utility-first, pairs with CSS custom properties
7. **Pydantic Settings** -- Type-safe config with env vars + runtime mutation
8. **Async-first** -- All DB via async SQLAlchemy + aiosqlite
9. **No shell=True** -- List args for subprocess security
10. **Lucide React** -- Consistent icon library, no emojis
11. **Phased execution** -- Small context-friendly phases with persistent docs

---

## Execution Notes

- Update STATUS.md after completing each phase
- Verify build after every phase (`npm run build`)
- Each phase should be completable in one context window
- If a phase is too large, split it before starting
- REQUIREMENTS.md is the source of truth for what we want
- PLAN.md is the source of truth for how we get there
- STATUS.md is the source of truth for where we are
