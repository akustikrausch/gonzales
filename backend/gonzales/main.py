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
from gonzales.middleware.rate_limit import RateLimitMiddleware
from gonzales.services.scheduler_service import scheduler_service
from gonzales.services.smart_scheduler_service import smart_scheduler_service
from gonzales.services.speedtest_runner import speedtest_runner
from gonzales.version import __version__


class NoCacheIndexMiddleware(BaseHTTPMiddleware):
    """Prevent caching of index.html to ensure fresh assets are loaded."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Normalize double slashes from HA Ingress proxy
        path = request.url.path
        while "//" in path:
            path = path.replace("//", "/")
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

    # Initialize smart scheduler with reschedule callback
    smart_scheduler_service.set_reschedule_callback(scheduler_service.reschedule)

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

    # Rate limiting middleware - protect API from abuse
    # Disabled for local development (127.0.0.1) or when explicitly disabled
    enable_rate_limit = settings.host != "127.0.0.1" and not settings.debug
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=120,  # 2 requests/second sustained
        burst_size=30,  # Allow bursts of 30 requests (page load ~8 API calls)
        strict_requests_per_minute=6,  # Resource-intensive endpoints: 1 per 10 seconds
        strict_burst_size=2,
        enabled=enable_rate_limit,
    )

    app.include_router(api_router)

    static_dir = Path(__file__).parent / "static"
    if static_dir.is_dir():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app


app = create_app()
