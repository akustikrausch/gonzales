import asyncio
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse

from gonzales.api.dependencies import require_api_key
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.db.engine import async_session_factory
from gonzales.services.event_bus import event_bus
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/speedtest", tags=["speedtest"])


async def _run_test_background(manual: bool = True) -> None:
    """Run speedtest in background with its own database session."""
    async with async_session_factory() as session:
        try:
            await measurement_service.run_test(session, manual=manual)
        except Exception:
            # Errors are already logged and stored in test_failures table
            pass


@router.post(
    "/trigger",
    status_code=202,
    dependencies=[Depends(require_api_key)],
    summary="Run Speed Test",
    description="""
    Trigger a new speed test. Returns immediately while test runs in background.

    **Important Notes:**
    - Returns 202 Accepted immediately - test runs asynchronously
    - Use SSE stream (/speedtest/stream) or poll /status to track progress
    - Rate limited to prevent abuse (1 per minute)
    - Requires API key authentication

    **Use Cases:**
    - Manual speed check from dashboard
    - AI agent triggering test on demand
    - Scheduled external triggers

    **Response:**
    Returns acknowledgment that test has started. Monitor progress via:
    - SSE: GET /api/v1/speedtest/stream
    - Polling: GET /api/v1/status (check scheduler.test_in_progress)
    - Result: GET /api/v1/measurements/latest

    **Errors:**
    - `429 Too Many Requests`: Rate limited, wait before retrying
    - `503 Service Unavailable`: Another test is already running
    - `401 Unauthorized`: Missing or invalid API key
    """,
    response_description="Test started acknowledgment"
)
@limiter.limit(RATE_LIMITS["speedtest_trigger"])
async def trigger_speedtest(request: Request):
    # Check if test already running
    if measurement_service.test_in_progress:
        return JSONResponse(
            status_code=503,
            content={"detail": "A speed test is already in progress"}
        )

    # Start test in background (fire-and-forget)
    asyncio.create_task(_run_test_background(manual=True))

    return {"status": "started", "message": "Speed test started. Monitor progress via /speedtest/stream or poll /status."}


@router.get("/stream")
async def stream_speedtest():
    async def event_generator():
        async for event in event_bus.subscribe():
            name = event.get("event", "message")
            data = json.dumps(event.get("data", {}))
            yield f"event: {name}\ndata: {data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            # Standard SSE headers
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "Content-Encoding": "identity",
            # Disable buffering in reverse proxies
            "X-Accel-Buffering": "no",  # nginx
            "X-Content-Type-Options": "nosniff",
            # Home Assistant Ingress specific
            "Transfer-Encoding": "chunked",
        },
    )
