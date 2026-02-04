# Gonzales - Requirements Specification

## Vision

Gonzales must be the best internet speed monitoring tool on the market.
It must feel like a premium Apple product from 2026 -- elegant, futuristic,
and innovative. Every pixel, every animation, every interaction must be intentional.

---

## Core Principles

- **Clean Architecture** -- Perfect separation of concerns, no shortcuts
- **Futuristic Design** -- Apple 2026 Liquid Glass aesthetic in web AND terminal
- **Real-time Everything** -- Live test visualization in both web and TUI
- **Innovative Insights** -- Statistics that go beyond what any competitor offers
- **Token Efficiency** -- Implementation in isolated phases to avoid context overflow
- **No Emojis** -- Use Lucide icons exclusively for all iconography
- **Raspberry Pi Compatible** -- Must run on 64-bit ARM (Pi 4/5)

---

## R1: Web Interface Design

### R1.1 Liquid Glass Design System (Apple 2026 Style)
- Multi-layer glass with varying blur intensities and saturation levels
- Depth through stacked translucent layers, not flat cards
- Subtle gradient overlays that shift with theme
- Consistent border-radius scale, shadow system, and spacing rhythm
- Own tech styleguide document describing every token, component, and pattern

### R1.2 Animations and Micro-Interactions
- Page transition animations (slide/fade between routes)
- Number counting animations (values animate from 0 to target)
- Chart draw-in animations (lines/bars appear progressively)
- Hover effects on every interactive element:
  - Cards: shadow elevation + subtle scale (1.01x) + upward lift
  - Buttons: background shift + spring scale on press
  - Table rows: highlight with glass tint
  - Nav items: icon shift + label glow
- Skeleton loading states with shimmer animation
- Staggered list item animations
- Tooltip scale-in from origin point
- Spring physics easing for natural motion feel

### R1.3 Futuristic Live Speed Test View (Web)
- Full-screen overlay with dramatic entrance animation
- Large animated gauge needle with glow effects
- Real-time bandwidth number with counting animation
- Phase indicators (ping / download / upload) with smooth transitions
- Circular progress ring with gradient stroke
- Pulsing glow effects around active elements
- Speed particles or data stream visualization
- Color-coded phases (warm for ping, cool for download, vibrant for upload)
- Results summary with animated reveal at completion

### R1.4 Responsive Layout
- Desktop: Full sidebar with labels
- Tablet: Collapsed sidebar with icons only
- Mobile: Bottom navigation bar with safe-area support
- Smooth transitions between breakpoints
- Touch-friendly targets on mobile (min 44px)

---

## R2: Terminal Interface (TUI) Design

### R2.1 Demoscene Aesthetic
- Neon color palette (cyan, magenta, yellow, green on near-black)
- ASCII art banner with block characters
- Retro-futuristic styling (CRT-inspired, glowing text)
- Unicode box drawing for structured layouts

### R2.2 Real-Time Test View (TUI)
- Live gauge updates during speed test (not just "Running...")
- Progress bar with percentage and phase label
- Real-time bandwidth display with sparkline history
- Phase transitions with visual feedback
- ASCII speed needle or bar gauge with gradient blocks
- Must update faster than the 10-second refresh interval

### R2.3 TUI Screens
- Dashboard: Latest result, gauges, mini sparklines
- History: Scrollable table with pagination
- Settings: Interactive form for config changes
- Test View: Full real-time visualization (see R2.2)

---

## R3: Statistics and Innovative Insights

### R3.1 Core Statistics (implemented)
- Min, max, average, median, standard deviation
- Percentiles (P5, P25, P50, P75, P95)
- Hourly averages (24-hour heatmap)
- Day-of-week patterns (radar chart)
- Trend analysis with linear regression slopes
- SLA compliance percentages vs. configured thresholds
- Reliability score (coefficient of variation composite)
- Per-server comparison

### R3.2 Innovative Insights (needed)
- **Anomaly Detection** -- Flag measurements that deviate >2 standard deviations
  with visual highlighting in charts and history
- **Predictive Trends** -- Project future speed based on regression model,
  show "expected speed in 7 days" prediction
- **Peak/Off-Peak Analysis** -- Compare business hours vs. evening vs. night
  performance with clear visualization
- **ISP Performance Score** -- Composite 0-100 score combining speed,
  stability, jitter, packet loss, and consistency
- **Network Quality Timeline** -- Visual timeline showing quality periods
  (excellent/good/degraded/poor) over time
- **Correlation Matrix** -- Show relationships between download, upload,
  ping, jitter, and packet loss
- **Degradation Alerts** -- Detect sustained performance drops vs. one-off anomalies
- **Best/Worst Time Windows** -- Identify the best and worst hours/days for
  network performance
