# Claude Code Guidelines for Gonzales

## Version Management

### MUST-HAVE RULES (Non-Negotiable)

1. **ALL version files MUST be in sync** - Never release with mismatched versions
2. **CHANGELOG MUST be updated** before any release
3. **GitHub releases MUST be created** for BOTH repos after every version bump - use `gh release create`
4. **Frontend version constant MUST match** backend version (prevents infinite reload loop)
5. **Verify versions BEFORE pushing** - Always run the verification command below
6. **ALWAYS create GitHub releases immediately after pushing** - Never leave releases out of sync with code

### Version Verification Command

Before any release, run this to verify all versions match:

```bash
# Check all versions are in sync
echo "=== GONZALES REPO ===" && \
grep -h "version" backend/pyproject.toml | head -1 && \
grep "__version__" backend/gonzales/__init__.py && \
grep "FRONTEND_VERSION" frontend/src/hooks/useVersionCheck.ts && \
grep '"version"' frontend/package.json | head -1 && \
echo "=== GONZALES-HA REPO ===" && \
grep "^version:" ../gonzales-ha/gonzales-addon/config.yaml && \
grep '"version"' ../gonzales-ha/custom_components/gonzales/manifest.json
```

All outputs MUST show the same version number!

### Files to Update (gonzales repo)

| File | Field | Example |
|------|-------|---------|
| `backend/pyproject.toml` | `version = "X.Y.Z"` | `version = "2.1.2"` |
| `backend/gonzales/__init__.py` | `__version__ = "X.Y.Z"` | `__version__ = "2.1.2"` |
| `backend/gonzales/version.py` | `__version__ = "X.Y.Z"` | `__version__ = "2.1.2"` |
| `frontend/package.json` | `"version": "X.Y.Z"` | `"version": "2.1.2"` |
| `frontend/src/hooks/useVersionCheck.ts` | `FRONTEND_VERSION = "X.Y.Z"` | `const FRONTEND_VERSION = "2.1.2"` |

**Note:** The TUI (`gonzales-tui`) automatically displays the version from `backend/gonzales/version.py` - no manual update needed for TUI.

### Files to Update (gonzales-ha repo)

| File | Field | Example |
|------|-------|---------|
| `gonzales-addon/config.yaml` | `version: "X.Y.Z"` | `version: "2.1.2"` |
| `custom_components/gonzales/manifest.json` | `"version": "X.Y.Z"` | `"version": "2.1.2"` |
| `gonzales-addon/CHANGELOG.md` | New entry at top | `## 2.1.2` |

### Release Checklist

1. [ ] Update ALL version files in both repos
2. [ ] Update CHANGELOG.md with changes
3. [ ] Run version verification command
4. [ ] Rebuild frontend: `cd frontend && npm run build`
5. [ ] Copy to static: `rm -rf backend/gonzales/static/* && cp -r frontend/dist/* backend/gonzales/static/`
6. [ ] Commit and push gonzales repo
7. [ ] Commit and push gonzales-ha repo
8. [ ] **Create GitHub release for gonzales repo** (MANDATORY):
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z: Title" --notes "Release notes here"
   ```
9. [ ] **Create GitHub release for gonzales-ha repo** (MANDATORY):
   ```bash
   cd ../gonzales-ha && gh release create vX.Y.Z --title "vX.Y.Z: Title" --notes "Release notes here"
   ```
10. [ ] Verify releases show correct versions in GitHub UI

**IMPORTANT:** GitHub releases MUST be created immediately after pushing. The "Latest" release tag in GitHub must always match the current version in the code.

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
