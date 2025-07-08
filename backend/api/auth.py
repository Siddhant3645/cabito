# /backend/api/auth.py (Corrected for Refresh Tokens)

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from jose import jwt, JWTError
from typing import Optional # +++ This import was missing +++

from database import get_db
from crud import user_crud
from models.all_models import UserAccount
from schemas.user_schemas import UserCreate, UserPublic, Token
from core.security import create_access_token, create_refresh_token, verify_password
from core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
):
    """
    Handles the user registration request.
    It delegates database interactions to the CRUD layer.
    """
    existing_user = await user_crud.get_user_by_email(db=db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    
    try:
        user = await user_crud.create_user(db=db, user_create=user_in)
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )


@router.post("/token", response_model=Token)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    """
    Handles user login, returns a short-lived access token in the body,
    and sets a long-lived refresh token in an HttpOnly cookie.
    """
    user = await user_crud.get_user_by_email(db=db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite='lax',
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        secure=True, 
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Issues a new access token using the refresh token from the cookie.
    """
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
    )
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_crud.get_user_by_email(db, email=email)
    if user is None or not user.is_active:
        raise credentials_exception
    
    new_access_token = create_access_token(data={"sub": user.email})
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(response: Response):
    """Clears the refresh token cookie upon logout."""
    response.delete_cookie("refresh_token")
    return {"message": "Logout successful"}