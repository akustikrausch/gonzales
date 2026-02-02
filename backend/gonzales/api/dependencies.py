from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from gonzales.db.engine import get_session


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session
