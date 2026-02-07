import asyncio
import json
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse

from gonzales.api.dependencies import require_api_key
from gonzales.core.rate_limit import RATE_LIMITS, limiter
from gonzales.db.engine import async_session
from gonzales.services.event_bus import event_bus
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/speedtest", tags=["speedtest"])


async def _run_test_background(manual: bool = True) -> None:
    """Run speedtest in background with its own database session."""
    async with async_session() as session:
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
    # Mark test as starting immediately (also checks if already in progress)
    if not measurement_service.mark_test_starting():
        return JSONResponse(
            status_code=503,
            content={"detail": "A speed test is already in progress"}
        )

    # Publish "started" event immediately so frontend can show progress
    event_bus.publish({
        "event": "started",
        "data": {"phase": "started"},
    })

    # Start test in background (fire-and-forget)
    asyncio.create_task(_run_test_background(manual=True))

    return {"status": "started", "message": "Speed test started. Monitor progress via /speedtest/stream or poll /status."}


@router.get("/stream")
async def stream_speedtest():
    async def event_generator():
        # Immediate heartbeat to flush proxy buffers
        yield ": ok\n\n"

        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

        if event_bus._last_event is not None:
            queue.put_nowait(event_bus._last_event)

        if len(event_bus._subscribers) >= 20:
            yield 'event: error\ndata: {"message": "Too many connections"}\n\n'
            return

        event_bus._subscribers.append(queue)
        try:
            deadline = asyncio.get_event_loop().time() + 300  # 5 min max
            while asyncio.get_event_loop().time() < deadline:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    # Send keepalive to prevent proxy idle timeout
                    yield ": keepalive\n\n"
                    continue

                name = event.get("event", "message")
                data = json.dumps(event.get("data", {}))
                yield f"event: {name}\ndata: {data}\n\n"

                if event.get("event") in ("complete", "error"):
                    break
        except asyncio.CancelledError:
            pass
        finally:
            if queue in event_bus._subscribers:
                event_bus._subscribers.remove(queue)

    # Use application/octet-stream to bypass HA Core's ingress compression.
    # HA Core's should_compress() applies deflate to text/event-stream,
    # breaking SSE streaming. application/octet-stream is not compressed.
    # See: https://github.com/home-assistant/supervisor/issues/6470
    return StreamingResponse(
        event_generator(),
        media_type="application/octet-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
        },
    )
