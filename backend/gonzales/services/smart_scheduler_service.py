"""Smart scheduler service for adaptive test frequency.

Implements a three-phase scheduling model:
- Normal: User-configured interval
- Burst: Frequent testing when anomalies detected
- Recovery: Gradual backoff to normal interval
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, Callable, Awaitable

from gonzales.config import settings
from gonzales.core.logging import logger
from gonzales.services.stability_analyzer import StabilityAnalyzer
from gonzales.services.event_bus import event_bus


class SchedulerPhase(str, Enum):
    """Smart scheduler phases."""

    NORMAL = "normal"
    BURST = "burst"
    RECOVERY = "recovery"


@dataclass
class SmartSchedulerConfig:
    """Configuration for smart scheduling behavior."""

    enabled: bool = False

    # Interval bounds (safety limits)
    min_interval_minutes: int = 5
    max_interval_minutes: int = 240

    # Stability detection thresholds
    stability_threshold: float = 0.85
    stability_window_tests: int = 10

    # Burst mode settings
    burst_interval_minutes: int = 10
    burst_max_tests: int = 6
    burst_cooldown_minutes: int = 60

    # Recovery settings (exponential backoff)
    recovery_intervals: list[int] = field(default_factory=lambda: [15, 30, 45])
    recovery_stable_tests: int = 3

    # Data budget (safety limit)
    daily_data_budget_mb: float = 2048
    data_budget_warning_pct: float = 80

    # Time-of-day weighting
    peak_hours_start: int = 18
    peak_hours_end: int = 23
    offpeak_interval_multiplier: float = 1.5

    # Circuit breaker
    circuit_breaker_tests: int = 10
    circuit_breaker_window_minutes: int = 30


# Estimate of data used per speed test (download + upload)
ESTIMATED_DATA_PER_TEST_MB = 150.0


class SmartSchedulerService:
    """Intelligent scheduler that adapts test frequency based on network conditions.

    Safety mechanisms:
    - Hard interval limits (min/max)
    - Circuit breaker (max tests per time window)
    - Daily data budget
    - Burst cooldown
    - Recovery backoff
    """

    def __init__(self) -> None:
        self._config = SmartSchedulerConfig()
        self._current_phase = SchedulerPhase.NORMAL
        self._current_interval = settings.test_interval_minutes

        # State tracking
        self._burst_test_count = 0
        self._recovery_step = 0
        self._consecutive_stable = 0
        self._last_burst_time: Optional[datetime] = None
        self._tests_in_window: list[datetime] = []
        self._daily_data_used_mb: float = 0.0
        self._daily_reset_date: Optional[datetime] = None
        self._last_decision_reason: str = ""
        self._last_decision_time: Optional[datetime] = None
        self._circuit_breaker_active: bool = False

        # Stability analyzer
        self._stability_analyzer = StabilityAnalyzer(
            window_size=self._config.stability_window_tests,
        )

        # Reschedule callback (set by main.py)
        self._reschedule_callback: Optional[Callable[[int], None]] = None

        # Lock for thread safety
        self._lock = asyncio.Lock()

    @property
    def enabled(self) -> bool:
        return self._config.enabled

    @property
    def current_phase(self) -> SchedulerPhase:
        return self._current_phase

    @property
    def current_interval(self) -> int:
        return self._current_interval

    @property
    def config(self) -> dict:
        """Return current configuration as dict."""
        return {
            "enabled": self._config.enabled,
            "min_interval_minutes": self._config.min_interval_minutes,
            "max_interval_minutes": self._config.max_interval_minutes,
            "stability_threshold": self._config.stability_threshold,
            "stability_window_tests": self._config.stability_window_tests,
            "burst_interval_minutes": self._config.burst_interval_minutes,
            "burst_max_tests": self._config.burst_max_tests,
            "burst_cooldown_minutes": self._config.burst_cooldown_minutes,
            "daily_data_budget_mb": self._config.daily_data_budget_mb,
            "data_budget_warning_pct": self._config.data_budget_warning_pct,
            "peak_hours_start": self._config.peak_hours_start,
            "peak_hours_end": self._config.peak_hours_end,
            "offpeak_interval_multiplier": self._config.offpeak_interval_multiplier,
            "circuit_breaker_tests": self._config.circuit_breaker_tests,
            "circuit_breaker_window_minutes": self._config.circuit_breaker_window_minutes,
        }

    @property
    def status(self) -> dict:
        """Return current smart scheduler status."""
        budget_remaining_pct = self._get_budget_remaining_pct()
        return {
            "enabled": self._config.enabled,
            "phase": self._current_phase.value,
            "current_interval_minutes": self._current_interval,
            "base_interval_minutes": settings.test_interval_minutes,
            "burst_test_count": self._burst_test_count,
            "recovery_step": self._recovery_step,
            "consecutive_stable": self._consecutive_stable,
            "daily_data_used_mb": round(self._daily_data_used_mb, 2),
            "daily_data_budget_mb": self._config.daily_data_budget_mb,
            "data_budget_remaining_pct": round(budget_remaining_pct, 1),
            "data_budget_warning": budget_remaining_pct < (100 - self._config.data_budget_warning_pct),
            "stability_score": round(self._stability_analyzer.current_score, 3),
            "last_decision_reason": self._last_decision_reason or None,
            "last_decision_time": self._last_decision_time.isoformat() if self._last_decision_time else None,
            "circuit_breaker_active": self._circuit_breaker_active,
            "tests_in_window": len(self._tests_in_window),
        }

    def _get_budget_remaining_pct(self) -> float:
        """Calculate remaining data budget percentage."""
        if self._config.daily_data_budget_mb <= 0:
            return 100.0
        used_pct = (self._daily_data_used_mb / self._config.daily_data_budget_mb) * 100
        return max(0, 100 - used_pct)

    def set_reschedule_callback(self, callback: Callable[[int], None]) -> None:
        """Set the callback to reschedule the main scheduler."""
        self._reschedule_callback = callback

    def configure(self, **kwargs) -> None:
        """Update configuration settings."""
        for key, value in kwargs.items():
            if value is not None and hasattr(self._config, key):
                setattr(self._config, key, value)
                logger.debug("Smart scheduler config updated: %s = %s", key, value)

        # Update stability analyzer window if changed
        if "stability_window_tests" in kwargs and kwargs["stability_window_tests"]:
            self._stability_analyzer = StabilityAnalyzer(
                window_size=kwargs["stability_window_tests"],
            )

    def enable(self) -> None:
        """Enable smart scheduling."""
        self._config.enabled = True
        logger.info("Smart scheduler enabled")
        self._publish_event("smart_scheduler_enabled", {})

    def disable(self) -> None:
        """Disable smart scheduling and revert to base interval."""
        self._config.enabled = False
        self._reset_to_normal()
        logger.info("Smart scheduler disabled")
        self._publish_event("smart_scheduler_disabled", {})

    async def on_test_complete(self, measurement) -> None:
        """Called after each speed test completes.

        This is the main entry point that the SchedulerService calls.
        """
        if not self._config.enabled:
            return

        async with self._lock:
            # Reset daily budget if new day
            self._check_daily_reset()

            # Update data usage tracking
            self._update_data_usage(measurement)

            # Update stability analyzer
            self._stability_analyzer.add_measurement(measurement)

            # Add test to circuit breaker window
            self._update_tests_in_window()

            # Check circuit breaker first
            if self._is_circuit_breaker_triggered():
                await self._handle_circuit_breaker()
                return

            # Analyze result and adjust interval
            await self._analyze_and_adjust(measurement)

    def _check_daily_reset(self) -> None:
        """Reset daily counters if new day."""
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        if self._daily_reset_date is None or self._daily_reset_date < today:
            self._daily_data_used_mb = 0.0
            self._daily_reset_date = today
            logger.debug("Smart scheduler: daily counters reset")

    def _update_data_usage(self, measurement) -> None:
        """Update estimated data usage from measurement."""
        # Use actual bytes if available, otherwise estimate
        if hasattr(measurement, "download_bytes") and hasattr(measurement, "upload_bytes"):
            actual_mb = (measurement.download_bytes + measurement.upload_bytes) / (1024 * 1024)
            self._daily_data_used_mb += actual_mb
        else:
            self._daily_data_used_mb += ESTIMATED_DATA_PER_TEST_MB

    def _update_tests_in_window(self) -> None:
        """Update the sliding window of test timestamps for circuit breaker."""
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=self._config.circuit_breaker_window_minutes)

        # Remove old tests outside window
        self._tests_in_window = [t for t in self._tests_in_window if t > window_start]

        # Add current test
        self._tests_in_window.append(now)

    def _is_circuit_breaker_triggered(self) -> bool:
        """Check if circuit breaker should activate."""
        return len(self._tests_in_window) >= self._config.circuit_breaker_tests

    async def _handle_circuit_breaker(self) -> None:
        """Handle circuit breaker activation."""
        if not self._circuit_breaker_active:
            self._circuit_breaker_active = True
            logger.warning(
                "Smart scheduler: CIRCUIT BREAKER activated (%d tests in %d minutes)",
                len(self._tests_in_window),
                self._config.circuit_breaker_window_minutes,
            )
            self._publish_event(
                "smart_scheduler_circuit_breaker",
                {"tests_in_window": len(self._tests_in_window)},
            )

        # Force max interval
        self._current_interval = self._config.max_interval_minutes
        self._current_phase = SchedulerPhase.NORMAL
        self._last_decision_reason = "Circuit breaker: too many tests"
        self._last_decision_time = datetime.now(timezone.utc)
        self._reschedule(self._current_interval)

    def _is_peak_period(self) -> bool:
        """Check if current time is in peak hours."""
        hour = datetime.now(timezone.utc).hour
        if self._config.peak_hours_start <= self._config.peak_hours_end:
            return self._config.peak_hours_start <= hour <= self._config.peak_hours_end
        else:
            # Wrap around midnight
            return hour >= self._config.peak_hours_start or hour <= self._config.peak_hours_end

    def _can_enter_burst(self) -> bool:
        """Check if we can enter burst mode."""
        # Check cooldown
        if self._last_burst_time:
            cooldown = timedelta(minutes=self._config.burst_cooldown_minutes)
            if datetime.now(timezone.utc) - self._last_burst_time < cooldown:
                return False

        # Check data budget
        if self._get_budget_remaining_pct() < 20:
            return False

        return True

    async def _analyze_and_adjust(self, measurement) -> None:
        """Analyze measurement and adjust scheduling."""
        stability_score = self._stability_analyzer.current_score
        is_anomaly = self._stability_analyzer.is_anomaly(measurement)
        is_peak = self._is_peak_period()

        # Decide based on current phase
        if self._current_phase == SchedulerPhase.NORMAL:
            await self._handle_normal_phase(measurement, is_anomaly, stability_score, is_peak)

        elif self._current_phase == SchedulerPhase.BURST:
            await self._handle_burst_phase(measurement, is_anomaly, stability_score)

        elif self._current_phase == SchedulerPhase.RECOVERY:
            await self._handle_recovery_phase(measurement, is_anomaly, stability_score)

    async def _handle_normal_phase(
        self, measurement, is_anomaly: bool, stability_score: float, is_peak: bool
    ) -> None:
        """Handle decisions in normal phase."""
        if is_anomaly and self._can_enter_burst():
            # Enter burst mode
            anomaly_details = self._stability_analyzer.get_anomaly_details(measurement)
            reasons = anomaly_details.get("reasons", ["anomaly"])
            reason = f"Anomaly detected: {', '.join(reasons)}"
            await self._enter_burst_phase(reason)
        elif stability_score > self._config.stability_threshold and not is_peak:
            # Network very stable during off-peak - could increase interval
            # But don't exceed max or go below user's base interval
            base = settings.test_interval_minutes
            max_stable_interval = min(
                int(base * self._config.offpeak_interval_multiplier),
                self._config.max_interval_minutes,
            )
            if self._current_interval < max_stable_interval:
                self._current_interval = max_stable_interval
                self._last_decision_reason = f"Stable off-peak: increasing to {max_stable_interval}m"
                self._last_decision_time = datetime.now(timezone.utc)
                self._reschedule(self._current_interval)
                logger.info(
                    "Smart scheduler: stable off-peak, interval -> %dm",
                    self._current_interval,
                )

    async def _handle_burst_phase(
        self, measurement, is_anomaly: bool, stability_score: float
    ) -> None:
        """Handle decisions in burst phase."""
        self._burst_test_count += 1

        if self._burst_test_count >= self._config.burst_max_tests:
            # Max burst tests reached - enter recovery
            await self._enter_recovery_phase("Max burst tests reached")
        elif not is_anomaly:
            self._consecutive_stable += 1
            if self._consecutive_stable >= 2:
                # Two stable tests in a row - anomaly may be resolved
                await self._enter_recovery_phase("Anomaly appears resolved")
        else:
            # Still anomalous - reset stable counter
            self._consecutive_stable = 0

    async def _handle_recovery_phase(
        self, measurement, is_anomaly: bool, stability_score: float
    ) -> None:
        """Handle decisions in recovery phase."""
        if is_anomaly:
            # Anomaly during recovery - back to burst if allowed
            if self._can_enter_burst():
                await self._enter_burst_phase("Anomaly during recovery")
            else:
                # Can't burst, stay in recovery
                self._consecutive_stable = 0
        elif stability_score > self._config.stability_threshold:
            self._consecutive_stable += 1
            if self._consecutive_stable >= self._config.recovery_stable_tests:
                # Advance to next recovery step
                await self._advance_recovery()
        else:
            # Not fully stable - don't advance
            pass

    async def _enter_burst_phase(self, reason: str) -> None:
        """Transition to burst phase for more frequent testing."""
        self._current_phase = SchedulerPhase.BURST
        self._current_interval = self._config.burst_interval_minutes
        self._burst_test_count = 0
        self._consecutive_stable = 0
        self._last_burst_time = datetime.now(timezone.utc)
        self._last_decision_reason = reason
        self._last_decision_time = datetime.now(timezone.utc)
        self._circuit_breaker_active = False  # Reset circuit breaker on new burst

        self._reschedule(self._current_interval)
        self._publish_event("smart_scheduler_burst", {"reason": reason})
        logger.info("Smart scheduler: entering BURST phase - %s", reason)

    async def _enter_recovery_phase(self, reason: str) -> None:
        """Transition to recovery phase with gradual backoff."""
        self._current_phase = SchedulerPhase.RECOVERY
        self._recovery_step = 0
        self._consecutive_stable = 0
        self._current_interval = self._config.recovery_intervals[0]
        self._last_decision_reason = reason
        self._last_decision_time = datetime.now(timezone.utc)

        self._reschedule(self._current_interval)
        self._publish_event("smart_scheduler_recovery", {"step": 0, "reason": reason})
        logger.info("Smart scheduler: entering RECOVERY phase - %s", reason)

    async def _advance_recovery(self) -> None:
        """Advance to next recovery step or return to normal."""
        self._recovery_step += 1
        self._consecutive_stable = 0

        if self._recovery_step >= len(self._config.recovery_intervals):
            # Return to normal
            self._reset_to_normal()
            self._last_decision_reason = "Recovery complete"
            self._last_decision_time = datetime.now(timezone.utc)
            self._publish_event("smart_scheduler_normal", {})
            logger.info("Smart scheduler: returning to NORMAL phase")
        else:
            self._current_interval = self._config.recovery_intervals[self._recovery_step]
            self._last_decision_reason = f"Recovery step {self._recovery_step + 1}"
            self._last_decision_time = datetime.now(timezone.utc)
            self._reschedule(self._current_interval)
            self._publish_event(
                "smart_scheduler_recovery",
                {"step": self._recovery_step},
            )
            logger.info(
                "Smart scheduler: recovery step %d, interval -> %dm",
                self._recovery_step + 1,
                self._current_interval,
            )

    def _reset_to_normal(self) -> None:
        """Reset to normal phase with base interval."""
        self._current_phase = SchedulerPhase.NORMAL
        self._current_interval = settings.test_interval_minutes
        self._burst_test_count = 0
        self._recovery_step = 0
        self._consecutive_stable = 0
        self._circuit_breaker_active = False
        self._reschedule(self._current_interval)

    def _reschedule(self, interval_minutes: int) -> None:
        """Reschedule the main scheduler with new interval."""
        # Clamp to safety limits
        interval_minutes = max(
            self._config.min_interval_minutes,
            min(self._config.max_interval_minutes, interval_minutes),
        )

        if self._reschedule_callback:
            self._reschedule_callback(interval_minutes)
            logger.debug("Smart scheduler: rescheduled to %d minutes", interval_minutes)

    def _publish_event(self, event_type: str, data: dict) -> None:
        """Publish smart scheduler event for SSE subscribers."""
        event_bus.publish({
            "event": event_type,
            "data": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "phase": self._current_phase.value,
                "interval_minutes": self._current_interval,
                "stability_score": self._stability_analyzer.current_score,
                **data,
            },
        })


# Singleton instance
smart_scheduler_service = SmartSchedulerService()
