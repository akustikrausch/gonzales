from apscheduler.schedulers.asyncio import AsyncIOScheduler

from gonzales.config import settings
from gonzales.core.logging import logger
from gonzales.db.engine import async_session
from gonzales.services.measurement_service import measurement_service


class SchedulerService:
    def __init__(self) -> None:
        self._scheduler: AsyncIOScheduler | None = None

    @property
    def scheduler(self) -> AsyncIOScheduler | None:
        return self._scheduler

    @property
    def running(self) -> bool:
        return self._scheduler is not None and self._scheduler.running

    @property
    def next_run_time(self):
        if not self._scheduler or not self._scheduler.running:
            return None
        jobs = self._scheduler.get_jobs()
        if jobs:
            return jobs[0].next_run_time
        return None

    async def _run_scheduled_test(self) -> None:
        logger.info("Scheduler: running scheduled speed test")
        try:
            async with async_session() as session:
                await measurement_service.run_test(session, manual=False)
        except Exception as e:
            logger.error("Scheduled test failed: %s", e)

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