- **Speed Distribution Histogram** -- Show how often speeds fall into ranges
- **Jitter Impact Analysis** -- Correlate jitter with speed consistency

### R3.3 Statistics Visualization
- All charts must animate on first render
- Interactive tooltips with smooth transitions
- Color-coded quality indicators throughout
- Responsive chart sizing for all screen sizes

---

## R4: Configuration System

### R4.1 Persistent Configuration
- Config file (`config.json`) persisted to disk
- All mutable settings editable via web UI AND config file
- Changes via web UI immediately take effect (no restart)
- Environment variables override config file values

### R4.2 Configurable Settings
- **Test interval** -- Default 30 minutes, configurable in web and config
- **Download threshold** -- Expected download speed in Mbps
- **Upload threshold** -- Expected upload speed in Mbps
- **Preferred server** -- Default auto (0), selectable from discovered servers
- **Manual trigger cooldown** -- Minimum seconds between manual tests
- **Theme** -- auto / light / dark

### R4.3 Server Selection
- List all available Speedtest servers from Ookla
- Selectable in Settings page via dropdown
- Default: automatic (best server)
- Persist selection in config

---

## R5: Home Assistant Integration

### R5.1 Separate Repository
- Own repo: `gonzales-ha`
- Compatible with Home Assistant Feb 2026 release
- HACS-installable custom integration
- Local polling (no cloud dependency)

### R5.2 Sensors
- `sensor.gonzales_download_speed` -- Latest download (Mbps)
- `sensor.gonzales_upload_speed` -- Latest upload (Mbps)
- `sensor.gonzales_ping_latency` -- Latest ping (ms)
- `sensor.gonzales_ping_jitter` -- Latest jitter (ms)
- `sensor.gonzales_packet_loss` -- Latest packet loss (%)
- `sensor.gonzales_last_test_time` -- Timestamp of last test
- `sensor.gonzales_isp_score` -- Composite ISP performance score

### R5.3 Features
- Config flow for host/port setup
- Automatic device discovery (mDNS/SSDP optional)
- Polling interval configurable (default matches Gonzales interval)
- Diagnostic sensors for system status

---

## R6: Architecture Requirements

### R6.1 Backend (Python/FastAPI)
- Async-first with SQLAlchemy + aiosqlite
- Clean service layer separation
- Pydantic for all I/O validation
- No shell=True in subprocess calls
- Proper error handling with custom exceptions
- Structured logging

### R6.2 Frontend (React/TypeScript)
- Strict TypeScript (no `any`)
- TanStack Query for server state
- Custom hooks for all shared logic
- Component composition over inheritance
- CSS custom properties for theming (no runtime JS theme switching)
- Lucide React for all icons

### R6.3 Raspberry Pi Compatibility
- All Python deps must have ARM64 wheels or be pure Python
- SQLite (no PostgreSQL/Redis dependencies)
- Lightweight enough for Pi 4 (1-4 GB RAM)
- Systemd service file for auto-start

---

## R7: Documentation

### R7.1 User Documentation (README.md)
- English and German sections
- Quick start guide (4 commands)
- Raspberry Pi setup guide
- Configuration reference table
- API endpoint documentation
- Home Assistant integration guide
- Verification commands

### R7.2 Architecture Documentation (ARCHITECTURE.md)
- High-level architecture overview
- Component descriptions and responsibilities
- Key patterns and design decisions
- Command reference
- Database schema

### R7.3 Tech Styleguide (STYLEGUIDE.md)
- Design token reference (colors, spacing, typography, radii, shadows)
- Glass component catalog with usage examples
- Animation classes and timing reference
- Icon usage guidelines (Lucide only)
- Responsive breakpoint reference
- Dark/light theme implementation guide
- Do's and Don'ts for UI consistency

### R7.4 Development Documentation
- PLAN.md -- Phased development plan with checklists
- STATUS.md -- Current build status, known issues, progress
- REQUIREMENTS.md -- This file

---

## R8: Quality and Performance

### R8.1 Build
- Frontend must compile without errors (tsc + vite)
- Backend must pass ruff linting
- No unused imports, no dead code

### R8.2 Performance
- Frontend bundle should use code splitting for large dependencies
- Charts should lazy-load on page navigation
- SSE connections must auto-reconnect on failure
- Database queries must use indexes on timestamp columns

### R8.3 Testing
- Backend unit tests for services and API endpoints
- Frontend build verification
- API endpoint smoke tests documented in README

---

## Implementation Strategy

### Token Efficiency
Each phase must be implementable within a single context window.
Phases should be small, focused, and independently verifiable.
Documentation files (PLAN.md, STATUS.md) serve as persistent memory
between sessions.

### Phase Execution Order
1. Write requirements (this file)
2. Assess current state
3. Plan remaining phases
4. Execute phase by phase, updating STATUS.md after each
5. Verify build after each phase
6. Final integration test
