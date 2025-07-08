# /backend/models/all_models.py
import enum
import uuid
from datetime import datetime, timezone as dt_timezone
from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Text,
                        ForeignKey, JSON, Enum as SAEnum, Float)
from sqlalchemy.orm import relationship

# Update the import to be relative to the new file location
from database import Base

# --- Enums for Database ---
class InteractionTypeEnum(str, enum.Enum):
    GENERATED_ITINERARY = "generated_itinerary"
    COMPLETED_ACTIVITY = "completed_activity"
    SKIPPED_ACTIVITY = "skipped_activity"
    RATED_ACTIVITY_UP = "rated_activity_up"
    RATED_ACTIVITY_DOWN = "rated_activity_down"
    CHOSE_THEME = "chose_theme"
    REJECTED_SUGGESTION = "rejected_suggestion"
    SERENDIPITY_SUGGESTION_SHOWN = "serendipity_suggestion_shown"
    SERENDIPITY_SUGGESTION_ACCEPTED = "serendipity_suggestion_accepted"
    SERENDIPITY_SUGGESTION_REJECTED = "serendipity_suggestion_rejected"
    SERENDIPITY_SUGGESTIONS_DISABLED = "serendipity_suggestions_disabled"

# --- SQLAlchemy Table Models ---
class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), onupdate=lambda: datetime.now(dt_timezone.utc), nullable=False)

    # Relationships
    interactions = relationship("UserInteraction", back_populates="user", cascade="all, delete-orphan")
    learned_profiles = relationship("LearnedUserProfile", back_populates="user", cascade="all, delete-orphan")
    trips = relationship("UserTrip", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UserAccount(id={self.id}, email='{self.email}')>"


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_accounts.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False, index=True)
    interaction_type = Column(SAEnum(InteractionTypeEnum, name="interaction_type_enum"), nullable=False)
    osm_id = Column(Integer, nullable=True, index=True) 
    related_preference_key = Column(String, nullable=True) 
    session_id = Column(String, nullable=True, index=True) 
    details = Column(JSON, nullable=True)

    user = relationship("UserAccount", back_populates="interactions")

    def __repr__(self):
        return f"<UserInteraction(id={self.id}, user_id={self.user_id}, type='{self.interaction_type.value if isinstance(self.interaction_type, enum.Enum) else self.interaction_type}')>"


class LearnedUserProfile(Base):
    __tablename__ = "learned_user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_accounts.id"), nullable=False, index=True)
    profile_key = Column(String, nullable=False, index=True) 
    score = Column(Float, default=0.0, nullable=False)
    confidence = Column(Float, default=0.0, nullable=False)
    interaction_count = Column(Integer, default=0, nullable=False)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), onupdate=lambda: datetime.now(dt_timezone.utc), nullable=False)

    user = relationship("UserAccount", back_populates="learned_profiles")

    def __repr__(self):
        return f"<LearnedUserProfile(user_id={self.user_id}, key='{self.profile_key}', score={self.score})>"


class UserTrip(Base):
    __tablename__ = "user_trips"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4())) 
    user_id = Column(Integer, ForeignKey("user_accounts.id"), nullable=False, index=True)
    original_request_details = Column(JSON, nullable=False) 
    generated_itinerary_response = Column(JSON, nullable=False) 
    trip_title = Column(String, nullable=True) 
    location_display_name = Column(String, nullable=True)
    trip_start_datetime_utc = Column(DateTime(timezone=True), nullable=False)
    trip_end_datetime_utc = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="generated", nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), nullable=False)
    marked_completed_at = Column(DateTime(timezone=True), nullable=True) 
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(dt_timezone.utc), onupdate=lambda: datetime.now(dt_timezone.utc), nullable=False)
    memory_snapshot_text = Column(Text, nullable=True)

    user = relationship("UserAccount", back_populates="trips")

    def __repr__(self):
        return f"<UserTrip(id={self.id}, trip_uuid='{self.trip_uuid}', user_id={self.user_id}, title='{self.trip_title}')>"