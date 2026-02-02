"""Tests for the database repository layer."""

from datetime import datetime, timedelta, timezone

from gonzales.db.models import TestFailure
from gonzales.db.repository import MeasurementRepository, TestFailureRepository


class TestMeasurementRepository:
    async def test_create_and_get_by_id(self, session, make_measurement):
        repo = MeasurementRepository(session)
        m = make_measurement(download_mbps=450.5)
        saved = await repo.create(m)
        assert saved.id is not None
        assert saved.download_mbps == 450.5

        fetched = await repo.get_by_id(saved.id)
        assert fetched is not None
        assert fetched.download_mbps == 450.5

    async def test_get_by_id_not_found(self, session):
        repo = MeasurementRepository(session)
        result = await repo.get_by_id(999)
        assert result is None

    async def test_get_latest(self, session, make_measurement):
        repo = MeasurementRepository(session)
        base = datetime(2025, 6, 1, 12, 0, tzinfo=timezone.utc)
        await repo.create(make_measurement(download_mbps=100, timestamp=base))
        await repo.create(make_measurement(download_mbps=200, timestamp=base + timedelta(hours=1)))
        await repo.create(make_measurement(download_mbps=300, timestamp=base + timedelta(hours=2)))

        latest = await repo.get_latest()
        assert latest is not None
        assert latest.download_mbps == 300

    async def test_get_latest_empty(self, session):
        repo = MeasurementRepository(session)
        assert await repo.get_latest() is None

    async def test_count(self, session, make_measurement):
        repo = MeasurementRepository(session)
        assert await repo.count() == 0
        await repo.create(make_measurement())
        await repo.create(make_measurement())
        assert await repo.count() == 2

    async def test_delete_by_id(self, session, make_measurement):
        repo = MeasurementRepository(session)
        saved = await repo.create(make_measurement())
        assert await repo.count() == 1

        deleted = await repo.delete_by_id(saved.id)
        assert deleted is True
        assert await repo.count() == 0

    async def test_delete_by_id_not_found(self, session):
        repo = MeasurementRepository(session)
        deleted = await repo.delete_by_id(999)
        assert deleted is False

    async def test_get_paginated_default(self, session, make_measurement):
        repo = MeasurementRepository(session)
        base = datetime(2025, 6, 1, tzinfo=timezone.utc)
        for i in range(5):
            await repo.create(make_measurement(
                download_mbps=100 + i * 100,
                timestamp=base + timedelta(hours=i),
            ))

        items, total = await repo.get_paginated(page=1, page_size=3)
        assert total == 5
        assert len(items) == 3
        # Default sort is desc by timestamp
        assert items[0].download_mbps == 500

    async def test_get_paginated_page_2(self, session, make_measurement):
        repo = MeasurementRepository(session)
        base = datetime(2025, 6, 1, tzinfo=timezone.utc)
        for i in range(5):
            await repo.create(make_measurement(
                download_mbps=100 + i * 100,
                timestamp=base + timedelta(hours=i),
            ))

        items, total = await repo.get_paginated(page=2, page_size=3)
        assert total == 5
        assert len(items) == 2

    async def test_get_paginated_with_date_filter(self, session, make_measurement):
        repo = MeasurementRepository(session)
        base = datetime(2025, 6, 1, tzinfo=timezone.utc)
        for i in range(5):
            await repo.create(make_measurement(
                timestamp=base + timedelta(days=i),
            ))

        items, total = await repo.get_paginated(
            start_date=base + timedelta(days=1),
            end_date=base + timedelta(days=3),
        )
        assert total == 3

    async def test_get_paginated_sort_asc(self, session, make_measurement):
        repo = MeasurementRepository(session)
        base = datetime(2025, 6, 1, tzinfo=timezone.utc)
        for i in range(3):
            await repo.create(make_measurement(
                download_mbps=100 * (i + 1),
                timestamp=base + timedelta(hours=i),
            ))

        items, _ = await repo.get_paginated(sort_order="asc")
        assert items[0].download_mbps == 100

    async def test_get_all_in_range(self, session, make_measurement):
        repo = MeasurementRepository(session)
        base = datetime(2025, 6, 1, tzinfo=timezone.utc)
        for i in range(5):
            await repo.create(make_measurement(timestamp=base + timedelta(days=i)))

        all_items = await repo.get_all_in_range()
        assert len(all_items) == 5

        filtered = await repo.get_all_in_range(
            start_date=base + timedelta(days=2),
        )
        assert len(filtered) == 3

    async def test_get_statistics(self, session, make_measurement):
        repo = MeasurementRepository(session)
        await repo.create(make_measurement(download_mbps=100, upload_mbps=50,
                                           below_download_threshold=True))
        await repo.create(make_measurement(download_mbps=200, upload_mbps=100))
        await repo.create(make_measurement(download_mbps=300, upload_mbps=150))

        stats = await repo.get_statistics()
        assert stats["total_tests"] == 3
        assert stats["min_download"] == 100
        assert stats["max_download"] == 300
        assert stats["download_violations"] == 1


class TestTestFailureRepository:
    async def test_create_failure(self, session):
        repo = TestFailureRepository(session)
        failure = TestFailure(
            error_type="SpeedtestError",
            error_message="Connection timed out",
            raw_output="timeout after 60s",
        )
        saved = await repo.create(failure)
        assert saved.id is not None
        assert saved.error_type == "SpeedtestError"

    async def test_get_recent(self, session):
        repo = TestFailureRepository(session)
        for i in range(5):
            await repo.create(TestFailure(
                error_type="Error",
                error_message=f"Error {i}",
            ))

        recent = await repo.get_recent(limit=3)
        assert len(recent) == 3
