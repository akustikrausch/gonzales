# Changelog

All notable changes to Gonzales will be documented in this file.

## [3.9.3] - 2026-02-07

### Bug Fixes

- **Fix premature test completion in HA Ingress polling** (root cause!): `confirmTestStarted()` from trigger response was bypassing the grace period - first poll seeing `test_in_progress=false` was treated as "completed" after only 6 seconds while the test was still running.
- **Fix "complete" phase never rendering**: `stopPolling()` reset progress to "idle" in same React batch as "complete", so the complete phase was never displayed. Split into `stopPollingInterval()` (keeps progress) and `resetPolling()` (full reset).
- **Increase grace period to 60s**: More headroom for slow HA Ingress proxy chains.
- **Increase poll interval to 2s**: Reduce proxy load during test.

---

## [3.9.2] - 2026-02-07

### Bug Fixes

- **Fix live test view disappearing in HA Ingress**: Added sticky `testActive` flag that prevents the speed meter from flickering off due to transient state changes during proxy delays. LiveTestView now stays mounted from test start until completion.
- **Add visible debug overlay**: Green-on-black diagnostic bar on dashboard showing SSE state, polling status, trigger state, phase, and poll results - visible without browser DevTools.
- **Improve polling diagnostics**: Track poll count, last poll result, and trigger state for better troubleshooting in HA Ingress environments.
- **Fix console.debug invisibility**: Changed all `console.debug()` to `console.log()` (debug level hidden by default in Chrome).
- **Add cache-busting to status polls**: Prevent HA Ingress proxy from caching status responses during test.

---

## [3.9.1] - 2026-02-07

### Bug Fixes

- **Fix live test view in Home Assistant Ingress**: Speed meter now stays visible during tests instead of disappearing after a few seconds. Fixed race condition where polling fallback would immediately mark the test as "complete" before the trigger POST reached the backend through the Ingress proxy chain (especially slow via Nabu Casa remote access). Added 30-second grace period for test startup detection.
- **Add error handling for test trigger**: Trigger POST failures are now caught instead of being silently swallowed as unhandled promise rejections.
- **Add debug logging**: Browser console now shows `[gonzales]` prefixed debug messages for SSE connection, polling fallback, and test trigger diagnostics.

---

## [3.9.0] - 2026-02-07

### New Features

- **Dashboard: Connection Health Score** - New widget showing composite ISP health score (0-100) with letter grade (A-F), 4 breakdown bars (Speed, Reliability, Latency, Consistency), and plain-language summary
- **Dashboard: Outage Alert Banner** - Red warning banner shows immediately when an outage is detected with failure count and start time
- **Dashboard: Enhanced Latest Result** - Added Jitter, Packet Loss, and Connection Type (WiFi/Ethernet/VPN) fields to the latest test result card
- **Statistics: Confidence Bands** - Trend chart now shows shaded confidence intervals for enhanced predictions with seasonal day-of-week factors
- **Statistics: Data Usage** - Overview now shows Total Data Used and Average Data per Test

### Improvements

- **Mobile: Tab Navigation** - Statistics tabs now scroll horizontally with snap behavior on mobile devices
- **Mobile: Heatmap Readability** - Hourly heatmap uses 8-column grid on mobile (was 12), larger text
- **Mobile: Grid Breakpoints** - Added `md:` breakpoints for tablet-sized screens across distribution charts
- **Mobile: Version Footer** - Version number now visible in mobile bottom sheet navigation
- **Version Links** - Version number is now clickable in sidebar, mobile nav, and settings page (links to GitHub releases)

---

## [3.8.0] - 2026-02-07

### Bug Fixes

- **SSE Streaming in HA Ingress**: Definitive fix for live speedtest view not working in Home Assistant
  - Root cause: HA Core's `should_compress()` applies deflate to `text/event-stream`, breaking SSE streaming through ingress proxy
  - Fix: Use `application/octet-stream` content-type to bypass HA Core compression entirely
  - Replace browser `EventSource` API with `fetch()` + `ReadableStream` + manual SSE parsing (EventSource rejects non-text/event-stream)
  - Add 15-second keepalive heartbeats to prevent proxy idle timeouts
  - Fix orphaned timer leak in polling fallback (`startPolling` now clears existing timeout)
  - Fix auto-connect infinite loop when SSE reconnection fails repeatedly
  - Increase SSE detection timeout from 3s to 5s (HA ingress adds latency)

---

## [3.7.7] - 2026-02-07

### Bug Fixes

- **TUI**: Fix indistinguishable digits 2/3 and 6/8 in big speed display
- **TUI**: Fix event listener leak on screen remount, handle CancelledError
- **TUI**: Fix help screen showing undocumented keybindings
- **TUI**: Add consistent "t" keybinding on settings and statistics screens
- **MCP**: Add API key authentication to all requests
- **MCP**: Fix speedtest returning no results (add polling loop)
- **MCP**: Add timeouts on all HTTP requests
- **Backend**: Consolidate threshold logic into ThresholdConfig value object
- **Backend**: Extract shared math utils (pearson_correlation, coefficient_of_variation)
- **Backend**: Only trust X-Forwarded-For when running as HA addon
- **Frontend**: Add ErrorBoundary with glass-styled fallback UI
- **Frontend**: Fix accessibility gaps in Spinner, GlassSelect, Nav components
- **Frontend**: Fix Statistics tab styling (use variant prop instead of className)
- **Frontend**: Use unique SVG filter IDs via useId() to prevent conflicts

### Performance

- **Frontend**: Add React.memo on SpeedChart, MeasurementTable, NavGroup
- **Frontend**: Memoize data transforms in SpeedChart with useMemo
- **Frontend**: Optimize DataFlowCanvas (solid circles instead of per-particle gradients)
- **Frontend**: Skip rAF when document is hidden in useAnimatedNumber

