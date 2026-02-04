"""CLI utility functions for async operations and database access."""

import asyncio
from collections.abc import Callable, Coroutine
from functools import wraps
from typing import Any, ParamSpec, TypeVar

from gonzales.db.engine import async_session, init_db

P = ParamSpec("P")
R = TypeVar("R")


def run_async(func: Callable[P, Coroutine[Any, Any, R]]) -> Callable[P, R]:
    """Decorator to run async functions in sync CLI context."""

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return asyncio.run(func(*args, **kwargs))

    return wrapper


async def with_db_session(coro_func: Callable) -> Any:
    """Execute a coroutine with a database session."""
    await init_db()
    async with async_session() as session:
        return await coro_func(session)
