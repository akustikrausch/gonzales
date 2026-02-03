# Claude Code Guidelines for Gonzales

## Version Management

**CRITICAL:** When bumping versions, ALL files must be updated simultaneously:

### gonzales repo:
- `backend/pyproject.toml` → `version = "X.Y.Z"`
- `backend/gonzales/__init__.py` → `__version__ = "X.Y.Z"`
- `backend/gonzales/version.py` → `__version__ = "X.Y.Z"`
- `frontend/package.json` → `"version": "X.Y.Z"`
- `frontend/src/hooks/useVersionCheck.ts` → `FRONTEND_VERSION = "X.Y.Z"`

### gonzales-ha repo:
- `gonzales-addon/config.yaml` → `version: "X.Y.Z"`
- `custom_components/gonzales/manifest.json` → `"version": "X.Y.Z"`
- `gonzales-addon/CHANGELOG.md` → Add new entry

### After version bump:
1. Rebuild frontend: `cd frontend && npm run build`
2. Copy to static: `rm -rf backend/gonzales/static/* && cp -r frontend/dist/* backend/gonzales/static/`
3. Commit and push both repos
4. Create GitHub releases for both repos

## Commit Guidelines

- Do NOT mention "Claude" or "Co-Authored-By: Claude" in commits
- Keep commit messages concise and descriptive
- Use conventional commit format when appropriate

## Build & Deploy

Frontend build:
```bash
cd frontend && npm run build
```

Copy static files:
```bash
rm -rf backend/gonzales/static/* && cp -r frontend/dist/* backend/gonzales/static/
```

Local development:
```bash
cd backend && python -m gonzales
```

## Architecture

- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React + TypeScript + Vite + TailwindCSS
- Home Assistant: Add-on with Ingress support
