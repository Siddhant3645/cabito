# /backend/crud/user_crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.all_models import UserAccount
from schemas.user_schemas import UserCreate
from core.security import get_password_hash


async def get_user_by_email(db: AsyncSession, email: str) -> UserAccount | None:
    """
    Fetches a user from the database by their email address.

    Args:
        db: The SQLAlchemy asynchronous session.
        email: The email address of the user to fetch.

    Returns:
        The UserAccount object if found, otherwise None.
    """
    result = await db.execute(select(UserAccount).filter(UserAccount.email == email.lower()))
    return result.scalars().first()


async def create_user(db: AsyncSession, user_create: UserCreate) -> UserAccount:
    """
    Creates a new user object in preparation for database insertion.
    This function does not commit the transaction.

    Args:
        db: The SQLAlchemy asynchronous session.
        user_create: The Pydantic schema containing new user data.

    Returns:
        The newly created UserAccount SQLAlchemy object.
    """
    hashed_password = get_password_hash(user_create.password)
    
    db_user = UserAccount(
        email=user_create.email.lower(),
        hashed_password=hashed_password,
        is_active=True # Users are active by default on creation
    )
    
    db.add(db_user)
    
    # The commit is handled by the calling function in the API layer.
    # This allows this function to be part of larger transactions if needed.
    return db_user