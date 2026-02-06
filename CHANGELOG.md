# Changelog

All notable changes to Gonzales will be documented in this file.

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
