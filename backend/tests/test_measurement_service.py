"""Tests for the measurement service."""

import time
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.core.exceptions import CooldownError, TestInProgressError
from gonzales.services.measurement_service import MeasurementService


class TestMeasurementService:
    """Test cases for MeasurementService."""

    def test_initial_state(self):
        """Test service initializes with correct state."""
        service = MeasurementService()
        assert service.test_in_progress is False

    def test_cooldown_check_no_previous_trigger(self):
        """Test cooldown passes when no previous trigger."""
        service = MeasurementService()
        service._last_manual_trigger = 0.0
        # Should not raise - no previous trigger
        with patch("gonzales.services.measurement_service.settings") as mock_settings:
            mock_settings.manual_trigger_cooldown_seconds = 60
            service._check_cooldown()

    def test_cooldown_check_within_cooldown(self):
        """Test cooldown raises error when within cooldown period."""
        service = MeasurementService()
        service._last_manual_trigger = time.time()

        with patch("gonzales.services.measurement_service.settings") as mock_settings:
            mock_settings.manual_trigger_cooldown_seconds = 60
            with pytest.raises(CooldownError):
                service._check_cooldown()

    def test_cooldown_check_after_cooldown(self):
        """Test cooldown passes after cooldown period."""
        service = MeasurementService()
        service._last_manual_trigger = time.time() - 120  # 2 minutes ago

        with patch("gonzales.services.measurement_service.settings") as mock_settings:
            mock_settings.manual_trigger_cooldown_seconds = 60
            # Should not raise
            service._check_cooldown()


class TestMeasurementServiceDatabase:
    """Test cases for MeasurementService database operations."""

    @pytest.mark.asyncio
    async def test_get_latest(self, session: AsyncSession, make_measurement):
        """Test getting the latest measurement."""
        service = MeasurementService()

        # Create some measurements
        m1 = make_measurement(download_mbps=100.0)
        m2 = make_measurement(download_mbps=200.0)
        session.add_all([m1, m2])
        await session.commit()

        latest = await service.get_latest(session)
        assert latest is not None
        # Latest should be the most recently added (by timestamp)

    @pytest.mark.asyncio
    async def test_get_paginated(self, session: AsyncSession, make_measurement):
        """Test paginated measurement retrieval."""
        service = MeasurementService()

        # Create 25 measurements
        for i in range(25):
            m = make_measurement(download_mbps=100.0 + i)
            session.add(m)
        await session.commit()

        # Get first page
        measurements, total = await service.get_paginated(session, page=1, page_size=10)
        assert len(measurements) == 10
        assert total == 25

        # Get second page
        measurements, total = await service.get_paginated(session, page=2, page_size=10)
        assert len(measurements) == 10
        assert total == 25

        # Get third page (partial)
        measurements, total = await service.get_paginated(session, page=3, page_size=10)
        assert len(measurements) == 5
        assert total == 25

    @pytest.mark.asyncio
    async def test_get_by_id(self, session: AsyncSession, make_measurement):
        """Test getting measurement by ID."""
        service = MeasurementService()

        m = make_measurement(download_mbps=500.0)
        session.add(m)
        await session.commit()
        await session.refresh(m)

        result = await service.get_by_id(session, m.id)
        assert result is not None
        assert result.download_mbps == 500.0

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, session: AsyncSession):
        """Test getting non-existent measurement returns None."""
        service = MeasurementService()
        result = await service.get_by_id(session, 99999)
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_by_id(self, session: AsyncSession, make_measurement):
        """Test deleting measurement by ID."""
        service = MeasurementService()

        m = make_measurement()
        session.add(m)
        await session.commit()
        await session.refresh(m)
        measurement_id = m.id

        deleted = await service.delete_by_id(session, measurement_id)
        assert deleted is True

        # Verify it's gone
        result = await service.get_by_id(session, measurement_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_by_id_not_found(self, session: AsyncSession):
        """Test deleting non-existent measurement returns False."""
        service = MeasurementService()
        deleted = await service.delete_by_id(session, 99999)
        assert deleted is False

    @pytest.mark.asyncio
    async def test_delete_all(self, session: AsyncSession, make_measurement):
        """Test deleting all measurements."""
        service = MeasurementService()

        # Create some measurements
        for _ in range(5):
            session.add(make_measurement())
        await session.commit()

        count = await service.count(session)
        assert count == 5

        deleted = await service.delete_all(session)
        assert deleted == 5

        count = await service.count(session)
        assert count == 0

    @pytest.mark.asyncio
    async def test_count(self, session: AsyncSession, make_measurement):
        """Test counting measurements."""
        service = MeasurementService()

        assert await service.count(session) == 0

        for _ in range(3):
            session.add(make_measurement())
        await session.commit()

        assert await service.count(session) == 3

    @pytest.mark.asyncio
    async def test_get_all_in_range(self, session: AsyncSession, make_measurement):
        """Test getting measurements within date range."""
        service = MeasurementService()

        # Create measurements with different timestamps
        now = datetime.now(timezone.utc)
        from datetime import timedelta

        m1 = make_measurement(timestamp=now - timedelta(days=10))
        m2 = make_measurement(timestamp=now - timedelta(days=5))
        m3 = make_measurement(timestamp=now - timedelta(days=1))
        session.add_all([m1, m2, m3])
        await session.commit()

        # Get all
        all_measurements = await service.get_all_in_range(session)
        assert len(all_measurements) == 3

        # Get with start date filter
        filtered = await service.get_all_in_range(
            session, start_date=now - timedelta(days=7)
        )
        assert len(filtered) == 2

        # Get with end date filter
        filtered = await service.get_all_in_range(
            session, end_date=now - timedelta(days=3)
        )
        assert len(filtered) == 2

        # Get with both filters
        filtered = await service.get_all_in_range(
            session,
            start_date=now - timedelta(days=7),
            end_date=now - timedelta(days=2),
        )
        assert len(filtered) == 1
