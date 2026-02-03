import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from gonzales.config import settings
from gonzales.db.base import Base

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def run_migrations(conn) -> None:
    """Run schema migrations for existing databases."""
    # Get existing columns in measurements table
    result = await conn.execute(text("PRAGMA table_info(measurements)"))
    existing_columns = {row[1] for row in result.fetchall()}

    # Migrations for measurements table
    migrations = [
        ("download_bytes", "ALTER TABLE measurements ADD COLUMN download_bytes INTEGER NOT NULL DEFAULT 0"),
        ("upload_bytes", "ALTER TABLE measurements ADD COLUMN upload_bytes INTEGER NOT NULL DEFAULT 0"),
    ]

    for column_name, sql in migrations:
        if column_name not in existing_columns:
            logger.info(f"Adding missing column: {column_name}")
            await conn.execute(text(sql))


async def init_db() -> None:
    async with engine.begin() as conn:
        # Create new tables
        await conn.run_sync(Base.metadata.create_all)

        # Run migrations for existing tables
        await run_migrations(conn)

        # SQLite optimizations
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        await conn.execute(text("PRAGMA busy_timeout=5000"))
        await conn.execute(text("PRAGMA cache_size=-65536"))


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def dispose_engine() -> None:
    await engine.dispose()
