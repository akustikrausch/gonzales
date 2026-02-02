import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.api.dependencies import get_db
from gonzales.schemas.measurement import MeasurementOut
from gonzales.services.event_bus import event_bus
from gonzales.services.measurement_service import measurement_service

router = APIRouter(prefix="/speedtest", tags=["speedtest"])


@router.post("/trigger", response_model=MeasurementOut)
async def trigger_speedtest(session: AsyncSession = Depends(get_db)):
    m = await measurement_service.run_test(session, manual=True)
    return MeasurementOut.model_validate(m)


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
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
