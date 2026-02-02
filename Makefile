PYTHON ?= python3

.PHONY: install dev run tui frontend build clean test lint

install:
	cd backend && pip install -e .
	cd frontend && npm install

dev:
	cd backend && pip install -e ".[dev]"
	cd frontend && npm install

run:
	cd backend && $(PYTHON) -m gonzales

tui:
	cd backend && $(PYTHON) -m gonzales.tui.app

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build
	rm -rf backend/gonzales/static
	cp -r frontend/dist backend/gonzales/static

build: frontend-build

clean:
	find backend -type d -name __pycache__ -exec rm -rf {} +
	rm -rf backend/*.egg-info backend/dist backend/build
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/gonzales/static

test:
	cd backend && $(PYTHON) -m pytest

lint:
	cd backend && ruff check .
	cd frontend && npm run lint
