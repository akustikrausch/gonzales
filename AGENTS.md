# Gonzales - AI Agent Integration Guide

Gonzales is a self-hosted internet speed monitoring tool. This document provides instructions for AI agents and LLMs to interact with and understand Gonzales.

## Quick Reference

| What you want | How to do it |
|---------------|--------------|
| Check internet status | `GET /api/v1/summary` |
| Run a speed test | `POST /api/v1/speedtest/trigger` |
| Get latest result | `GET /api/v1/measurements/latest` |
| Get statistics | `GET /api/v1/statistics/enhanced` |
| Check for outages | `GET /api/v1/outages` |
| Network health analysis | `GET /api/v1/root-cause/analysis` |
| Smart scheduler status | `GET /api/v1/smart-scheduler/status` |
| Export data | `GET /api/v1/export/csv` |

## MCP Integration (Recommended)

If your AI tool supports MCP (Model Context Protocol), this is the best integration method.

### Claude Desktop Setup

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gonzales": {
      "command": "gonzales-mcp"
    }
  }
}
```

### Available MCP Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_latest_speedtest` | Get most recent test result | "What's my current internet speed?" |
| `run_speedtest` | Trigger a new speed test | "Run a speed test" |
| `get_statistics` | Get statistics summary | "How was my internet this week?" |
| `get_connection_status` | Check if connection meets thresholds | "Is my internet good enough?" |
| `get_outages` | List detected outages | "Were there any outages?" |
| `get_isp_score` | Get ISP quality grade | "Rate my ISP" |
| `get_summary` | Get AI-friendly status summary | "Give me an overview" |

## REST API

Base URL: `http://localhost:8470/api/v1`

### Core Endpoints

#### 1. Summary (Best for AI)

```http
GET /api/v1/summary
GET /api/v1/summary?format=markdown
```

Returns a human-readable summary with status, alerts, and recommendations. **Use this endpoint first** when you need to understand the current state.

#### 2. Latest Measurement

```http
GET /api/v1/measurements/latest
```

Returns the most recent speed test result.

#### 3. Trigger Speed Test

```http
POST /api/v1/speedtest/trigger
```

Runs a new speed test. Takes 30-60 seconds. Returns the result when complete.

Note: Requires API key header `X-API-Key` if authentication is enabled.

#### 4. Enhanced Statistics

```http
GET /api/v1/statistics/enhanced
GET /api/v1/statistics/enhanced?start_date=2024-01-01&end_date=2024-01-31
```

Returns comprehensive analytics including ISP score, hourly/daily patterns, trend analysis, predictions, and anomaly detection.

#### 5. Outages

```http
GET /api/v1/outages
GET /api/v1/outages?start_date=2024-01-01&end_date=2024-01-31
```

Returns detected network outages with duration and impact.

### Smart Scheduler Endpoints (v3.7.0+)

The Smart Scheduler automatically adjusts test frequency based on network stability.

```http
GET /api/v1/smart-scheduler/status
```

Returns:
- `phase`: Current phase (normal, burst, recovery)
- `stability_score`: Network stability 0-100%
- `current_interval_minutes`: Active test interval
- `daily_data_used_mb`: Data consumed today
- `daily_data_budget_mb`: Daily budget limit

```http
POST /api/v1/smart-scheduler/enable
POST /api/v1/smart-scheduler/disable
GET /api/v1/smart-scheduler/config
PUT /api/v1/smart-scheduler/config
```

### Root-Cause Analysis Endpoints (v3.7.0+)

Comprehensive network diagnostics to identify performance issues.

```http
GET /api/v1/root-cause/analysis?days=30
```

Returns:
- `network_health_score`: Overall health 0-100
- `layer_scores`: Health per network layer (DNS, local, ISP backbone, ISP last-mile, server)
- `primary_cause`: Main detected issue (if any)
- `secondary_causes`: Additional issues
- `hop_correlations`: Traceroute hop impact on speed
- `recommendations`: Prioritized action items

The root-cause analysis endpoint returns fingerprints, recommendations, hop correlations, and layer scores in a single comprehensive response.

## CLI Commands

If CLI access is available:

```bash
# Quick status check
gonzales status

# Run a speed test
gonzales run

# Get statistics
gonzales stats --days 7

# View history
gonzales history --limit 10

# Smart Scheduler commands
gonzales smart-scheduler status
gonzales smart-scheduler enable
gonzales smart-scheduler disable

# Root-Cause Analysis
gonzales root-cause analyze
gonzales root-cause fingerprints
gonzales root-cause recommendations

# Export data
gonzales export --format csv --output speedtests.csv

# All commands support --json for structured output
gonzales status --json
```

## Interpreting Results

### Speed Values

