from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from gonzales.api.router import api_router
from gonzales.config import settings
from gonzales.core.logging import logger
from gonzales.core.security import configure_security
from gonzales.db.engine import dispose_engine, init_db
from gonzales.services.scheduler_service import scheduler_service
from gonzales.services.speedtest_runner import speedtest_runner


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Gonzales starting up...")

    try:
        speedtest_runner.validate_binary()
    except Exception as e:
        logger.warning("Speedtest binary not found: %s", e)

    await init_db()
    logger.info("Database initialized")

    scheduler_service.start()

    yield

    logger.info("Gonzales shutting down...")
    scheduler_service.stop()
    await dispose_engine()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Gonzales",
        description="Internet Speed Monitor",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    configure_security(app)
    app.include_router(api_router)

    static_dir = Path(__file__).parent / "static"
    if static_dir.is_dir():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app


app = create_app()
