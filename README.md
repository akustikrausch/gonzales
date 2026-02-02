# Gonzales - Internet Speed Monitor

### by Warp9

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

- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Ookla Speedtest CLI** — [speedtest.net/apps/cli](https://www.speedtest.net/apps/cli)

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
| `GONZALES_TEST_INTERVAL_MINUTES` | `5` | Minutes between tests |
| `GONZALES_DOWNLOAD_THRESHOLD_MBPS` | `1000.0` | Expected download speed |
| `GONZALES_UPLOAD_THRESHOLD_MBPS` | `500.0` | Expected upload speed |
| `GONZALES_LOG_LEVEL` | `INFO` | Logging level |
| `GONZALES_DEBUG` | `false` | Enable API docs at /docs |

#### API Endpoints

All under `/api/v1`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/measurements` | Paginated list |
| GET | `/measurements/latest` | Most recent result |
| GET | `/measurements/{id}` | Single measurement |
| DELETE | `/measurements/{id}` | Delete measurement |
| GET | `/statistics` | Aggregates and percentiles |
| GET | `/status` | Scheduler state, uptime |
| GET | `/export/csv` | Download CSV |
| GET | `/export/pdf` | Download PDF report |
| POST | `/speedtest/trigger` | Run test manually |
| GET | `/config` | Current config |
| PUT | `/config` | Update config |

#### Verification

```bash
# Manual speed test
curl -X POST http://localhost:8470/api/v1/speedtest/trigger

# Check latest result
curl http://localhost:8470/api/v1/measurements/latest

# Download CSV
curl http://localhost:8470/api/v1/export/csv > results.csv

# System status
curl http://localhost:8470/api/v1/status
```

---

## Deutsch

### Schnellstart

Du brauchst drei Dinge auf deinem System:

- **Python 3.10+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Ookla Speedtest CLI** — [speedtest.net/apps/cli](https://www.speedtest.net/apps/cli)

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
| `GONZALES_TEST_INTERVAL_MINUTES` | `5` | Minuten zwischen Tests |
| `GONZALES_DOWNLOAD_THRESHOLD_MBPS` | `1000.0` | Erwartete Download-Geschwindigkeit |
| `GONZALES_UPLOAD_THRESHOLD_MBPS` | `500.0` | Erwartete Upload-Geschwindigkeit |
| `GONZALES_LOG_LEVEL` | `INFO` | Log-Level |
| `GONZALES_DEBUG` | `false` | API-Docs unter /docs aktivieren |

#### Ueberpruefen

```bash
# Manuellen Speedtest starten
curl -X POST http://localhost:8470/api/v1/speedtest/trigger

# Letztes Ergebnis abrufen
curl http://localhost:8470/api/v1/measurements/latest

# CSV herunterladen
curl http://localhost:8470/api/v1/export/csv > ergebnisse.csv

# Systemstatus
curl http://localhost:8470/api/v1/status
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy 2 (async), APScheduler |
| Speed Engine | Ookla Speedtest CLI |
| Database | SQLite (WAL mode) |
| Frontend | React 19, TypeScript, Vite 6, Recharts, Tailwind CSS 4, TanStack Query 5 |
| Terminal UI | Textual + Rich |
| Export | CSV, PDF (ReportLab) |

## License

MIT
