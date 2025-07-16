# /backend/schemas/itinerary_schemas.py (Complete File)

from pydantic import BaseModel, Field, field_validator, model_validator, ValidationInfo
from typing import List, Optional, Dict, Any, Literal, Tuple # <<< ADD Tuple
from datetime import datetime, time as dt_time, timedelta, timezone as dt_timezone

from core.constants import DEFAULT_TRAVEL_MODE

# --- Weather Schemas ---
class WeatherCondition(BaseModel):
    description: str
    icon_char: str

class WeatherForecast(BaseModel):
    temperature_celsius: float
    feels_like_celsius: float
    precipitation_probability_percent: int
    wind_speed_kmh: float
    condition: WeatherCondition
    raw_code: int
    is_day: Optional[int] = None
    time_of_day_descriptor: Optional[str] = None
    ai_weather_sentence: Optional[str] = None


# --- Itinerary Core Schemas ---
class ItineraryRequest(BaseModel):
    location: Optional[str] = None
    start_lat: Optional[float] = None
    start_lon: Optional[float] = None
    budget: float = Field(..., ge=0)
    selected_preferences: Optional[List[str]] = Field(default_factory=list)
    custom_trip_description: Optional[str] = None
    start_datetime: str
    end_datetime: str
    exclude_osm_ids: Optional[List[int]] = Field(default_factory=list)
    must_include_osm_ids: Optional[List[int]] = Field(default_factory=list)
    surprise_me: Optional[bool] = False
    travel_mode: Optional[Literal["driving", "walking", "bicycling", "transit"]] = Field(default=DEFAULT_TRAVEL_MODE)

    @field_validator('start_datetime', 'end_datetime', mode='before')
    @classmethod
    def check_datetime_format(cls, v: Any, info: ValidationInfo) -> str:
        if not isinstance(v, str):
            raise ValueError(f"Field '{info.field_name}': must be a string")
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError as e:
            raise ValueError(f"Field '{info.field_name}': Invalid ISO 8601 format for datetime '{v}'. Error: {e}")

    @model_validator(mode='after')
    def check_location_or_coords_present(self) -> 'ItineraryRequest':
        is_text_location_valid = self.location and self.location.strip() and not self.location.startswith("[Lat:")
        are_coords_valid = self.start_lat is not None and self.start_lon is not None
        if not is_text_location_valid and not are_coords_valid:
            raise ValueError("Either 'location' text (not coordinate string) or 'start_lat'/'start_lon' must be provided.")
        return self

    @model_validator(mode='after')
    def check_datetimes_logic(self) -> 'ItineraryRequest':
        try:
            start = datetime.fromisoformat(self.start_datetime.replace('Z', '+00:00')).astimezone(dt_timezone.utc)
            end = datetime.fromisoformat(self.end_datetime.replace('Z', '+00:00')).astimezone(dt_timezone.utc)
        except ValueError as e:
            raise ValueError(f"Invalid datetime value provided: {e}")
        if end <= start:
            raise ValueError("End datetime must be strictly after start datetime.")
        if (end - start) > timedelta(days=7):
            raise ValueError("Trip duration cannot exceed 7 days.")
        return self

class ItineraryItem(BaseModel):
    leg_type: Literal['TRAVEL', 'ACTIVITY', 'BREAK']
    activity: str
    osm_id: Optional[int] = None
    place_id: Optional[str] = None
    estimated_duration_hrs: float
    estimated_cost_inr: Optional[float] = Field(default=0.0)
    matched_preferences: Optional[List[str]] = None
    food_type: Optional[Literal['meal', 'snack', 'dessert']] = None
    specific_amenity: Optional[str] = None
    estimated_arrival: Optional[datetime] = None
    estimated_departure: Optional[datetime] = None
    description: Optional[str] = None
    ai_insight: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    distance_km: Optional[float] = None
    # +++ MODIFIED THIS LINE +++
    overview_polyline: Optional[List[Tuple[float, float]]] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    opening_hours_today: Optional[str] = None
    business_status: Optional[str] = None
    foodie_classification: Optional[str] = None
    shopping_classification: Optional[str] = None

class ItineraryResponse(BaseModel):
    trip_uuid: Optional[str] = None
    start_lat: Optional[float] = None
    start_lon: Optional[float] = None
    itinerary: List[ItineraryItem]
    total_estimated_cost: float
    custom_heading: Optional[str] = None
    notes: Optional[str] = None
    weather_info: Optional[WeatherForecast] = None


# --- Serendipity & Helper Schemas ---
class SerendipityRequest(BaseModel):
    current_itinerary: List[ItineraryItem]
    original_request_details: ItineraryRequest
    excluded_serendipity_ids: Optional[List[str]] = Field(default_factory=list)

class SerendipityResponse(BaseModel):
    suggestion_id: str
    suggested_activity: ItineraryItem
    actionable_text: str
    replaces_activity_osm_id: Optional[int] = None
    time_extension_minutes: Optional[float] = None

class ActivityTimeViability(BaseModel):
    is_viable: bool
    adjusted_arrival_utc: Optional[datetime] = None
    adjusted_departure_utc: Optional[datetime] = None
    adjusted_activity_duration_hrs: Optional[float] = None
    wait_time_hrs: float = 0.0
    reason: Optional[str] = None

class ItineraryInsertionRequest(BaseModel):
    current_itinerary: List[ItineraryItem]
    new_activity: ItineraryItem
    original_request: ItineraryRequest
    current_heading: Optional[str] = None
    current_weather: Optional[WeatherForecast] = None


# --- Trip Management Schemas ---
class UserTripPydantic(BaseModel):
    id: int
    trip_uuid: str
    user_id: int
    original_request_details: Dict[str, Any]
    generated_itinerary_response: Dict[str, Any]
    trip_title: Optional[str] = None
    location_display_name: Optional[str] = None
    trip_start_datetime_utc: datetime
    trip_end_datetime_utc: datetime
    status: str
    created_at: datetime
    marked_completed_at: Optional[datetime] = None
    updated_at: datetime
    memory_snapshot_text: Optional[str] = None

    class Config:
        from_attributes = True

class TripListResponse(BaseModel):
    trips: List[UserTripPydantic]
    total_trips: int # Added total count
    page: int
    page_size: int


class MemorySnapshotResponse(BaseModel):
    trip_uuid: str
    memory_snapshot_text: Optional[str] = None
    message: Optional[str] = None

class TripCompletionStatus(BaseModel):
    trip_uuid: str
    status: str
    marked_completed_at: Optional[datetime] = None
    message: str