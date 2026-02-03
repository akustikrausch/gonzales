from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from gonzales.api.router import api_router
from gonzales.config import settings
from gonzales.core.logging import logger
from gonzales.core.security import configure_security
from gonzales.db.engine import dispose_engine, init_db
from gonzales.services.scheduler_service import scheduler_service
from gonzales.services.speedtest_runner import speedtest_runner
from gonzales.version import __version__


class NoCacheIndexMiddleware(BaseHTTPMiddleware):
    """Prevent caching of index.html to ensure fresh assets are loaded."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        path = request.url.path
        # No cache for index.html (root or explicit)
        if path in ("/", "/index.html") or (
            not path.startswith("/api/") and not path.startswith("/assets/")
        ):
            if response.headers.get("content-type", "").startswith("text/html"):
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
        # Assets with hashes can be cached long-term
        elif path.startswith("/assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Gonzales v%s starting up...", __version__)

    try:
        speedtest_runner.validate_binary()
    except Exception as e:
        logger.warning("Speedtest binary not found: %s", e)

    if settings.host != "127.0.0.1" and not settings.api_key:
        logger.warning(
            "Binding to %s without GONZALES_API_KEY. "
            "Mutating endpoints (trigger, config, delete) are unprotected. "
            "Set GONZALES_API_KEY to secure your instance.",
            settings.host,
        )

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
        version=__version__,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    configure_security(app)
    app.add_middleware(NoCacheIndexMiddleware)
    app.include_router(api_router)

    static_dir = Path(__file__).parent / "static"
    if static_dir.is_dir():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app


app = create_app()
