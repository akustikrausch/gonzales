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

### Phase 4: Page Transitions + Number Animations [TODO]
**Goal**: Add motion design that makes the app feel alive

- [ ] Route transition animations (fade + subtle slide between pages)
- [ ] Animated number counting (values animate from current to target)
  - Hook: `useAnimatedNumber(value, duration)` with easing
  - Apply to: SpeedGauge, StatsOverview, SlaCard, ReliabilityCard, Percentiles
- [ ] Chart draw-in animations (lines/bars animate progressively on mount)
  - Recharts `animationDuration` and `animationBegin` props
  - Stagger for multi-series charts
- [ ] Staggered list animations for history table rows
- [ ] Improved page header entrance animations

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

### Phase 5: Futuristic Live Test View (Web) [TODO]
**Goal**: Make the live speed test a showpiece -- dramatic, cinematic, futuristic

- [ ] Full-width dramatic entrance (scale + fade from center)
- [ ] Enhanced SpeedNeedle with:
  - Glow effect around needle (SVG filter: drop-shadow with color)
  - Tick marks with gradient opacity
  - Animated arc fill showing current speed range
  - Subtle pulse animation on the needle tip
- [ ] Real-time bandwidth with counting animation (not instant jump)
- [ ] Phase transition animations (smooth morph between ping/dl/ul)
- [ ] Background data stream visualization (subtle animated lines or particles via CSS)
- [ ] Enhanced ProgressRing with gradient stroke + glow
- [ ] Results reveal: staggered card appearance with spring animation
- [ ] Color theme per phase:
  - Ping: warm orange/amber glow
  - Download: cool blue/cyan glow
  - Upload: vibrant green/teal glow

**Files to modify**:
- `frontend/src/components/speedtest/LiveTestView.tsx`
- `frontend/src/components/speedtest/SpeedNeedle.tsx`
- `frontend/src/components/speedtest/ProgressRing.tsx`
- `frontend/src/design-system/animations.css` -- Glow keyframes

**Verify**: `npm run build` passes, trigger test and observe live view

---

### Phase 6: Innovative Statistics + Insights [TODO]
**Goal**: Statistics that no competitor offers

#### Backend additions:
- [ ] Anomaly detection (flag >2 stddev outliers per metric)
- [ ] Peak/off-peak analysis (business hours vs evening vs night)
- [ ] ISP performance composite score (0-100)
- [ ] Best/worst time window identification
- [ ] Correlation computation (download vs upload vs ping vs jitter)
- [ ] Degradation detection (sustained drops vs one-off anomalies)
- [ ] Predictive trend projection (7-day forecast)

#### Frontend additions:
- [ ] Anomaly highlighting in charts (red dots/markers)
- [ ] ISP Score card with animated circular gauge
- [ ] Peak/Off-Peak comparison visualization
- [ ] Network quality timeline (color-coded time blocks)
- [ ] Correlation matrix heatmap
- [ ] Best/Worst time badges with Lucide icons
- [ ] Predictive trend line (dashed) on trend chart
- [ ] Degradation alert banner

**Backend files to modify**:
- `backend/gonzales/services/statistics_service.py` -- New analysis functions
- `backend/gonzales/schemas/statistics.py` -- New response models
- `backend/gonzales/api/v1/statistics.py` -- Extend enhanced endpoint

**Frontend files to create**:
- `frontend/src/components/statistics/IspScoreCard.tsx`
- `frontend/src/components/statistics/PeakAnalysis.tsx`
- `frontend/src/components/statistics/QualityTimeline.tsx`
- `frontend/src/components/statistics/CorrelationMatrix.tsx`
- `frontend/src/components/statistics/AnomalyMarkers.tsx`
- `frontend/src/components/statistics/DegradationAlert.tsx`

**Frontend files to modify**:
- `frontend/src/api/types.ts` -- New TypeScript interfaces
- `frontend/src/hooks/useApi.ts` -- New query hooks if needed
- `frontend/src/pages/StatisticsPage.tsx` -- Add new tabs/sections

**Verify**: `npm run build` passes, enhanced stats endpoint returns new fields

---

### Phase 7: TUI Real-Time Test View [TODO]
**Goal**: Terminal speed test visualization that matches the web version in drama

- [ ] New TUI screen: `TestScreen` with real-time gauge
- [ ] Subscribe to event bus during test (not 10s polling)
- [ ] ASCII speed gauge with gradient block characters
- [ ] Live progress bar with phase label and percentage
- [ ] Real-time bandwidth display updating per-event
- [ ] Mini sparkline showing bandwidth over test duration
- [ ] Phase color transitions (neon palette)
- [ ] Completion summary with formatted results
- [ ] Keybinding: `T` triggers test AND switches to TestScreen

**Files to create**:
- `backend/gonzales/tui/screens/test.py` -- Real-time test screen
- `backend/gonzales/tui/widgets/live_gauge.py` -- Animated ASCII gauge

**Files to modify**:
- `backend/gonzales/tui/app.py` -- Add TestScreen, wire keybinding
- `backend/gonzales/tui/styles/gonzales.tcss` -- Test screen styling

**Verify**: `make tui`, press T, observe real-time updates during test

---

### Phase 8: Tech Styleguide Document [TODO]
**Goal**: Comprehensive design reference for contributors and AI assistants

- [ ] STYLEGUIDE.md with:
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

**Files to create**:
- `STYLEGUIDE.md`

**Verify**: Read through for completeness, cross-reference with actual CSS

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

### Phase 10: Final Polish + Verification [TODO]
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
