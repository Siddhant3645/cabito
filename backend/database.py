# /backend/database.py
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
# --- MODIFIED CODE START ---
# Removed 'declarative_base' from this import
from sqlalchemy.orm import sessionmaker
# --- MODIFIED CODE END ---
from typing import AsyncGenerator

from core.config import settings # Import our centralized settings
# --- MODIFIED CODE START ---
# Import Base from our new, separate file
from db_base import Base
# --- MODIFIED CODE END ---

# Use the DATABASE_URL from our settings object
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# --- MODIFIED CODE START ---
# This line has been removed from here and moved to db_base.py
# Base = declarative_base()
# --- MODIFIED CODE END ---

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

async def create_db_and_tables():
    """
    Initializes the database and creates tables based on the models.
    NOTE: In production, this should be handled by a migration tool like Alembic.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)