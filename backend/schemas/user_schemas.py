# /backend/schemas/user_schemas.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import uuid

# --- Token Schemas ---
# For returning a JWT token to the client.
class Token(BaseModel):
    access_token: str
    token_type: str

# For decoding the data contained within a JWT token.
class TokenData(BaseModel):
    email: Optional[str] = None


# --- User Schemas ---
# The base user model, containing shared attributes.
class UserBase(BaseModel):
    email: EmailStr

# Schema for creating a new user. Inherits from UserBase and adds the password.
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User password, must be at least 8 characters.")

# Schema for returning user data to the client. Excludes sensitive data like the password.
class UserPublic(BaseModel):
    # --- MODIFIED CODE START ---
    # Changed the ID type from UUID to a simple string to match the new format.
    id: str
    # --- MODIFIED CODE END ---
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True


# --- Account Management Schemas ---
# Schema for the change password endpoint.
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# Schema for the delete account endpoint.
class DeleteAccountRequest(BaseModel):
    password: str

# A generic response model for successful actions that only require a message.
class GenericSuccessResponse(BaseModel):
    message: str