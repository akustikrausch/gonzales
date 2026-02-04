# Contributing to Gonzales

Thank you for your interest in contributing to Gonzales! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Ookla Speedtest CLI

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gonzales.git
   cd gonzales
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   # or
   .venv\Scripts\activate     # Windows
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -e ".[dev,cli,tui]"
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend && python -m gonzales

   # Terminal 2: Frontend (with hot reload)
   cd frontend && npm run dev
   ```

6. **Access the application**
   - Frontend dev server: http://localhost:5173
   - Backend API: http://localhost:8470

## Code Style

### Python (Backend)

- Formatter: **Ruff**
- Line length: 100 characters
- Style guide: PEP 8

```bash
# Format code
ruff format backend/

# Lint code
ruff check backend/
```

### TypeScript (Frontend)

- Linter: **ESLint**
- Formatter: **Prettier** (via ESLint)
- Strict TypeScript mode enabled

```bash
# Lint code
cd frontend && npm run lint
```

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation only
- `refactor/description` - Code refactoring

### Commit Messages

We use conventional commits:

```
type(scope): short description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(api): add rate limiting to speedtest endpoint
fix(ui): correct toast notification positioning on mobile
docs: update installation instructions for Raspberry Pi
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Follow the code style guidelines

3. **Run tests and linting**
   ```bash
   # Backend
   cd backend && pytest tests/ && ruff check .

   # Frontend
   cd frontend && npm run lint && npm test
   ```

4. **Update CHANGELOG.md** (for significant changes)
   - Add entry under "Unreleased" section
   - Follow Keep a Changelog format

5. **Submit Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Wait for review

## Project Structure

```
gonzales/
├── backend/
│   ├── gonzales/
│   │   ├── domain/       # Domain Layer (Clean Architecture)
│   │   │   ├── entities.py       # Business entities
│   │   │   ├── value_objects.py  # Immutable value objects
│   │   │   ├── events.py         # Domain events
│   │   │   ├── exceptions.py     # Domain exceptions
│   │   │   └── ports/            # Repository/service interfaces
│   │   ├── application/  # Application Layer
│   │   │   └── use_cases/        # Business use cases
│   │   ├── api/          # FastAPI routes (Infrastructure)
│   │   ├── services/     # Service implementations
│   │   ├── db/           # Database models + repository
│   │   ├── schemas/      # Pydantic schemas (DTOs)
│   │   ├── middleware/   # Rate limiting, security
│   │   ├── cli/          # CLI commands
│   │   └── tui/          # Terminal UI
│   └── tests/            # Backend tests
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components (accessible)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   └── context/      # React contexts
│   └── tests/            # Frontend tests
└── docs/                 # Documentation
```

## Architecture Guidelines

Gonzales follows **Clean Architecture** principles:

### Domain Layer (`backend/gonzales/domain/`)
- Pure Python with no external dependencies
- Contains business entities, value objects, and domain events
- Defines repository and service interfaces (ports)

### Application Layer (`backend/gonzales/application/`)
- Contains use cases that orchestrate business logic
- Depends only on domain layer interfaces

### Infrastructure Layer
- `api/` - FastAPI routes (adapters for HTTP)
- `db/` - SQLAlchemy implementations (adapters for persistence)
- `services/` - External service implementations

### Key Principles
- Dependencies point inward (Infrastructure → Application → Domain)
- Domain layer has no dependencies on frameworks
- Use interfaces (protocols) to invert dependencies

## Home Assistant Integration

The Home Assistant addon and integration live in a separate repository:
[gonzales-ha](https://github.com/akustikrausch/gonzales-ha)

## Version Management

When releasing a new version, update these files:
- `backend/pyproject.toml`
- `backend/gonzales/__init__.py`
- `backend/gonzales/version.py`
- `frontend/package.json`
- `frontend/src/hooks/useVersionCheck.ts`

All version numbers must match!

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
