import asyncio
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from gonzales.config import settings
from gonzales.core.logging import logger
from gonzales.db.engine import async_session
from gonzales.services.measurement_service import measurement_service
from gonzales.services.event_bus import event_bus

# Outage detection constants
RETRY_DELAY_SECONDS = 60  # Wait 1 minute between retries
MAX_CONSECUTIVE_FAILURES = 3  # 3 failures = outage confirmed


class SchedulerService:
    def __init__(self) -> None:
        self._scheduler: AsyncIOScheduler | None = None
        self._test_in_progress: bool = False
        # Outage detection state
        self._consecutive_failures: int = 0
        self._outage_active: bool = False
        self._outage_started_at: datetime | None = None
        self._last_failure_message: str = ""
        self._retry_pending: bool = False

    @property
    def scheduler(self) -> AsyncIOScheduler | None:
        return self._scheduler

    @property
    def running(self) -> bool:
        return self._scheduler is not None and self._scheduler.running

    @property
    def test_in_progress(self) -> bool:
        return self._test_in_progress

    @property
    def next_run_time(self):
        if not self._scheduler or not self._scheduler.running:
            return None
        jobs = self._scheduler.get_jobs()
        if jobs:
            return jobs[0].next_run_time
        return None

    @property
    def outage_status(self) -> dict:
        """Return current outage status for API exposure."""
        return {
            "outage_active": self._outage_active,
            "outage_started_at": (
                self._outage_started_at.isoformat() if self._outage_started_at else None
            ),
            "consecutive_failures": self._consecutive_failures,
            "last_failure_message": self._last_failure_message,
        }

    def _publish_outage_event(self, event_type: str, message: str) -> None:
        """Publish outage event for SSE subscribers and HA integration."""
        event_bus.publish({
            "event": event_type,
            "data": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": message,
                "consecutive_failures": self._consecutive_failures,
                "outage_started_at": (
                    self._outage_started_at.isoformat() if self._outage_started_at else None
                ),
            },
        })
        logger.info("Published event: %s - %s", event_type, message)

    async def _run_test_with_retry(self, is_retry: bool = False) -> None:
        """Run a speed test with smart retry logic on failure.

        Retry Logic:
        - On first failure: wait 1 min, retry
        - On second failure: wait 1 min, retry again
        - On third consecutive failure: declare outage, stop retrying
        - After outage: continue normal schedule
        - When test succeeds after outage: publish outage_resolved event
        """
        if self._test_in_progress:
            logger.debug("Test already in progress, skipping")
            return

        self._test_in_progress = True
        self._retry_pending = False

        try:
            logger.info(
                "Scheduler: running %s speed test (failures: %d)",
                "retry" if is_retry else "scheduled",
                self._consecutive_failures,
            )

            async with async_session() as session:
                await measurement_service.run_test(session, manual=False)

            # Test succeeded!
            if self._outage_active:
                # Outage resolved
                duration_seconds = 0.0
                if self._outage_started_at:
                    duration_seconds = (
                        datetime.now(timezone.utc) - self._outage_started_at
                    ).total_seconds()
                logger.info(
                    "OUTAGE RESOLVED after %d failures (duration: %.0f seconds)",
                    self._consecutive_failures,
                    duration_seconds,
                )
                self._publish_outage_event(
                    "outage_resolved",
                    f"Internet restored after {self._consecutive_failures} failed tests "
                    f"({duration_seconds / 60:.1f} minutes outage)",
                )
                self._outage_active = False
                self._outage_started_at = None
            elif self._consecutive_failures > 0:
                logger.info(
                    "Test succeeded after %d failure(s)", self._consecutive_failures
                )

            # Reset failure tracking
            self._consecutive_failures = 0
            self._last_failure_message = ""

        except Exception as e:
            self._consecutive_failures += 1
            self._last_failure_message = str(e)
            logger.error(
                "Speed test failed (%d/%d): %s",
                self._consecutive_failures,
                MAX_CONSECUTIVE_FAILURES,
                e,
            )

            if self._consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                if not self._outage_active:
                    # Outage confirmed!
                    self._outage_active = True
                    self._outage_started_at = datetime.now(timezone.utc)
                    logger.warning(
                        "OUTAGE DETECTED: %d consecutive test failures. Error: %s",
                        self._consecutive_failures,
                        e,
                    )
                    self._publish_outage_event(
                        "outage_detected",
                        f"Internet outage: {self._consecutive_failures} consecutive failures. "
                        f"Last error: {e}",
                    )
                # During active outage, continue with normal schedule
                # (don't spam retries, just wait for next scheduled test)
            else:
                # Schedule a quick retry in 1 minute
                logger.info(
                    "Scheduling retry in %d seconds (attempt %d/%d)",
                    RETRY_DELAY_SECONDS,
                    self._consecutive_failures + 1,
                    MAX_CONSECUTIVE_FAILURES,
                )
                self._retry_pending = True
                asyncio.get_event_loop().call_later(
                    RETRY_DELAY_SECONDS,
                    lambda: asyncio.create_task(self._run_test_with_retry(is_retry=True)),
                )
        finally:
            self._test_in_progress = False

    async def _run_scheduled_test(self) -> None:
        """Entry point for scheduled tests."""
        # Skip if a retry is pending (let the retry handle it)
        if self._retry_pending:
            logger.debug("Retry pending, skipping scheduled test")
            return
        await self._run_test_with_retry(is_retry=False)

    def start(self) -> None:
        self._scheduler = AsyncIOScheduler()
        self._scheduler.add_job(
            self._run_scheduled_test,
            "interval",
            minutes=settings.test_interval_minutes,
            id="speedtest",
            max_instances=1,
            misfire_grace_time=120,
        )
        self._scheduler.start()
        logger.info(
            "Scheduler started: running every %d minutes",
            settings.test_interval_minutes,
        )

    def stop(self) -> None:
        if self._scheduler and self._scheduler.running:
            self._scheduler.shutdown(wait=True)
            logger.info("Scheduler stopped")

    def reschedule(self, interval_minutes: int) -> None:
        if self._scheduler and self._scheduler.running:
            self._scheduler.reschedule_job(
                "speedtest",
                trigger="interval",
                minutes=interval_minutes,
            )
            logger.info("Scheduler rescheduled: every %d minutes", interval_minutes)


scheduler_service = SchedulerService()
