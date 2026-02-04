"""
Domain Exceptions - Business rule violations and domain errors.

These exceptions represent problems in the domain logic,
separate from infrastructure errors (database, network, etc.).
"""


class DomainError(Exception):
    """
    Base class for all domain exceptions.

    Domain errors indicate business rule violations or invalid domain states.
    """

    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class ValidationError(DomainError):
    """
    Invalid input or domain object state.

    Raised when data fails validation rules.
    """

    def __init__(self, message: str, field: str | None = None):
        self.field = field
        code = f"VALIDATION_ERROR:{field}" if field else "VALIDATION_ERROR"
        super().__init__(message, code)


class ThresholdViolationError(DomainError):
    """
    Speed measurement below configured threshold.

    Contains details about which thresholds were violated.
    """

    def __init__(
        self,
        message: str,
        download_mbps: float,
        upload_mbps: float,
        download_threshold: float,
        upload_threshold: float,
        below_download: bool,
        below_upload: bool,
    ):
        self.download_mbps = download_mbps
        self.upload_mbps = upload_mbps
        self.download_threshold = download_threshold
        self.upload_threshold = upload_threshold
        self.below_download = below_download
        self.below_upload = below_upload
        super().__init__(message, "THRESHOLD_VIOLATION")

    @property
    def download_deficit_pct(self) -> float:
        """Percentage below download threshold."""
        if not self.below_download:
            return 0.0
        return (self.download_threshold - self.download_mbps) / self.download_threshold * 100

    @property
    def upload_deficit_pct(self) -> float:
        """Percentage below upload threshold."""
        if not self.below_upload:
            return 0.0
        return (self.upload_threshold - self.upload_mbps) / self.upload_threshold * 100


class OutageError(DomainError):
    """
    Internet connectivity failure.

    Raised when consecutive test failures indicate an outage.
    """

    def __init__(self, message: str, consecutive_failures: int):
        self.consecutive_failures = consecutive_failures
        super().__init__(message, "OUTAGE_ERROR")


class ConfigurationError(DomainError):
    """
    Invalid configuration state.

    Raised when configuration values are inconsistent or invalid.
    """

    def __init__(self, message: str, setting: str | None = None):
        self.setting = setting
        code = f"CONFIG_ERROR:{setting}" if setting else "CONFIG_ERROR"
        super().__init__(message, code)


class SpeedtestError(DomainError):
    """
    Speed test execution failure.

    Wraps errors from the speedtest CLI or service.
    """

    def __init__(self, message: str, error_type: str = "UNKNOWN"):
        self.error_type = error_type
        super().__init__(message, f"SPEEDTEST_ERROR:{error_type}")


class RateLimitError(DomainError):
    """
    Rate limit exceeded.

    Raised when operations are attempted too frequently.
    """

    def __init__(self, message: str, retry_after_seconds: int = 60):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(message, "RATE_LIMIT_ERROR")


class NotFoundError(DomainError):
    """
    Requested entity not found.

    Raised when a lookup fails to find the requested resource.
    """

    def __init__(self, entity_type: str, identifier: str | int):
        self.entity_type = entity_type
        self.identifier = identifier
        message = f"{entity_type} with id '{identifier}' not found"
        super().__init__(message, "NOT_FOUND")


class DataRetentionError(DomainError):
    """
    Data retention policy violation.

    Raised when attempting to access data outside retention window.
    """

    def __init__(self, message: str, retention_days: int):
        self.retention_days = retention_days
        super().__init__(message, "DATA_RETENTION_ERROR")
