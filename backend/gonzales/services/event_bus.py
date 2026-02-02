import asyncio
from typing import Any, AsyncGenerator

MAX_SUBSCRIBERS = 20
SUBSCRIBE_TIMEOUT = 300  # 5 minutes max per SSE connection


class EventBus:
    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue[dict[str, Any]]] = []

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)

    def publish(self, event: dict[str, Any]) -> None:
        for queue in self._subscribers:
            queue.put_nowait(event)

    async def subscribe(self) -> AsyncGenerator[dict[str, Any], None]:
        if len(self._subscribers) >= MAX_SUBSCRIBERS:
            yield {"event": "error", "data": {"message": "Too many connections"}}
            return

        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
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
