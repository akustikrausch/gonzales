# Gonzales - Internet Speed Monitor

```
 ██████╗  ██████╗ ███╗   ██╗███████╗ █████╗ ██╗     ███████╗███████╗
██╔════╝ ██╔═══██╗████╗  ██║╚══███╔╝██╔══██╗██║     ██╔════╝██╔════╝
██║  ███╗██║   ██║██╔██╗ ██║  ███╔╝ ███████║██║     █████╗  ███████╗
██║   ██║██║   ██║██║╚██╗██║ ███╔╝  ██╔══██║██║     ██╔══╝  ╚════██║
╚██████╔╝╚██████╔╝██║ ╚████║███████╗██║  ██║███████╗███████╗███████║
 ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
```

Local network speed monitoring tool to prove ISP bandwidth and stability issues.

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

Open **http://localhost:8470** in your browser. Done.

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
| `GONZALES_DOWNLOAD_THRESHOLD_MBPS` | `1000.0` | Expected download speed |
| `GONZALES_UPLOAD_THRESHOLD_MBPS` | `500.0` | Expected upload speed |
| `GONZALES_DB_PATH` | `gonzales.db` | SQLite database file path |
| `GONZALES_CORS_ORIGINS` | `localhost:5173,8470` | Allowed CORS origins (JSON array) |
| `GONZALES_LOG_LEVEL` | `INFO` | Logging level |
| `GONZALES_DEBUG` | `false` | Enable API docs at /docs |
| `GONZALES_PREFERRED_SERVER_ID` | `0` | Preferred speedtest server (0 = auto) |
| `GONZALES_THEME` | `auto` | UI theme: auto, light, or dark |

Settings can also be changed at runtime via the web UI (Settings page) or the API (`PUT /api/v1/config`). Runtime changes are persisted to `config.json`, which is auto-created and gitignored.

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
| GET | `/statistics` | Aggregates and percentiles |
| GET | `/statistics/enhanced` | Enhanced stats (hourly, daily, trend, SLA, reliability, per-server) |
| GET | `/status` | Scheduler state, uptime |
| GET | `/export/csv` | Download CSV |
| GET | `/export/pdf` | Download PDF report |
| POST | `/speedtest/trigger` | Run test manually |
| GET | `/speedtest/stream` | SSE stream for real-time test progress |
| GET | `/config` | Current config |
| PUT | `/config` | Update config |
| GET | `/servers` | List available speedtest servers |

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

#### Home Assistant Integration

A Home Assistant integration for Gonzales will be available as a separate repository (`gonzales-ha`). The integration uses local polling to read data from the Gonzales API.

Sensor mapping:
- `sensor.gonzales_download_speed` -- latest download speed (Mbps)
- `sensor.gonzales_upload_speed` -- latest upload speed (Mbps)
- `sensor.gonzales_ping_latency` -- latest ping latency (ms)
- `sensor.gonzales_ping_jitter` -- latest ping jitter (ms)
- `sensor.gonzales_packet_loss` -- latest packet loss (%)
- `sensor.gonzales_last_test_time` -- timestamp of last test

The Gonzales API requires no authentication and returns clean JSON responses. Ensure CORS allows your HA instance to connect by adding its URL to `GONZALES_CORS_ORIGINS` if needed.

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

Oeffne **http://localhost:8470** im Browser. Fertig.

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
| `GONZALES_DOWNLOAD_THRESHOLD_MBPS` | `1000.0` | Erwartete Download-Geschwindigkeit |
| `GONZALES_UPLOAD_THRESHOLD_MBPS` | `500.0` | Erwartete Upload-Geschwindigkeit |
| `GONZALES_DB_PATH` | `gonzales.db` | SQLite-Datenbankdatei |
| `GONZALES_CORS_ORIGINS` | `localhost:5173,8470` | Erlaubte CORS-Origins (JSON-Array) |
| `GONZALES_LOG_LEVEL` | `INFO` | Log-Level |
| `GONZALES_DEBUG` | `false` | API-Docs unter /docs aktivieren |
| `GONZALES_PREFERRED_SERVER_ID` | `0` | Bevorzugter Speedtest-Server (0 = automatisch) |
| `GONZALES_THEME` | `auto` | UI-Thema: auto, light oder dark |

Einstellungen koennen auch zur Laufzeit ueber die Web-Oberflaeche (Einstellungen) oder die API (`PUT /api/v1/config`) geaendert werden. Laufzeitaenderungen werden in `config.json` gespeichert (wird automatisch erstellt, nicht in Git).

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
| Speed Engine | Ookla Speedtest CLI |
| Database | SQLite (WAL mode) |
| Frontend | React 19, TypeScript, Vite 6, Recharts, Tailwind CSS 4, TanStack Query 5 |
| Design System | Liquid Glass (CSS custom properties, backdrop-filter) |
| Terminal UI | Textual + Rich |
| Export | CSV, PDF (ReportLab) |

## License

MIT