| Quality | Download | Upload | Ping |
|---------|----------|--------|------|
| Excellent | > 100 Mbps | > 20 Mbps | < 20ms |
| Good | > 50 Mbps | > 10 Mbps | < 30ms |
| Acceptable | > 25 Mbps | > 5 Mbps | < 50ms |
| Poor | < 25 Mbps | < 5 Mbps | > 50ms |

### ISP Score Grades

| Grade | Meaning | Percentile |
|-------|---------|------------|
| A+ | Exceptional | Top 5% |
| A | Excellent | Top 15% |
| B | Good | Top 35% |
| C | Average | Top 65% |
| D | Below Average | Top 85% |
| F | Poor | Bottom 15% |

### Network Health Score (Root-Cause)

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent - No issues detected |
| 75-89 | Good - Minor issues |
| 50-74 | Fair - Some issues affecting performance |
| 25-49 | Poor - Significant issues |
| 0-24 | Critical - Major problems |

### Smart Scheduler Phases

| Phase | Meaning | Interval |
|-------|---------|----------|
| `normal` | Stable network, fixed interval | User-configured (e.g., 60 min) |
| `burst` | Anomaly detected, intensive monitoring | 10 min (configurable) |
| `recovery` | Returning to normal after burst | 15 → 30 → 45 → normal |

### Connection Status

| Status | Meaning |
|--------|---------|
| `healthy` | All metrics within thresholds, reliable |
| `degraded` | Speeds OK but reliability < 90% |
| `poor` | Speeds below configured thresholds |
| `outage` | Connection is down, tests failing |
| `unknown` | No test data available |

## Common User Questions

### "How is my internet?"

1. Call `GET /api/v1/summary`
2. Read the `summary` field for a natural language description
3. Check `status` for overall health
4. Review `alerts` for any issues

### "What's causing my slow internet?"

1. Call `GET /api/v1/root-cause/analysis`
2. Check `primary_cause` for the main issue
3. Review `layer_scores` to see which network segment is problematic
4. Follow `recommendations` for fixes

### "Is my internet fast enough for X?"

Use the QoS endpoint:

```http
GET /api/v1/qos/current
```

Returns pass/fail for Netflix 4K, Zoom HD, online gaming, and remote work.

### "When is my internet fastest?"

Check enhanced statistics:

```http
GET /api/v1/statistics/enhanced
```

Look at `best_worst_times.best_download` and `hourly` breakdown.

### "Has my internet been reliable?"

Check reliability metrics:

```http
GET /api/v1/statistics/enhanced
```

Look at `reliability.composite_score` (0-100), `sla.download_compliance_pct`, and `isp_score.grade`.

## Error Handling

| HTTP Code | Meaning | What to do |
|-----------|---------|------------|
| 200 | Success | Parse response |
| 401 | Unauthorized | Add API key header |
| 404 | Not found | Check endpoint path |
| 429 | Rate limited | Wait and retry |
| 500 | Server error | Check if Gonzales is running |
| 503 | Test in progress | Wait for current test to complete |

## Rate Limits

- Standard endpoints: 120 requests/minute
- Resource-intensive endpoints: 6 requests/minute
  - `/speedtest/trigger`
  - `/root-cause/analysis`
  - `/export/csv`, `/export/pdf`
  - `/topology/analyze`

## Authentication

If API key authentication is enabled:
- Add header: `X-API-Key: your-api-key`
- Required for: POST/PUT/DELETE operations
- Not required for: GET operations (read-only)

## Integration Examples

### Python

```python
import requests

BASE_URL = "http://localhost:8470/api/v1"

# Get summary
response = requests.get(f"{BASE_URL}/summary")
data = response.json()
print(f"Status: {data['status']}")
print(f"Summary: {data['summary']}")

# Get network health
response = requests.get(f"{BASE_URL}/root-cause/analysis?days=7")
analysis = response.json()
print(f"Network Health: {analysis['network_health_score']}/100")
if analysis.get('primary_cause'):
    print(f"Issue: {analysis['primary_cause']['description']}")

# Run speed test
response = requests.post(f"{BASE_URL}/speedtest/trigger")
result = response.json()
print(f"Download: {result['download_mbps']} Mbps")
```

### curl

```bash
# Get summary as markdown
curl -s "http://localhost:8470/api/v1/summary?format=markdown"

# Get network health analysis
curl -s "http://localhost:8470/api/v1/root-cause/analysis?days=7"

# Run speed test
curl -X POST "http://localhost:8470/api/v1/speedtest/trigger"

# Get smart scheduler status
curl -s "http://localhost:8470/api/v1/smart-scheduler/status"
```

## Support

- GitHub: https://github.com/akustikrausch/gonzales
- Issues: https://github.com/akustikrausch/gonzales/issues
