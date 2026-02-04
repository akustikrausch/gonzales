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
| Export data | `GET /api/v1/export?format=csv` |

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

## REST API

Base URL: `http://localhost:8765/api/v1`

### Most Important Endpoints

#### 1. Summary (Best for AI)

```http
GET /api/v1/summary
GET /api/v1/summary?format=markdown
```

Returns a human-readable summary with status, alerts, and recommendations. **Use this endpoint first** when you need to understand the current state.

Response example:
```json
{
  "status": "healthy",
  "summary": "Internet connection is performing well. Current speed: 95.2 Mbps down, 42.1 Mbps up, 12ms ping.",
  "latest_test": {
    "timestamp": "2024-02-04T10:30:00Z",
    "download_mbps": 95.2,
    "upload_mbps": 42.1,
    "ping_ms": 12,
    "meets_threshold": true
  },
  "statistics_7d": {
    "avg_download": 92.5,
    "reliability_percent": 98.5,
    "outage_count": 0
  },
  "alerts": [],
  "recommendations": ["Your connection is stable. No action needed."]
}
```

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

Returns comprehensive analytics including:
- ISP score (A+ to F grade)
- Hourly and daily patterns
- Trend analysis
- Predictions
- Anomaly detection

#### 5. Outages

```http
GET /api/v1/outages
GET /api/v1/outages?start_date=2024-01-01&end_date=2024-01-31
```

Returns detected network outages with duration and impact.

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

### "Is my internet fast enough for X?"

Use the QoS endpoint to check specific use cases:

```http
GET /api/v1/qos/current
```

Returns pass/fail for:
- Netflix 4K streaming
- Zoom HD video calls
- Online gaming
- Remote work

### "When is my internet fastest?"

Check the enhanced statistics:

```http
GET /api/v1/statistics/enhanced
```

Look at:
- `best_worst_times.best_download` - Hour with highest speeds
- `peak_offpeak` - Peak vs off-peak comparison
- `hourly` - Full hourly breakdown

### "Has my internet been reliable?"

Check reliability metrics:

```http
GET /api/v1/statistics/enhanced
```

Look at:
- `reliability.composite_score` - 0-100 reliability score
- `sla.download_compliance_pct` - % of tests meeting threshold
- `isp_score.grade` - Overall ISP grade

## Error Handling

| HTTP Code | Meaning | What to do |
|-----------|---------|------------|
| 200 | Success | Parse response |
| 401 | Unauthorized | Add API key header |
| 404 | Not found | Check endpoint path |
| 429 | Rate limited | Wait 60 seconds |
| 500 | Server error | Check if Gonzales is running |
| 503 | Test in progress | Wait for current test to complete |

## Rate Limits

- Read endpoints: 60 requests/minute
- Write endpoints (trigger test): 1 request/minute
- Export: 10 requests/minute

## Data Retention

By default, Gonzales keeps 90 days of speed test history. This is configurable via the `data_retention_days` setting.

## Authentication

If API key authentication is enabled:
- Add header: `X-API-Key: your-api-key`
- Required for: POST/PUT/DELETE operations
- Not required for: GET operations (read-only)

## Integration Examples

### Python

```python
import requests

# Get summary
response = requests.get("http://localhost:8765/api/v1/summary")
data = response.json()
print(f"Status: {data['status']}")
print(f"Summary: {data['summary']}")

# Run speed test
response = requests.post("http://localhost:8765/api/v1/speedtest/trigger")
result = response.json()
print(f"Download: {result['download_mbps']} Mbps")
```

### curl

```bash
# Get summary as markdown
curl -s "http://localhost:8765/api/v1/summary?format=markdown"

# Run speed test
curl -X POST "http://localhost:8765/api/v1/speedtest/trigger"
```

## Support

- GitHub: https://github.com/yourusername/gonzales
- Issues: https://github.com/yourusername/gonzales/issues
