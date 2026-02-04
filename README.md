# Gonzales - Internet Speed Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.12+-41bdf5.svg)](https://www.home-assistant.io/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

```
 ██████╗  ██████╗ ███╗   ██╗███████╗ █████╗ ██╗     ███████╗███████╗
██╔════╝ ██╔═══██╗████╗  ██║╚══███╔╝██╔══██╗██║     ██╔════╝██╔════╝
██║  ███╗██║   ██║██╔██╗ ██║  ███╔╝ ███████║██║     █████╗  ███████╗
██║   ██║██║   ██║██║╚██╗██║ ███╔╝  ██╔══██║██║     ██╔══╝  ╚════██║
╚██████╔╝╚██████╔╝██║ ╚████║███████╗██║  ██║███████╗███████╗███████║
 ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
```

Local network speed monitoring tool with a **web dashboard** to monitor and document ISP bandwidth and stability issues. Runs automated speed tests, stores results in SQLite, and visualizes everything in the browser.

**v3.5.0 Highlights:** AI Agent Integration with MCP (Model Context Protocol) server for Claude Desktop, new Summary API for LLMs, and machine-readable AGENTS.md documentation.

---

## English

### Getting Started

You need three things installed on your system:

- **Python 3.10+** -- [python.org](https://www.python.org/downloads/)
- **Node.js 18+** -- [nodejs.org](https://nodejs.org/)
- **Ookla Speedtest CLI** -- [speedtest.net/apps/cli](https://www.speedtest.net/apps/cli)

On Debian/Ubuntu, install the Speedtest CLI like this:

```bash
sudo apt-get install curl
curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash
sudo apt-get install speedtest
```

Then run these four commands:

```bash
cd gonzales
make install
make build
make run
```

The web dashboard is now running at **http://localhost:8470** -- open it in your browser.

---

### Raspberry Pi (ARM64) Setup

Gonzales runs on Raspberry Pi 4/5 (64-bit OS required). All Python dependencies are pure Python or have ARM64 wheels.

```bash
# Install Speedtest CLI for ARM64
curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash
sudo apt-get install speedtest

# Install Node.js (ARM64)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and run
git clone <your-repo-url> gonzales
cd gonzales
make install
make build
make run
```

For running as a systemd service, create `/etc/systemd/system/gonzales.service`:

```ini
[Unit]
Description=Gonzales Speed Monitor
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/gonzales/backend
ExecStart=/usr/bin/python3 -m gonzales
Restart=always

[Install]
WantedBy=multi-user.target
```

---

### Advanced

#### Install without Make

If you don't have `make`, you can install everything manually:

```bash
# Backend
cd backend
pip install -e .

# Frontend
cd ../frontend
npm install
npm run build

# Copy built frontend into backend
cp -r dist ../backend/gonzales/static

# Start
cd ../backend
python3 -m gonzales
```

#### Terminal UI

Gonzales also has a demoscene-style terminal interface:

```bash
make tui
```

Keybindings: `D` Dashboard, `H` History, `S` Settings, `T` Test Now, `Q` Quit

#### Frontend Development

For hot-reloading during frontend work, run two terminals:

```bash
# Terminal 1: Backend
make run

# Terminal 2: Vite dev server
make frontend-dev
```

The Vite dev server runs at `http://localhost:5173` and proxies API calls to the backend.

#### Configuration

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GONZALES_HOST` | `127.0.0.1` | Bind address |
| `GONZALES_PORT` | `8470` | Server port |
| `GONZALES_TEST_INTERVAL_MINUTES` | `30` | Minutes between tests |
| `GONZALES_MANUAL_TRIGGER_COOLDOWN_SECONDS` | `60` | Cooldown between manual tests |
| `GONZALES_SPEEDTEST_BINARY` | `speedtest` | Path to speedtest CLI binary |
| `GONZALES_DOWNLOAD_THRESHOLD_MBPS` | `1000.0` | Expected download speed (your subscribed plan) |
| `GONZALES_UPLOAD_THRESHOLD_MBPS` | `500.0` | Expected upload speed (your subscribed plan) |
| `GONZALES_TOLERANCE_PERCENT` | `15.0` | Acceptable deviation from threshold (15% = 85% of subscribed speed is OK) |
| `GONZALES_DB_PATH` | `gonzales.db` | SQLite database file path |
| `GONZALES_CORS_ORIGINS` | `localhost:5173,8470` | Allowed CORS origins (JSON array) |
| `GONZALES_LOG_LEVEL` | `INFO` | Logging level |
| `GONZALES_DEBUG` | `false` | Enable API docs at /docs |
| `GONZALES_PREFERRED_SERVER_ID` | `0` | Preferred speedtest server (0 = auto) |
| `GONZALES_API_KEY` | *(empty)* | API key for mutating endpoints. **Required when host != 127.0.0.1** |
| `GONZALES_THEME` | `auto` | UI theme: auto, light, or dark |
| `GONZALES_CONFIG_PATH` | `config.json` | Path to runtime config file |
| `GONZALES_HA_ADDON` | `false` | Enable Home Assistant Add-on mode (Ingress headers, stdout-only logging) |

Settings can also be changed at runtime via the web UI (Settings page) or the API (`PUT /api/v1/config`). Runtime changes are persisted to `config.json`, which is auto-created and gitignored.

#### In-App Documentation

The web dashboard includes a built-in **Docs** page accessible from the sidebar. It covers all features, configuration options, QoS profiles, network topology analysis, troubleshooting tips, and Home Assistant integration examples.

#### Theme Support

Gonzales supports three theme modes:

- **Auto** -- follows your system/browser preference (light or dark)
- **Light** -- always light mode
- **Dark** -- always dark mode

Change the theme in Settings > Appearance, or set `GONZALES_THEME` in your `.env` file.

#### API Endpoints

All under `/api/v1`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/measurements` | Paginated list |
| GET | `/measurements/latest` | Most recent result |
| GET | `/measurements/{id}` | Single measurement |
| DELETE | `/measurements/{id}` | Delete measurement |
| DELETE | `/measurements/all` | Delete all measurements (requires `?confirm=true`) |
| GET | `/statistics` | Aggregates and percentiles |
| GET | `/statistics/enhanced` | Enhanced stats (hourly, daily, trend, SLA, reliability, per-server) |
| GET | `/summary` | AI-friendly status summary (supports `?format=markdown`) |
| GET | `/status` | Scheduler state, uptime |
| GET | `/export/csv` | Download CSV |
| GET | `/export/pdf` | Download PDF report |
| POST | `/speedtest/trigger` | Run test manually |
| GET | `/speedtest/stream` | SSE stream for real-time test progress |
| GET | `/config` | Current config |
| PUT | `/config` | Update config |
| GET | `/servers` | List available speedtest servers |

#### AI Agent Integration

Gonzales supports integration with AI assistants like Claude Desktop via the Model Context Protocol (MCP).

**MCP Server (for Claude Desktop)**

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

Available tools: `get_latest_speedtest`, `run_speedtest`, `get_statistics`, `get_connection_status`, `get_outages`, `get_isp_score`, `get_summary`

**Summary API (for LLMs)**

```bash
# JSON format
curl http://localhost:8470/api/v1/summary

# Markdown format (ideal for LLM context)
curl "http://localhost:8470/api/v1/summary?format=markdown"
```

See [AGENTS.md](AGENTS.md) for complete AI agent documentation.

#### Real-time Test Streaming

The `/api/v1/speedtest/stream` endpoint provides Server-Sent Events (SSE) during speed tests:

```
event: started
data: {"phase": "started"}

event: progress
data: {"phase": "download", "bandwidth_mbps": 450.5, "progress": 0.65}

event: complete
data: {"phase": "complete", "download_mbps": 500.2, "upload_mbps": 250.1, "ping_ms": 12.3}
```

#### Verification

```bash
# Manual speed test
curl -X POST http://localhost:8470/api/v1/speedtest/trigger

# Check latest result
curl http://localhost:8470/api/v1/measurements/latest

# Enhanced statistics
curl http://localhost:8470/api/v1/statistics/enhanced

# List available servers
curl http://localhost:8470/api/v1/servers

# Download CSV
curl http://localhost:8470/api/v1/export/csv > results.csv

# System status
curl http://localhost:8470/api/v1/status
```

#### Home Assistant

Gonzales integrates with Home Assistant in two ways. Both live in the [gonzales-ha](https://github.com/akustikrausch/gonzales-ha) repository.

**Option A: Home Assistant Add-on (recommended)**

One-click installation that runs Gonzales entirely inside Home Assistant as a Docker container. The web dashboard is accessible via the HA sidebar (Ingress). Database and config are persisted across updates.

1. In HA go to **Settings > Add-ons > Add-on Store** (three-dot menu) > **Repositories**
2. Add `https://github.com/akustikrausch/gonzales-ha`
3. Install **Gonzales Speed Monitor** and start it
4. The sensor integration is auto-discovered -- confirm setup when prompted

**Option B: Standalone + HACS Integration**

Run Gonzales on a separate machine (e.g. Raspberry Pi) and install the HACS integration to pull sensor data into HA.

1. Install via HACS (custom repository) or copy `custom_components/gonzales/` to your HA config directory
2. Add the integration and enter the host/port of your Gonzales instance

**Sensors** (both options):
- `sensor.gonzales_download_speed` -- latest download speed (Mbit/s)
- `sensor.gonzales_upload_speed` -- latest upload speed (Mbit/s)
- `sensor.gonzales_ping_latency` -- latest ping latency (ms)
- `sensor.gonzales_ping_jitter` -- latest ping jitter (ms)
- `sensor.gonzales_packet_loss` -- latest packet loss (%)
- `sensor.gonzales_last_test_time` -- timestamp of last test
- `sensor.gonzales_isp_score` -- ISP performance score (0-100)
- Diagnostic: scheduler status, test in progress, uptime, total measurements, DB size

---

## Deutsch

### Schnellstart

Du brauchst drei Dinge auf deinem System:

- **Python 3.10+** -- [python.org](https://www.python.org/downloads/)
- **Node.js 18+** -- [nodejs.org](https://nodejs.org/)
- **Ookla Speedtest CLI** -- [speedtest.net/apps/cli](https://www.speedtest.net/apps/cli)

Auf Debian/Ubuntu installierst du die Speedtest CLI so:

```bash
sudo apt-get install curl
curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash
sudo apt-get install speedtest
```

Dann diese vier Befehle ausfuehren:

```bash
cd gonzales
make install
make build
make run
```

Das Web-Dashboard laeuft jetzt unter **http://localhost:8470** -- einfach im Browser oeffnen.

---

### Erweitert

#### Installation ohne Make

Falls `make` nicht vorhanden ist:

```bash
# Backend installieren
cd backend
pip install -e .

# Frontend installieren und bauen
cd ../frontend
npm install
npm run build

# Gebautes Frontend ins Backend kopieren
cp -r dist ../backend/gonzales/static

# Server starten
cd ../backend
python3 -m gonzales
```

#### Terminal-Oberflaeche

Gonzales hat auch eine Demoscene-Terminal-Oberflaeche:

```bash
make tui
```

Tasten: `D` Dashboard, `H` Verlauf, `S` Einstellungen, `T` Test starten, `Q` Beenden

#### Frontend-Entwicklung

Fuer Hot-Reloading bei der Frontend-Entwicklung zwei Terminals starten:

```bash
# Terminal 1: Backend
make run

# Terminal 2: Vite Dev-Server
make frontend-dev
```

Der Vite Dev-Server laeuft unter `http://localhost:5173` und leitet API-Anfragen an das Backend weiter.

#### Konfiguration

`.env.example` nach `.env` kopieren und Werte anpassen:

```bash
cp .env.example .env
```

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `GONZALES_HOST` | `127.0.0.1` | Bind-Adresse |
| `GONZALES_PORT` | `8470` | Server-Port |
| `GONZALES_TEST_INTERVAL_MINUTES` | `30` | Minuten zwischen Tests |
| `GONZALES_MANUAL_TRIGGER_COOLDOWN_SECONDS` | `60` | Abklingzeit zwischen manuellen Tests |
| `GONZALES_SPEEDTEST_BINARY` | `speedtest` | Pfad zur Speedtest-CLI |
| `GONZALES_DOWNLOAD_THRESHOLD_MBPS` | `1000.0` | Erwartete Download-Geschwindigkeit (dein Tarif) |
| `GONZALES_UPLOAD_THRESHOLD_MBPS` | `500.0` | Erwartete Upload-Geschwindigkeit (dein Tarif) |
| `GONZALES_TOLERANCE_PERCENT` | `15.0` | Akzeptable Abweichung vom Schwellwert (15% = 85% der Vertragsgeschwindigkeit OK) |
| `GONZALES_DB_PATH` | `gonzales.db` | SQLite-Datenbankdatei |
| `GONZALES_CORS_ORIGINS` | `localhost:5173,8470` | Erlaubte CORS-Origins (JSON-Array) |
| `GONZALES_LOG_LEVEL` | `INFO` | Log-Level |
| `GONZALES_DEBUG` | `false` | API-Docs unter /docs aktivieren |
| `GONZALES_PREFERRED_SERVER_ID` | `0` | Bevorzugter Speedtest-Server (0 = automatisch) |
| `GONZALES_API_KEY` | *(leer)* | API-Key fuer schreibende Endpoints. **Pflicht wenn Host != 127.0.0.1** |
| `GONZALES_THEME` | `auto` | UI-Thema: auto, light oder dark |
| `GONZALES_CONFIG_PATH` | `config.json` | Pfad zur Laufzeit-Konfigurationsdatei |
| `GONZALES_HA_ADDON` | `false` | Home Assistant Add-on Modus (Ingress-Header, nur stdout-Logging) |

Einstellungen koennen auch zur Laufzeit ueber die Web-Oberflaeche (Einstellungen) oder die API (`PUT /api/v1/config`) geaendert werden. Laufzeitaenderungen werden in `config.json` gespeichert (wird automatisch erstellt, nicht in Git).

#### Home Assistant

Gonzales laesst sich auf zwei Arten mit Home Assistant verbinden. Beides lebt im [gonzales-ha](https://github.com/akustikrausch/gonzales-ha) Repository.

**Option A: Home Assistant Add-on (empfohlen)**

Ein-Klick-Installation, die Gonzales komplett in Home Assistant als Docker-Container ausfuehrt. Das Web-Dashboard ist ueber die HA-Sidebar (Ingress) erreichbar. Datenbank und Config bleiben bei Updates erhalten.

1. In HA zu **Einstellungen > Add-ons > Add-on Store** (Drei-Punkte-Menue) > **Repositories**
2. `https://github.com/akustikrausch/gonzales-ha` hinzufuegen
3. **Gonzales Speed Monitor** installieren und starten
4. Die Sensor-Integration wird automatisch erkannt -- Einrichtung bestaetigen

**Option B: Standalone + HACS Integration**

Gonzales auf einem separaten Geraet laufen lassen (z.B. Raspberry Pi) und die HACS-Integration installieren, um Sensordaten in HA zu holen.

1. Installation ueber HACS (Custom Repository) oder manuell `custom_components/gonzales/` ins HA Config-Verzeichnis kopieren
2. Integration hinzufuegen und Host/Port der Gonzales-Instanz eingeben

Sensoren (beide Optionen): Download-Geschwindigkeit, Upload-Geschwindigkeit, Ping-Latenz, Ping-Jitter, Paketverlust, Letzter Test, ISP-Score. Zusaetzlich Diagnose-Sensoren fuer Scheduler-Status, laufende Tests, Uptime, Gesamtmessungen und Datenbankgroesse.

#### Ueberpruefen

```bash
# Manuellen Speedtest starten
curl -X POST http://localhost:8470/api/v1/speedtest/trigger

# Letztes Ergebnis abrufen
curl http://localhost:8470/api/v1/measurements/latest

# Erweiterte Statistiken
curl http://localhost:8470/api/v1/statistics/enhanced

# Verfuegbare Server auflisten
curl http://localhost:8470/api/v1/servers

# CSV herunterladen
curl http://localhost:8470/api/v1/export/csv > ergebnisse.csv

# Systemstatus
curl http://localhost:8470/api/v1/status
```

---

## Runtime Files (not in Git)

The following files are created automatically at runtime and are excluded from version control via `.gitignore`:

| File / Directory | Created by | Purpose |
|-----------------|------------|---------|
| `config.json` | Settings API | Persisted runtime config (test interval, thresholds, theme) |
| `gonzales.db` | Backend startup | SQLite database with all measurements |
| `gonzales.db-wal` | SQLite WAL mode | Write-ahead log for concurrent access |
| `backend/logs/gonzales.log` | Logging setup | Application log file |
| `.env` | User (from `.env.example`) | Environment variable overrides |

After a fresh clone, simply run `make install && make build && make run`. All runtime files are created automatically on first startup. To customize settings before first run, copy the template files:

```bash
cp .env.example .env          # Environment variables
cp config.json.example config.json  # Runtime settings (optional)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy 2 (async), APScheduler |
| Architecture | Clean Architecture, Domain-Driven Design |
| Speed Engine | Ookla Speedtest CLI |
| Database | SQLite (WAL mode) |
| Frontend | React 19, TypeScript, Vite 6, Recharts, Tailwind CSS 4, TanStack Query 5 |
| Design System | Liquid Glass (CSS custom properties, backdrop-filter) |
| Accessibility | WCAG 2.1 AA compliant |
| Terminal UI | Textual + Rich |
| CLI | Typer + Rich |
| AI Integration | MCP Server (Model Context Protocol) |
| Export | CSV, PDF (ReportLab) |
| Home Assistant | [gonzales-ha](https://github.com/akustikrausch/gonzales-ha) (Add-on + HACS Integration) |

## Security

### API Key Protection

By default, the API is open (no authentication required). This is safe when binding to `127.0.0.1` (localhost only).

**If you expose Gonzales on the network** (e.g., by setting `GONZALES_HOST=0.0.0.0` for Home Assistant or remote access), **you must set an API key**:

```bash
export GONZALES_API_KEY="your-secret-key-here"
```

Without an API key, anyone on your network can trigger speed tests, change configuration, and delete measurements. Gonzales will print a warning at startup if it detects network binding without an API key.

When set, all mutating endpoints (config update, speedtest trigger, measurement delete) require the `X-API-Key` header:

```bash
curl -X POST http://localhost:8470/api/v1/speedtest/trigger -H "X-API-Key: your-secret-key-here"
```

Read-only endpoints (measurements, statistics, status, export) remain open.

### Rate Limiting

Gonzales includes built-in rate limiting to prevent abuse:
- **Default:** 100 requests per minute per IP address
- **Algorithm:** Token bucket with configurable burst capacity
- **Response:** HTTP 429 (Too Many Requests) when limit exceeded

Rate limiting is automatically enabled for all API endpoints.

For production deployments, consider placing Gonzales behind a reverse proxy (nginx, Caddy) for TLS and additional access control.

---

## License

MIT -- see [LICENSE](LICENSE) for details.

**Important:** Gonzales requires the [Ookla Speedtest CLI](https://www.speedtest.net/apps/cli) as a runtime dependency. The Ookla Speedtest CLI is **proprietary software** licensed under a separate [EULA](https://www.speedtest.net/about/eula):

- **Personal, non-commercial use**: Permitted (free of charge)
- **Commercial use**: Requires a separate license from Ookla
- **Redistribution**: Not permitted -- users must install it independently

Gonzales itself (this repository) is MIT-licensed. All other dependencies are permissively licensed (MIT/BSD/Apache-2.0).
