"""Schemas for smart scheduler API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SmartSchedulerConfig(BaseModel):
    """Smart scheduler configuration."""

    enabled: bool = False

    # Interval bounds (safety limits)
    min_interval_minutes: int = Field(default=5, ge=1, le=60)
    max_interval_minutes: int = Field(default=240, ge=60, le=1440)

    # Stability detection thresholds
    stability_threshold: float = Field(
        default=0.85, ge=0.5, le=1.0, description="Score above which network is considered stable"
    )
    stability_window_tests: int = Field(
        default=10, ge=5, le=50, description="Number of tests to consider for stability"
    )

    # Burst mode settings
    burst_interval_minutes: int = Field(
        default=10, ge=5, le=30, description="Interval during burst mode"
    )
    burst_max_tests: int = Field(
        default=6, ge=3, le=20, description="Max tests in burst before forcing recovery"
    )
    burst_cooldown_minutes: int = Field(
        default=60, ge=30, le=240, description="Min time between burst phases"
    )

    # Data budget (safety limit)
    daily_data_budget_mb: float = Field(
        default=2048, ge=100, le=10240, description="Maximum data usage per day in MB"
    )
    data_budget_warning_pct: float = Field(
        default=80, ge=50, le=95, description="Percentage at which to warn about data usage"
    )

    # Time-of-day settings
    peak_hours_start: int = Field(default=18, ge=0, le=23, description="Peak hours start (24h)")
    peak_hours_end: int = Field(default=23, ge=0, le=23, description="Peak hours end (24h)")
    offpeak_interval_multiplier: float = Field(
        default=1.5, ge=1.0, le=3.0, description="Multiplier for off-peak intervals"
    )

    # Circuit breaker
    circuit_breaker_tests: int = Field(
        default=10, ge=5, le=30, description="Max tests in window before circuit breaker"
    )
    circuit_breaker_window_minutes: int = Field(
        default=30, ge=15, le=120, description="Window for circuit breaker"
    )


class SmartSchedulerConfigUpdate(BaseModel):
    """Partial update for smart scheduler config."""

    enabled: Optional[bool] = None
    min_interval_minutes: Optional[int] = Field(default=None, ge=1, le=60)
    max_interval_minutes: Optional[int] = Field(default=None, ge=60, le=1440)
    stability_threshold: Optional[float] = Field(default=None, ge=0.5, le=1.0)
    burst_interval_minutes: Optional[int] = Field(default=None, ge=5, le=30)
    burst_max_tests: Optional[int] = Field(default=None, ge=3, le=20)
    burst_cooldown_minutes: Optional[int] = Field(default=None, ge=30, le=240)
    daily_data_budget_mb: Optional[float] = Field(default=None, ge=100, le=10240)
    peak_hours_start: Optional[int] = Field(default=None, ge=0, le=23)
    peak_hours_end: Optional[int] = Field(default=None, ge=0, le=23)
    offpeak_interval_multiplier: Optional[float] = Field(default=None, ge=1.0, le=3.0)
    circuit_breaker_tests: Optional[int] = Field(default=None, ge=5, le=30)
    circuit_breaker_window_minutes: Optional[int] = Field(default=None, ge=15, le=120)


class SmartSchedulerStatus(BaseModel):
    """Current smart scheduler status."""

    enabled: bool
    phase: str  # normal, burst, recovery
    current_interval_minutes: int
    base_interval_minutes: int

    # Phase details
    burst_test_count: int = 0
    recovery_step: int = 0
    consecutive_stable: int = 0

    # Stability
    stability_score: float

    # Data budget
    daily_data_used_mb: float
    daily_data_budget_mb: float
    data_budget_remaining_pct: float
    data_budget_warning: bool = False

    # Decision info
    last_decision_reason: Optional[str] = None
    last_decision_time: Optional[datetime] = None

    # Circuit breaker
    circuit_breaker_active: bool = False
    tests_in_window: int = 0


class SmartSchedulerDecision(BaseModel):
    """A recorded scheduling decision."""

    id: int
    timestamp: datetime
    previous_interval_minutes: int
    new_interval_minutes: int
    phase: str
    reason: str
    stability_score: Optional[float] = None
    anomaly_count: Optional[int] = None
    data_budget_remaining_mb: Optional[float] = None
    hour_of_day: int
    is_peak_period: bool

    class Config:
        from_attributes = True


class SmartSchedulerDecisionList(BaseModel):
    """List of scheduler decisions."""

    items: list[SmartSchedulerDecision]
    total: int


class SmartSchedulerDailyMetrics(BaseModel):
    """Daily metrics for smart scheduler."""

    date: datetime
    total_tests: int
    burst_phase_tests: int
    recovery_phase_tests: int
    normal_phase_tests: int
    estimated_data_used_mb: float
    anomalies_detected: int
    avg_interval_minutes: float
    time_in_burst_mode_minutes: float

    class Config:
        from_attributes = True


class SmartSchedulerMetricsList(BaseModel):
    """List of daily metrics."""

    items: list[SmartSchedulerDailyMetrics]
    total: int


class SmartSchedulerEnableResponse(BaseModel):
    """Response for enable/disable endpoints."""

    message: str
    enabled: bool
