# /backend/api/users.py
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import get_password_hash, verify_password
from crud import user_crud
from database import get_db
from models.all_models import UserAccount
from schemas.user_schemas import (ChangePasswordRequest, DeleteAccountRequest,
                                  GenericSuccessResponse, TokenData,
                                  UserPublic)

router = APIRouter()

# --- Authentication Dependency ---
# This dependency will be used by all protected endpoints across the application.
# It decodes the JWT from the request header and retrieves the corresponding user.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

async def get_current_active_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> UserAccount:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = await user_crud.get_user_by_email(db=db, email=token_data.email)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return user


# --- User Management Endpoints ---

@router.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: UserAccount = Depends(get_current_active_user)):
    """
    Fetch the details for the currently authenticated user.
    """
    return current_user


@router.post("/users/me/change-password", response_model=GenericSuccessResponse)
async def change_user_password(
    request_data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_active_user)
):
    """
    Change the current user's password after verifying their old password.
    """
    if not verify_password(request_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password.")
    
    current_user.hashed_password = get_password_hash(request_data.new_password)
    db.add(current_user)
    await db.commit()
    
    return GenericSuccessResponse(message="Password changed successfully.")


@router.post("/users/me/delete-account", response_model=GenericSuccessResponse)
async def delete_user_account(
    request_data: DeleteAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_active_user)
):
    """
    Soft-deletes the current user's account after verifying their password.
    Anonymizes user data.
    """
    if not verify_password(request_data.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password. Account deletion failed.")

    # Anonymize user data and mark as inactive
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}_{int(time.time())}_{current_user.email}"
    current_user.hashed_password = get_password_hash(str(uuid.uuid4())) # Set a random, unusable password
    
    db.add(current_user)
    await db.commit()
    
    return GenericSuccessResponse(message="Account has been successfully deleted.")