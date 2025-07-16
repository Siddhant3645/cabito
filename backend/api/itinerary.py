# /backend/api/itinerary.py (Complete File)

from fastapi import APIRouter, Depends, Request, Response, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from schemas import itinerary_schemas
from database import get_db
from models.all_models import UserAccount
from services import itinerary_service, location_service # <<< ADD location_service
from api.users import get_current_active_user

from fastapi_cache.decorator import cache
from core.limiter import limiter

router = APIRouter()


@router.post(
    "/generate-itinerary",
    response_model=itinerary_schemas.ItineraryResponse,
    summary="Generate a New Itinerary",
    status_code=status.HTTP_200_OK
)
@limiter.limit("10/hour")
@cache(expire=3600)
async def generate_itinerary_endpoint(
    payload: itinerary_schemas.ItineraryRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_active_user),
):
    """
    Receives user preferences and generates a new travel itinerary.
    """
    http_client = request.app.state.httpx_client
    # gmaps_client = request.app.state.gmaps_client # <<< REMOVE THIS LINE
    gemini_model = request.app.state.gemini_model

    return await itinerary_service.build_itinerary(
        payload=payload,
        db=db,
        current_user=current_user,
        http_client=http_client,
        gemini_model=gemini_model
    )

# +++ NEW ENDPOINT +++
@router.get(
    "/reverse-geocode",
    response_model=Dict[str, Any],
    summary="Reverse Geocode Coordinates to Address"
)
async def reverse_geocode(
    request: Request,
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Converts latitude and longitude coordinates into a human-readable address
    using the Nominatim service.
    """
    http_client = request.app.state.httpx_client
    address_details = await location_service.reverse_geocode_coords(lat, lon, http_client)
    return address_details


@router.post(
    "/serendipity-suggestion",
    response_model=itinerary_schemas.SerendipityResponse,
    summary="Get a Serendipity Suggestion",
    status_code=status.HTTP_200_OK 
)
async def get_serendipity_suggestion_endpoint(
    payload: itinerary_schemas.SerendipityRequest,
    request: Request,
    current_user: UserAccount = Depends(get_current_active_user),
):
    """
    Provides a spontaneous suggestion to add to an existing itinerary plan.
    """
    http_client = request.app.state.httpx_client
    # gmaps_client = request.app.state.gmaps_client # <<< REMOVE THIS LINE
    gemini_model = request.app.state.gemini_model

    suggestion = await itinerary_service.get_serendipity_suggestion(
        payload=payload,
        current_user=current_user,
        http_client=http_client,
        # gmaps_client=gmaps_client, # <<< REMOVE THIS ARGUMENT
        gemini_model=gemini_model
    )
    
    if suggestion is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    
    return suggestion


@router.post(
    "/insert-activity",
    response_model=itinerary_schemas.ItineraryResponse,
    summary="Insert an Activity into an Itinerary"
)
async def insert_activity_endpoint(
    payload: itinerary_schemas.ItineraryInsertionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_active_user),
):
    """
    Intelligently inserts a new activity into an existing itinerary plan.
    """
    http_client = request.app.state.httpx_client
    # gmaps_client = request.app.state.gmaps_client # <<< REMOVE THIS LINE
    gemini_model = request.app.state.gemini_model

    return await itinerary_service.insert_activity_into_itinerary(
        payload=payload,
        db=db,
        http_client=http_client,
        # gmaps_client=gmaps_client, # <<< REMOVE THIS ARGUMENT
        gemini_model=gemini_model,
        current_user=current_user,
    )