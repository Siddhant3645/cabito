# /backend/database.py
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator

from core.config import settings # Import our centralized settings

# Use the DATABASE_URL from our settings object
engine = create_async_engine(settings.DATABASE_URL, echo=False) # 'echo' is noisy, better to turn off by default

# Base class for our declarative model definitions
Base = declarative_base()

# Import all the models here so that Base has them registered
# This is crucial for tools like Alembic and for create_db_and_tables to work
from models.all_models import UserAccount, UserInteraction, LearnedUserProfile, UserTrip

# Create a sessionmaker for creating AsyncSession instances
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# --- REVISED get_db dependency ---
# This is the corrected version without the automatic commit.
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a SQLAlchemy asynchronous session.
    Ensures the session is always rolled back on error.
    The commit must be handled explicitly by the calling function.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        # 'finally' with close() is not needed as 'async with' handles it.


async def create_db_and_tables():
    """
    Initializes the database and creates tables based on the models.
    NOTE: In production, this should be handled by a migration tool like Alembic.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)