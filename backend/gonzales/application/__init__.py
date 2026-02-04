"""
Application Layer - Use cases and application services.

The application layer orchestrates domain logic and coordinates
between the domain and infrastructure layers. It contains:

- Use Cases: Single-purpose operations that fulfill user goals
- Application Services: Cross-cutting concerns and coordination
- DTOs: Data transfer objects for layer boundaries

This layer depends on the domain layer but not on infrastructure.
Infrastructure details are injected via ports.
"""

from gonzales.application.use_cases.run_speedtest import RunSpeedtestUseCase
from gonzales.application.use_cases.get_statistics import GetStatisticsUseCase
from gonzales.application.use_cases.manage_config import ManageConfigUseCase
from gonzales.application.use_cases.export_data import ExportDataUseCase

__all__ = [
    "RunSpeedtestUseCase",
    "GetStatisticsUseCase",
    "ManageConfigUseCase",
    "ExportDataUseCase",
]
