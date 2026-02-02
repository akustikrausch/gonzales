import asyncio
from typing import Any, AsyncGenerator

MAX_SUBSCRIBERS = 20
SUBSCRIBE_TIMEOUT = 300  # 5 minutes max per SSE connection


class EventBus:
    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue[dict[str, Any]]] = []
        self._last_event: dict[str, Any] | None = None

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)

    def publish(self, event: dict[str, Any]) -> None:
        # Buffer the latest event so late subscribers can catch up
        if event.get("event") in ("complete", "error"):
            self._last_event = None
        else:
            self._last_event = event

        for queue in self._subscribers:
            queue.put_nowait(event)

    async def subscribe(self) -> AsyncGenerator[dict[str, Any], None]:
        if len(self._subscribers) >= MAX_SUBSCRIBERS:
            yield {"event": "error", "data": {"message": "Too many connections"}}
            return

        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

        # Replay last event so late subscribers immediately know the current state
        if self._last_event is not None:
            queue.put_nowait(self._last_event)

        self._subscribers.append(queue)
        try:
            while True:
                event = await asyncio.wait_for(
                    queue.get(), timeout=SUBSCRIBE_TIMEOUT
                )
                yield event
                if event.get("event") in ("complete", "error"):
                    break
        except asyncio.TimeoutError:
            yield {"event": "error", "data": {"message": "Connection timeout"}}
        finally:
            if queue in self._subscribers:
                self._subscribers.remove(queue)


event_bus = EventBus()
