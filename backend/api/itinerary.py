# /backend/api/itinerary.py
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas import itinerary_schemas
from ..database import get_db
from ..models.all_models import UserAccount
from ..services import itinerary_service
from .users import get_current_active_user

from fastapi_cache.decorator import cache
from ..core.limiter import limiter

router = APIRouter()


@router.post(
    "/generate-itinerary",
    response_model=itinerary_schemas.ItineraryResponse,
    summary="Generate a New Itinerary",
    status_code=status.HTTP_200_OK
)
@limiter.limit("10/hour")
@cache(expire=3600) # Cache successful requests for 1 hour
async def generate_itinerary_endpoint(
    payload: itinerary_schemas.ItineraryRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_active_user),
):
    """
    Receives user preferences and generates a new travel itinerary.
    This endpoint gathers all necessary clients from the app state and
    passes them to the core itinerary building service.
    """
    http_client = request.app.state.httpx_client
    gmaps_client = request.app.state.gmaps_client
    gemini_model = request.app.state.gemini_model

    return await itinerary_service.build_itinerary(
        payload=payload,
        db=db,
        current_user=current_user,
        http_client=http_client,
        gmaps_client=gmaps_client,
        gemini_model=gemini_model
    )


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
    Returns a 204 No Content status if no suitable suggestion is found.
    """
    http_client = request.app.state.httpx_client
    gmaps_client = request.app.state.gmaps_client
    gemini_model = request.app.state.gemini_model

    suggestion = await itinerary_service.get_serendipity_suggestion(
        payload=payload,
        current_user=current_user,
        http_client=http_client,
        gmaps_client=gmaps_client,
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
    db: AsyncSession = Depends(get_db), # +++ Add DB session
    current_user: UserAccount = Depends(get_current_active_user),
):
    """
    Intelligently inserts a new activity into an existing itinerary plan.
    """
    # +++ FIX: Pass all required clients to the service layer +++
    http_client = request.app.state.httpx_client
    gmaps_client = request.app.state.gmaps_client
    gemini_model = request.app.state.gemini_model # Pass gemini for potential AI insights

    return await itinerary_service.insert_activity_into_itinerary(
        payload=payload,
        db=db, # Pass DB session
        http_client=http_client,
        gmaps_client=gmaps_client,
        gemini_model=gemini_model,
        current_user=current_user, # Pass user for saving the updated trip
    )