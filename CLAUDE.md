# Claude Code Guidelines for Gonzales

## Version Management

### MUST-HAVE RULES (Non-Negotiable)

1. **ALL version files MUST be in sync** - Never release with mismatched versions
2. **CHANGELOG MUST be updated** before any release
3. **GitHub releases MUST be created** for BOTH repos after every version bump - use `gh release create`
4. **Frontend version constant MUST match** backend version (prevents infinite reload loop)
5. **Verify versions BEFORE pushing** - Always run the verification command below
6. **ALWAYS create GitHub releases immediately after pushing** - Never leave releases out of sync with code
7. **NEVER release gonzales without updating gonzales-ha** - Both repos MUST be released together as one atomic operation. The HA add-on runs the same backend, TUI, and web UI. Any code fix, feature, or change in gonzales MUST be reflected in gonzales-ha with matching version. A gonzales release without a gonzales-ha release is INCOMPLETE and FORBIDDEN.
8. **gonzales-ha MUST be identical in functionality** - The HA add-on is the same app, just packaged for Home Assistant. TUI, Web UI, API, MCP, CLI must all be identical between standalone and HA versions.

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

## Internationalization (i18n)

### MUST-HAVE RULES (Non-Negotiable)

1. **ALL user-facing strings MUST be bilingual** (English + German) - No hardcoded English text in components
2. **Always use `useTranslation()` hook** in React components - Never hardcode display strings
3. **Translation files MUST stay in sync** - Every key in `en.json` MUST exist in `de.json` and vice versa
4. **New features MUST include translations** - Any new UI text requires both EN and DE entries before merging

### Translation Files

| File | Purpose |
|------|---------|
| `frontend/src/i18n/index.ts` | i18n configuration (language detection, localStorage persistence) |
| `frontend/src/i18n/locales/en.json` | English translations (default/fallback language) |
| `frontend/src/i18n/locales/de.json` | German translations |

### How to Add New Translations

1. Add the key to **both** `en.json` and `de.json` with proper translations
2. Use nested namespaces: `"section.key"` (e.g., `"dashboard.title"`, `"settings.save"`)
3. For interpolation: `t("key", { variable: value })` - e.g., `t("history.page", { current: 1, total: 5 })`
4. Import and use: `const { t } = useTranslation();` then `{t("namespace.key")}`

### Language Selector

- Located in Settings > Preferences > Language
- Persists to `localStorage` key `gonzales_language`
- Supported languages defined in `frontend/src/i18n/index.ts` (`supportedLanguages` array)
- Default: auto-detect from browser, fallback to English

### Navigation Config

- Navigation items use `labelKey` and `shortLabelKey` (i18n keys, NOT display text)
- Defined in `frontend/src/config/navigation.ts`
- Components call `t(item.labelKey)` to get translated labels

## Agent System

### Available Agents (16)

| Agent | Type | Tools | Purpose |
|-------|------|-------|---------|
| backend-auditor | Audit | Read, Grep, Glob | Python/FastAPI architecture, security, code quality |
| frontend-auditor | Audit | Read, Grep, Glob | React/TypeScript quality, accessibility, performance |
| test-auditor | Audit | Read, Grep, Glob, Bash | Test coverage analysis and gap identification |
| web-ux-expert | Audit | Read, Grep, Glob | Dashboard UX, glass morphism design review |
| tui-ux-expert | Audit | Read, Grep, Glob | Terminal UI design, demoscene aesthetic |
| mcp-expert | Audit | Read, Grep, Glob | MCP protocol compliance, tool coverage |
| docs-expert | Audit | Read, Grep, Glob | Documentation accuracy and completeness |
| i18n-auditor | Audit | Read, Grep, Glob | Translation completeness, bilingual consistency |
| backend-engineer | Impl | Read, Grep, Glob, Edit, Write, Bash | Python/FastAPI implementation |
| frontend-engineer | Impl | Read, Grep, Glob, Edit, Write, Bash | React/TypeScript implementation |
| tui-engineer | Impl | Read, Grep, Glob, Edit, Write, Bash | Textual TUI implementation |
| mcp-engineer | Impl | Read, Grep, Glob, Edit, Write, Bash | MCP server development |
| docs-writer | Impl | Read, Grep, Glob, Edit, Write | Documentation updates |
| git-agent | Workflow | Read, Grep, Glob, Bash | Git operations, releases |
| code-reviewer | Workflow | Read, Grep, Glob | Code review |
| product-manager | Product | Read, Grep, Glob, WebSearch, WebFetch | Feature planning, competitive analysis |

### Agent Usage Rules
1. **Auditors are read-only** - Never assign implementation tasks to auditor agents
2. **Always audit before implementing** - Run auditor first, then engineer
3. **One concern per agent** - Do not overload agents with unrelated tasks
4. **Create feature branches first** - Before spawning implementation agents
5. **Update Known Patterns** - After every major session, update agent pattern sections
6. **Shut down agents before TeamDelete** - Always clean up properly
7. **Use bypassPermissions for version bumps** - Avoids blocking on edit approvals

### Standard Workflows
- **Audit Sprint**: Spawn all 7 auditors in parallel, collect reports, prioritize
- **Bug Fix**: code-reviewer -> relevant-auditor -> relevant-engineer -> test-auditor
- **Feature**: product-manager -> auditors -> engineers -> test-auditor -> docs-writer
- **Release**: git-agent (follows Release Checklist above)

## Learning Protocol

### How Agents Self-Improve
Each agent in `.claude/agents/` has a "Bekannte Patterns" (Known Patterns) section at the
bottom of its definition file. This section serves as persistent, project-specific memory
that accumulates knowledge across sessions.

### Update Rules
1. **When**: After every audit session, feature implementation, bug fix, or session with new knowledge
2. **What**: Project conventions, file paths, gotchas, config values, architecture decisions
3. **How**: Append new bullet points to the agent's Known Patterns section
4. **Limit**: Keep under 20 bullet points per agent. Consolidate if needed.
5. **Obsolete**: Mark outdated patterns with (OBSOLETE), remove on next update

### Memory Locations
- Agent-specific: `.claude/agents/<name>.md` (Known Patterns section per agent)
- Project-wide: Auto-memory `MEMORY.md` (cross-cutting lessons, release history)
- Rules: `CLAUDE.md` (this file - immutable rules all agents follow)
