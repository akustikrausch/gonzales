from datetime import datetime

from sqlalchemy import asc, delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.db.models import Measurement, TestFailure


class MeasurementRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, measurement: Measurement) -> Measurement:
        self.session.add(measurement)
        await self.session.commit()
        await self.session.refresh(measurement)
        return measurement

    async def get_by_id(self, measurement_id: int) -> Measurement | None:
        result = await self.session.execute(
            select(Measurement).where(Measurement.id == measurement_id)
        )
        return result.scalar_one_or_none()

    async def get_latest(self) -> Measurement | None:
        result = await self.session.execute(
            select(Measurement).order_by(desc(Measurement.timestamp)).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        sort_by: str = "timestamp",
        sort_order: str = "desc",
    ) -> tuple[list[Measurement], int]:
        query = select(Measurement)
        count_query = select(func.count(Measurement.id))

        if start_date:
            query = query.where(Measurement.timestamp >= start_date)
            count_query = count_query.where(Measurement.timestamp >= start_date)
        if end_date:
            query = query.where(Measurement.timestamp <= end_date)
            count_query = count_query.where(Measurement.timestamp <= end_date)

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        column = getattr(Measurement, sort_by, Measurement.timestamp)
        order_fn = asc if sort_order == "asc" else desc
        query = (
            query.order_by(order_fn(column))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(query)
        measurements = list(result.scalars().all())

        return measurements, total

    async def get_all_in_range(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[Measurement]:
        query = select(Measurement)
        if start_date:
            query = query.where(Measurement.timestamp >= start_date)
        if end_date:
            query = query.where(Measurement.timestamp <= end_date)
        query = query.order_by(Measurement.timestamp)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def delete_by_id(self, measurement_id: int) -> bool:
        result = await self.session.execute(
            delete(Measurement).where(Measurement.id == measurement_id)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def count(self) -> int:
        result = await self.session.execute(select(func.count(Measurement.id)))
        return result.scalar_one()

    async def get_statistics(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> dict:
        query = select(
            func.count(Measurement.id).label("total_tests"),
            func.min(Measurement.download_mbps).label("min_download"),
            func.max(Measurement.download_mbps).label("max_download"),
            func.avg(Measurement.download_mbps).label("avg_download"),
            func.min(Measurement.upload_mbps).label("min_upload"),
            func.max(Measurement.upload_mbps).label("max_upload"),
            func.avg(Measurement.upload_mbps).label("avg_upload"),
            func.min(Measurement.ping_latency_ms).label("min_ping"),
            func.max(Measurement.ping_latency_ms).label("max_ping"),
            func.avg(Measurement.ping_latency_ms).label("avg_ping"),
            func.sum(
                func.cast(Measurement.below_download_threshold, __import__("sqlalchemy").Integer)
            ).label("download_violations"),
            func.sum(
                func.cast(Measurement.below_upload_threshold, __import__("sqlalchemy").Integer)
            ).label("upload_violations"),
        )

        if start_date:
            query = query.where(Measurement.timestamp >= start_date)
        if end_date:
            query = query.where(Measurement.timestamp <= end_date)

        result = await self.session.execute(query)
        row = result.one()
        return dict(row._mapping)


class TestFailureRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, failure: TestFailure) -> TestFailure:
        self.session.add(failure)
        await self.session.commit()
        await self.session.refresh(failure)
        return failure

    async def get_recent(self, limit: int = 10) -> list[TestFailure]:
        result = await self.session.execute(
            select(TestFailure).order_by(desc(TestFailure.timestamp)).limit(limit)
        )
        return list(result.scalars().all())
