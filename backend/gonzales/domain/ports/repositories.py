"""
Repository Ports - Interfaces for data persistence.

These abstract interfaces define how the domain interacts with storage,
without specifying implementation details (SQL, NoSQL, in-memory, etc.).
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Generic, Optional, Protocol, TypeVar

from gonzales.domain.entities import (
    MeasurementEntity,
    OutageEntity,
    TestFailureEntity,
)


T = TypeVar("T")


class Repository(ABC, Generic[T]):
    """
    Generic repository interface for CRUD operations.

    Provides a consistent API for entity persistence.
    """

    @abstractmethod
    async def get_by_id(self, entity_id: int) -> Optional[T]:
        """Get entity by its unique identifier."""
        ...

    @abstractmethod
    async def save(self, entity: T) -> T:
        """Save (create or update) an entity."""
        ...

    @abstractmethod
    async def delete(self, entity_id: int) -> bool:
        """Delete entity by ID. Returns True if deleted."""
        ...


class MeasurementRepository(Repository[MeasurementEntity]):
    """
    Repository for speed test measurements.

    Provides specialized queries for measurement data.
    """

    @abstractmethod
    async def get_latest(self) -> Optional[MeasurementEntity]:
        """Get the most recent measurement."""
        ...

    @abstractmethod
    async def get_by_time_range(
        self,
        start: datetime,
        end: datetime,
        limit: Optional[int] = None,
    ) -> list[MeasurementEntity]:
        """Get measurements within a time range."""
        ...

    @abstractmethod
    async def get_page(
        self,
        page: int,
        page_size: int,
        sort_field: str = "timestamp",
        sort_order: str = "desc",
    ) -> tuple[list[MeasurementEntity], int]:
        """
        Get paginated measurements.

        Returns:
            Tuple of (measurements, total_count)
        """
        ...

    @abstractmethod
    async def get_violations(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> list[MeasurementEntity]:
        """Get measurements that violated thresholds."""
        ...

    @abstractmethod
    async def count(self) -> int:
        """Get total number of measurements."""
        ...

    @abstractmethod
    async def count_by_time_range(self, start: datetime, end: datetime) -> int:
        """Get count of measurements in time range."""
        ...

    @abstractmethod
    async def delete_older_than(self, cutoff: datetime) -> int:
        """
        Delete measurements older than cutoff.

        Returns:
            Number of deleted records
        """
        ...

    @abstractmethod
    async def get_total_data_bytes(self) -> int:
        """Get sum of all data transferred in tests."""
        ...


class OutageRepository(Repository[OutageEntity]):
    """
    Repository for internet outage records.

    Tracks historical outage events.
    """

    @abstractmethod
    async def get_active(self) -> Optional[OutageEntity]:
        """Get currently active (unresolved) outage if any."""
        ...

    @abstractmethod
    async def get_by_time_range(
        self,
        start: datetime,
        end: datetime,
    ) -> list[OutageEntity]:
        """Get outages that occurred within time range."""
        ...

    @abstractmethod
    async def resolve(
        self,
        outage_id: int,
        ended_at: datetime,
        resolution_measurement_id: Optional[int] = None,
    ) -> Optional[OutageEntity]:
        """Mark an outage as resolved."""
        ...

    @abstractmethod
    async def get_statistics(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> dict:
        """
        Get outage statistics for a time period.

        Returns dict with:
        - total_outages
        - total_duration_seconds
        - avg_duration_seconds
        - longest_outage_seconds
        - uptime_pct (if period specified)
        """
        ...


class TestFailureRepository(Repository[TestFailureEntity]):
    """
    Repository for test failure records.

    Tracks failed speedtest attempts.
    """

    @abstractmethod
    async def get_recent(self, limit: int = 10) -> list[TestFailureEntity]:
        """Get most recent failures."""
        ...

    @abstractmethod
    async def count(self) -> int:
        """Get total failure count."""
        ...

    @abstractmethod
    async def delete_older_than(self, cutoff: datetime) -> int:
        """Delete failures older than cutoff."""
        ...


class UnitOfWork(Protocol):
    """
    Unit of Work pattern for transaction management.

    Ensures that a series of repository operations either
    all succeed or all fail together.
    """

    measurements: MeasurementRepository
    outages: OutageRepository
    test_failures: TestFailureRepository

    async def __aenter__(self) -> "UnitOfWork":
        """Start a new unit of work."""
        ...

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """End the unit of work, committing or rolling back."""
        ...

    async def commit(self) -> None:
        """Commit all changes."""
        ...

    async def rollback(self) -> None:
        """Rollback all changes."""
        ...
