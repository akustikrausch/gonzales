from collections.abc import AsyncGenerator
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from gonzales.db.base import Base
from gonzales.db.models import Measurement

# In-memory async SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite://"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test and drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as s:
        yield s


@pytest.fixture
def make_measurement():
    """Factory for creating Measurement model instances with sensible defaults."""
    _counter = 0

    def _make(
        download_mbps: float = 500.0,
        upload_mbps: float = 250.0,
        ping_latency_ms: float = 12.0,
        ping_jitter_ms: float = 2.0,
        timestamp: datetime | None = None,
        server_id: int = 1,
        server_name: str = "Test Server",
        **kwargs,
    ) -> Measurement:
        nonlocal _counter
        _counter += 1
        return Measurement(
            download_bps=download_mbps * 1_000_000 / 8,
            upload_bps=upload_mbps * 1_000_000 / 8,
            download_mbps=download_mbps,
            upload_mbps=upload_mbps,
            ping_latency_ms=ping_latency_ms,
            ping_jitter_ms=ping_jitter_ms,
            packet_loss_pct=kwargs.get("packet_loss_pct", 0.0),
            isp=kwargs.get("isp", "Test ISP"),
            server_id=server_id,
            server_name=server_name,
            server_location=kwargs.get("server_location", "Berlin"),
            server_country=kwargs.get("server_country", "DE"),
            internal_ip=kwargs.get("internal_ip", "192.168.1.1"),
            external_ip=kwargs.get("external_ip", "1.2.3.4"),
            interface_name=kwargs.get("interface_name", "eth0"),
            is_vpn=kwargs.get("is_vpn", False),
            result_id=kwargs.get("result_id", f"test-{_counter}"),
            result_url=kwargs.get("result_url", f"https://speedtest.net/result/{_counter}"),
            raw_json=kwargs.get("raw_json", "{}"),
            below_download_threshold=kwargs.get("below_download_threshold", False),
            below_upload_threshold=kwargs.get("below_upload_threshold", False),
            timestamp=timestamp or datetime.now(timezone.utc),
        )

    return _make


@pytest.fixture
async def app(session):
    """Create a FastAPI test app with overridden DB dependency."""
    from fastapi import FastAPI

    from gonzales.api.dependencies import get_db
    from gonzales.api.router import api_router
    from gonzales.core.security import configure_security

    test_app = FastAPI()
    configure_security(test_app)
    test_app.include_router(api_router)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestSessionLocal() as s:
            yield s

    test_app.dependency_overrides[get_db] = override_get_db
    return test_app


@pytest.fixture
async def client(app):
    """httpx AsyncClient for API testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://localhost",
    ) as c:
        yield c
