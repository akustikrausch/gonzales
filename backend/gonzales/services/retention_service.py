"""Data retention service for automatic cleanup of old measurements."""

from datetime import datetime, timedelta, timezone

from gonzales.config import settings
from gonzales.core.logging import logger
from gonzales.db.engine import async_session
from gonzales.db.repository import MeasurementRepository


class RetentionService:
    """Service for managing data retention and cleanup.

    This service runs periodically to delete measurements older than
    the configured retention period. A retention period of 0 means
    data is kept indefinitely.
    """

    async def cleanup_old_data(self) -> int:
        """Delete measurements older than the retention period.

        Returns:
            Number of deleted measurements, or 0 if retention is disabled.
        """
        retention_days = settings.data_retention_days

        if retention_days <= 0:
            logger.debug("Data retention disabled (retention_days=%d)", retention_days)
            return 0

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
        logger.info(
            "Running data retention cleanup (keeping data from last %d days, cutoff: %s)",
            retention_days,
            cutoff_date.isoformat(),
        )

        async with async_session() as session:
            repo = MeasurementRepository(session)
            deleted_count = await repo.delete_older_than(cutoff_date)

        if deleted_count > 0:
            logger.info(
                "Data retention: deleted %d measurements older than %s",
                deleted_count,
                cutoff_date.date().isoformat(),
            )
        else:
            logger.debug("Data retention: no old measurements to delete")

        return deleted_count


retention_service = RetentionService()
