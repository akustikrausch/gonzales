from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from gonzales.config import settings
from gonzales.db.base import Base

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            __import__("sqlalchemy").text("PRAGMA journal_mode=WAL")
        )
        await conn.execute(
            __import__("sqlalchemy").text("PRAGMA busy_timeout=5000")
        )
        await conn.execute(
            __import__("sqlalchemy").text("PRAGMA cache_size=-65536")
        )


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def dispose_engine() -> None:
    await engine.dispose()
