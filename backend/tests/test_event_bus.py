"""Tests for the EventBus pub/sub system."""

import asyncio

from gonzales.services.event_bus import MAX_SUBSCRIBERS, EventBus


class TestEventBus:
    async def test_publish_and_subscribe(self):
        bus = EventBus()
        received = []

        async def consumer():
            async for event in bus.subscribe():
                received.append(event)
                break

        task = asyncio.create_task(consumer())
        await asyncio.sleep(0.01)
        bus.publish({"event": "test", "data": {"value": 42}})
        await task
        assert len(received) == 1
        assert received[0]["data"]["value"] == 42

    async def test_complete_event_stops_subscription(self):
        bus = EventBus()
        received = []

        async def consumer():
            async for event in bus.subscribe():
                received.append(event)

        task = asyncio.create_task(consumer())
        await asyncio.sleep(0.01)
        bus.publish({"event": "progress", "data": {"phase": "download"}})
        await asyncio.sleep(0.01)
        bus.publish({"event": "complete", "data": {"phase": "complete"}})
        await task
        assert len(received) == 2
        assert received[-1]["event"] == "complete"

    async def test_error_event_stops_subscription(self):
        bus = EventBus()
        received = []

        async def consumer():
            async for event in bus.subscribe():
                received.append(event)

        task = asyncio.create_task(consumer())
        await asyncio.sleep(0.01)
        bus.publish({"event": "error", "data": {"message": "fail"}})
        await task
        assert len(received) == 1
        assert received[0]["event"] == "error"

    async def test_subscriber_count(self):
        bus = EventBus()
        assert bus.subscriber_count == 0

        results = []

        async def consumer():
            async for event in bus.subscribe():
                results.append(event)
                if event.get("event") == "complete":
                    break

        tasks = [asyncio.create_task(consumer()) for _ in range(3)]
        await asyncio.sleep(0.01)
        assert bus.subscriber_count == 3

        # Send complete to release all subscribers
        bus.publish({"event": "complete", "data": {}})
        await asyncio.gather(*tasks)
        assert bus.subscriber_count == 0

    async def test_subscriber_limit(self):
        bus = EventBus()
        tasks = []
        for _ in range(MAX_SUBSCRIBERS):
            gen = bus.subscribe()
            task = asyncio.create_task(gen.__anext__())
            tasks.append((gen, task))
            await asyncio.sleep(0.001)

        assert bus.subscriber_count == MAX_SUBSCRIBERS

        # Next subscriber should get an error event
        rejected = []
        async for event in bus.subscribe():
            rejected.append(event)

        assert len(rejected) == 1
        assert rejected[0]["event"] == "error"
        assert "Too many" in rejected[0]["data"]["message"]

        # Clean up
        bus.publish({"event": "complete", "data": {}})
        await asyncio.sleep(0.05)

    async def test_fan_out_to_multiple_subscribers(self):
        bus = EventBus()
        results_a = []
        results_b = []

        async def consumer_a():
            async for event in bus.subscribe():
                results_a.append(event)
                if event.get("event") == "complete":
                    break

        async def consumer_b():
            async for event in bus.subscribe():
                results_b.append(event)
                if event.get("event") == "complete":
                    break

        task_a = asyncio.create_task(consumer_a())
        task_b = asyncio.create_task(consumer_b())
        await asyncio.sleep(0.01)

        bus.publish({"event": "progress", "data": {"phase": "download"}})
        bus.publish({"event": "complete", "data": {"phase": "complete"}})

        await asyncio.gather(task_a, task_b)
        assert len(results_a) == 2
        assert len(results_b) == 2

    async def test_cleanup_after_disconnect(self):
        bus = EventBus()

        async def short_consumer():
            async for event in bus.subscribe():
                break  # exit immediately after first event

        task = asyncio.create_task(short_consumer())
        await asyncio.sleep(0.01)
        assert bus.subscriber_count == 1

        bus.publish({"event": "test", "data": {}})
        await task
        await asyncio.sleep(0.01)
        assert bus.subscriber_count == 0
