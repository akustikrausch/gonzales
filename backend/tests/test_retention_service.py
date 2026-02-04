"""Tests for the data retention service."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.services.retention_service import RetentionService


class TestRetentionService:
    """Test cases for RetentionService."""

    @pytest.mark.asyncio
    async def test_cleanup_disabled_when_zero(self, session: AsyncSession):
        """Test that cleanup is skipped when retention_days is 0."""
        service = RetentionService()

        with patch("gonzales.services.retention_service.settings") as mock_settings:
            mock_settings.data_retention_days = 0
            deleted = await service.cleanup_old_data()
            assert deleted == 0

    @pytest.mark.asyncio
    async def test_cleanup_disabled_when_negative(self, session: AsyncSession):
        """Test that cleanup is skipped when retention_days is negative."""
        service = RetentionService()

        with patch("gonzales.services.retention_service.settings") as mock_settings:
            mock_settings.data_retention_days = -1
            deleted = await service.cleanup_old_data()
            assert deleted == 0

    @pytest.mark.asyncio
    async def test_cleanup_deletes_old_measurements(
        self, session: AsyncSession, make_measurement
    ):
        """Test that old measurements are deleted."""
        now = datetime.now(timezone.utc)

        # Create measurements with different ages
        old_measurement = make_measurement(timestamp=now - timedelta(days=100))
        recent_measurement = make_measurement(timestamp=now - timedelta(days=10))
        new_measurement = make_measurement(timestamp=now - timedelta(days=1))

        session.add_all([old_measurement, recent_measurement, new_measurement])
        await session.commit()

        # Verify we have 3 measurements
        from gonzales.db.repository import MeasurementRepository

        repo = MeasurementRepository(session)
        assert await repo.count() == 3

        # Run cleanup with 30-day retention
        service = RetentionService()
        with patch("gonzales.services.retention_service.settings") as mock_settings:
            mock_settings.data_retention_days = 30
            with patch(
                "gonzales.services.retention_service.async_session"
            ) as mock_session_factory:
                # Mock the async context manager
                mock_session_factory.return_value.__aenter__.return_value = session
                mock_session_factory.return_value.__aexit__.return_value = None

                deleted = await service.cleanup_old_data()

        # Should have deleted 1 measurement (100 days old)
        assert deleted == 1

        # Verify 2 measurements remain
        assert await repo.count() == 2

    @pytest.mark.asyncio
    async def test_cleanup_no_old_measurements(
        self, session: AsyncSession, make_measurement
    ):
        """Test cleanup when no measurements are old enough."""
        now = datetime.now(timezone.utc)

        # Create only recent measurements
        m1 = make_measurement(timestamp=now - timedelta(days=5))
        m2 = make_measurement(timestamp=now - timedelta(days=10))

        session.add_all([m1, m2])
        await session.commit()

        service = RetentionService()
        with patch("gonzales.services.retention_service.settings") as mock_settings:
            mock_settings.data_retention_days = 30
            with patch(
                "gonzales.services.retention_service.async_session"
            ) as mock_session_factory:
                mock_session_factory.return_value.__aenter__.return_value = session
                mock_session_factory.return_value.__aexit__.return_value = None

                deleted = await service.cleanup_old_data()

        assert deleted == 0

        from gonzales.db.repository import MeasurementRepository

        repo = MeasurementRepository(session)
        assert await repo.count() == 2

    @pytest.mark.asyncio
    async def test_cleanup_respects_retention_period(
        self, session: AsyncSession, make_measurement
    ):
        """Test that retention period is correctly applied."""
        now = datetime.now(timezone.utc)

        # Create measurements at boundary conditions
        exactly_90_days = make_measurement(timestamp=now - timedelta(days=90))
        just_under_90_days = make_measurement(timestamp=now - timedelta(days=89))
        just_over_90_days = make_measurement(timestamp=now - timedelta(days=91))

        session.add_all([exactly_90_days, just_under_90_days, just_over_90_days])
        await session.commit()

        service = RetentionService()
        with patch("gonzales.services.retention_service.settings") as mock_settings:
            mock_settings.data_retention_days = 90
            with patch(
                "gonzales.services.retention_service.async_session"
            ) as mock_session_factory:
                mock_session_factory.return_value.__aenter__.return_value = session
                mock_session_factory.return_value.__aexit__.return_value = None

                deleted = await service.cleanup_old_data()

        # Should delete exactly_90_days and just_over_90_days (cutoff is < 90 days from now)
        assert deleted == 2

        from gonzales.db.repository import MeasurementRepository

        repo = MeasurementRepository(session)
        assert await repo.count() == 1