### Documentation

- Fix CLI command references ("run" not "test")
- Add 14 missing API endpoints to README
- Fix config defaults (TEST_INTERVAL_MINUTES: 60, not 30)
- Update ARCHITECTURE.md with missing services and pages

---

## [3.7.6] - 2026-02-06

### Bug Fixes

- **Fix live progress display**: Mark test as started immediately and publish SSE event, so status polling shows progress right away

---

## [3.7.5] - 2026-02-06

### Bug Fixes

- **Fix HA integration speedtest trigger**: Handle 202 response from async endpoint

---

## [3.7.4] - 2026-02-06

### Bug Fixes

- **Fix startup crash**: Correct import name in speedtest.py

---

## [3.7.3] - 2026-02-06

### Bug Fixes

- **Fix 502 Bad Gateway on speedtest trigger**: Speedtest trigger endpoint now returns immediately (202 Accepted) and runs test in background, preventing Ingress proxy timeout

---

## [3.7.2] - 2026-02-06

### Bug Fixes

- **Fix live test view in Home Assistant**: Test progress now displays correctly during backend-initiated tests (fixes "Ready" badge showing during active tests)
- **Fix HA integration install**: Addon now cleans up `__pycache__` when installing integration, preventing "Invalid handler specified" errors on upgrade

---

## [3.7.1] - 2026-02-06

### Bug Fixes

- **Fix startup crash**: Correct import path in root_cause.py (`db.session` → `db.engine`)

---

## [3.7.0] - 2026-02-05

### New Features

**Smart Test Scheduling**
- **Adaptive test intervals**: Automatically adjusts test frequency based on network conditions
- **Three-phase model**: Normal (fixed interval) → Burst (frequent tests on anomaly) → Recovery (gradual return to normal)
- **Stability detection**: Uses coefficient of variation and z-score analysis to detect network instability
- **Safety mechanisms**: Circuit breaker (max tests per window), daily data budget (2 GB default), min/max interval limits
- **Settings UI**: New Smart Scheduler card in Settings page with phase indicator, stability score, and data budget display

**Root-Cause Analysis**
- **New Root-Cause page**: Comprehensive network diagnostics accessible from navigation
- **Network health score**: 0-100 composite score based on all network layers
- **Layer health breakdown**: Individual scores for DNS, Local Network, ISP Backbone, ISP Last-Mile, and Server
- **Problem fingerprinting**: Automatic detection of issues with severity, confidence, and evidence
- **Hop-speed correlation**: Pearson correlation analysis between traceroute hops and download speed (identifies bottlenecks)
- **Time-based pattern detection**: Detects peak-hour degradation and off-peak improvements
- **Connection impact analysis**: Compares performance across WiFi vs Ethernet connections
- **Actionable recommendations**: Prioritized suggestions based on detected issues

**Home Assistant Integration**
- New sensors for Smart Scheduler (phase, stability, interval, data usage)
- New sensors for Root-Cause (network health, primary issue, layer health scores)
- Button entity for manual speed test trigger

**CLI Commands**
- `gonzales smart-scheduler status/enable/disable/config/decisions` - Manage smart scheduling
- `gonzales root-cause analyze/fingerprints/recommendations/hops` - Network diagnostics

### Improvements

- **Settings page UX redesign**: Consolidated from 9 cards to 4 logical sections
- **SSE fallback for HA Ingress**: Polling-based fallback when SSE is buffered by proxy
- **Rate limiting**: Updated to 120 req/min with strict limits on resource-intensive endpoints
- **Mobile Navigation UX**: Complete overhaul with proper animations and accessibility
  - Smooth slide-up/slide-down animations for bottom sheet
  - Backdrop fade animations
  - Touch targets increased to 44x44px (Apple/Google guidelines)
  - Text size increased from 10px to 12px for readability
  - ARIA attributes for screen readers
  - Focus trapping and keyboard navigation (Escape to close)
  - Reduced motion support

### API Endpoints

New endpoints added:
- `GET /api/v1/smart-scheduler/status` - Current scheduler phase, stability score, data budget
- `GET /api/v1/smart-scheduler/config` - Configuration settings
- `PUT /api/v1/smart-scheduler/config` - Update configuration
- `POST /api/v1/smart-scheduler/enable` - Enable smart scheduling
- `POST /api/v1/smart-scheduler/disable` - Disable smart scheduling
- `GET /api/v1/smart-scheduler/decisions` - Decision history
- `GET /api/v1/root-cause/analysis` - Full root-cause analysis
- `GET /api/v1/root-cause/fingerprints` - Detected problem patterns
- `GET /api/v1/root-cause/recommendations` - Actionable recommendations
- `GET /api/v1/root-cause/hop-correlations` - Hop-speed correlations

---

## [3.6.1] - Previous

### Bug Fixes
- Fix byte formatting for large values (GB/TB display)

## [3.6.0] - Previous

### Features
- Scheduler control toggle in header and Settings
- API endpoint for scheduler control

## [3.5.0] - Previous

### Features
- MCP Server for Claude Desktop integration
- Summary API endpoint for AI agents
- AGENTS.md documentation

## [3.0.0] - Previous

### Major Release
- Clean Architecture implementation
- Rate limiting middleware
- WCAG 2.1 AA accessibility
- Toast notification system

## [2.0.0] - Previous

### Features
- ISP Contract Validation with PDF reports
- Network Topology Analysis
- QoS Tests for specific use cases

## [1.0.0] - Initial Release

- Automated speed testing with Ookla Speedtest CLI
- Web dashboard with real-time updates
- Home Assistant Add-on support
- SQLite database with WAL mode
