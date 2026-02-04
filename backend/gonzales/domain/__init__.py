"""
Domain Layer - Pure business logic without external dependencies.

This layer contains:
- Entities: Core business objects with identity
- Value Objects: Immutable objects defined by their attributes
- Domain Events: Events that occur within the domain
- Exceptions: Domain-specific error types
- Ports: Interfaces for external dependencies (repositories, services)

The domain layer is the heart of the application and should have no
dependencies on infrastructure (database, web frameworks, etc.).
"""

from gonzales.domain.entities import (
    MeasurementEntity,
    OutageEntity,
    SpeedtestServerEntity,
    ConfigEntity,
    TestFailureEntity,
)
from gonzales.domain.value_objects import (
    Speed,
    Duration,
    Percentage,
    NetworkMetrics,
    ThresholdConfig,
    ConnectionType,
)
from gonzales.domain.exceptions import (
    DomainError,
    ValidationError,
    ThresholdViolationError,
    OutageError,
    ConfigurationError,
    SpeedtestError,
    RateLimitError,
    NotFoundError,
    DataRetentionError,
)
from gonzales.domain.events import (
    DomainEvent,
    MeasurementCompleted,
    OutageDetected,
    OutageResolved,
    ThresholdViolation,
    TestScheduled,
    TestFailed,
    ConfigurationChanged,
    DataRetentionExecuted,
    WebhookSent,
    ServerListUpdated,
)

__all__ = [
    # Entities
    "MeasurementEntity",
    "OutageEntity",
    "SpeedtestServerEntity",
    "ConfigEntity",
    "TestFailureEntity",
    # Value Objects
    "Speed",
    "Duration",
    "Percentage",
    "NetworkMetrics",
    "ThresholdConfig",
    "ConnectionType",
    # Exceptions
    "DomainError",
    "ValidationError",
    "ThresholdViolationError",
    "OutageError",
    "ConfigurationError",
    "SpeedtestError",
    "RateLimitError",
    "NotFoundError",
    "DataRetentionError",
    # Events
    "DomainEvent",
    "MeasurementCompleted",
    "OutageDetected",
    "OutageResolved",
    "ThresholdViolation",
    "TestScheduled",
    "TestFailed",
    "ConfigurationChanged",
    "DataRetentionExecuted",
    "WebhookSent",
    "ServerListUpdated",
]
