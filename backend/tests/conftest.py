import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from ..main import app
from ..database import Base, get_db

# Use an in-memory SQLite database for testing
ASYNC_SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(ASYNC_SQLALCHEMY_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Fixture that creates a test client that properly handles the
    application's lifespan events (startup/shutdown).
    """
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Override the database dependency
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestingSessionLocal() as session:
            yield session
    app.dependency_overrides[get_db] = override_get_db

    # This ensures that startup events are run before tests.
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client

    # Drop database tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    # Clean up the dependency override
    app.dependency_overrides.clear()