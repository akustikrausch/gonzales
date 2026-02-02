from fastapi import HTTPException, status


class SpeedtestError(Exception):
    """Raised when the speedtest subprocess fails."""

    def __init__(self, message: str, raw_output: str | None = None):
        super().__init__(message)
        self.raw_output = raw_output


class SpeedtestBinaryNotFoundError(SpeedtestError):
    """Raised when the speedtest binary is not found on the system."""


class SpeedtestTimeoutError(SpeedtestError):
    """Raised when a speedtest exceeds the time limit."""


class TestInProgressError(HTTPException):
    """Raised when a test is already running."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="A speed test is already in progress.",
        )


class CooldownError(HTTPException):
    """Raised when manual trigger is on cooldown."""

    def __init__(self, remaining_seconds: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Manual trigger on cooldown. Try again in {remaining_seconds}s.",
        )


class MeasurementNotFoundError(HTTPException):
    """Raised when a measurement is not found."""

    def __init__(self, measurement_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Measurement {measurement_id} not found.",
        )
