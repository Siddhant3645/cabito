# /backend/services/location_service.py (Complete File with Commented-Out Google Logic)

import asyncio
import functools
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Tuple, List
from urllib.parse import quote_plus

import googlemaps # <<< KEPT FOR COMMENTED OUT LOGIC
import httpx
import polyline
import wikipedia
from wikipedia.exceptions import DisambiguationError, PageError

from core.config import settings
from core.constants import OVERPASS_API_URL, OVERPASS_TIMEOUT, WIKI_LOOKUP_TIMEOUT

logger = logging.getLogger(__name__)

class LocationServiceError(Exception):
    """Custom exception for errors within the location service."""
    pass

APP_VERSION = getattr(settings, 'PROJECT_VERSION', "4.0.0")


# --- Geocoding/Reverse Geocoding (Nominatim, Unchanged) ---
async def geocode_location_text(location_text: str, http_client: httpx.AsyncClient) -> Dict[str, Any]:
    """Geocodes a location string using Nominatim. Raises LocationServiceError on failure."""
    if not http_client:
        raise LocationServiceError("HTTP client is not available.")
    try:
        nominatim_url = f"https://nominatim.openstreetmap.org/search?q={quote_plus(location_text)}&format=json&limit=1&addressdetails=1"
        response = await http_client.get(nominatim_url, headers={'User-Agent': f'CabitoApp/{APP_VERSION}'})
        response.raise_for_status()
        results = response.json()
        if results:
            return results[0]
        else:
            raise LocationServiceError(f"Location '{location_text}' could not be found.")
    except httpx.HTTPStatusError as e:
        logger.error(f"Nominatim HTTP error for '{location_text}': {e.response.status_code}")
        raise LocationServiceError("External location service is currently unavailable.") from e
    except Exception as e:
        logger.error(f"An unexpected geocoding error occurred for '{location_text}': {e}", exc_info=True)
        raise LocationServiceError("An unexpected error occurred during geocoding.") from e

async def reverse_geocode_coords(lat: float, lon: float, http_client: httpx.AsyncClient) -> Dict[str, Any]:
    """Reverse geocodes coordinates. Raises LocationServiceError on failure."""
    if not http_client:
        raise LocationServiceError("HTTP client is not available.")
    try:
        rev_geo_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1"
        response = await http_client.get(rev_geo_url, headers={'User-Agent': f'CabitoApp/{APP_VERSION}'})
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Reverse geocoding HTTP error for ({lat},{lon}): {e.response.status_code}")
        raise LocationServiceError("External reverse geocoding service is unavailable.") from e
    except Exception as e:
        logger.error(f"Reverse geocoding error for ({lat},{lon}): {e}", exc_info=True)
        raise LocationServiceError("An unexpected error occurred during reverse geocoding.") from e

# --- NEW HERE API FUNCTIONS ---
async def get_directions(
    http_client: httpx.AsyncClient,
    origin_coords: Tuple[float, float],
    destination_coords: Tuple[float, float],
    mode: str = "driving"
) -> Dict[str, Any]:
    """
    Fetches directions using the HERE Routing API v8.
    Decodes the polyline on the backend into a list of coordinates.
    """
    if not http_client:
        raise LocationServiceError("HTTP client is not available for HERE directions.")
    if not settings.HERE_API_KEY:
        raise LocationServiceError("HERE_API_KEY not configured.")

    transport_mode_map = {
        "driving": "car", "walking": "pedestrian", "bicycling": "bicycle", "transit": "publicTransport"
    }
    here_transport_mode = transport_mode_map.get(mode, "car")
    here_url = (
        f"https://router.hereapi.com/v8/routes"
        f"?origin={origin_coords[0]},{origin_coords[1]}"
        f"&destination={destination_coords[0]},{destination_coords[1]}"
        f"&transportMode={here_transport_mode}&return=polyline,summary&apiKey={settings.HERE_API_KEY}"
    )
    try:
        response = await http_client.get(here_url)
        response.raise_for_status()
        data = response.json()
        if not data.get("routes") or not data["routes"][0].get("sections"):
            raise LocationServiceError(f"No valid HERE route found between {origin_coords} and {destination_coords}.")
        
        section = data["routes"][0]["sections"][0]
        summary = section["summary"]
        
        encoded_polyline = section.get("polyline")
        decoded_polyline = polyline.decode(encoded_polyline)

        return {
            "distance_km": summary.get("length", 0) / 1000.0,
            "duration_hrs": summary.get("duration", 0) / 3600.0,
            "overview_polyline": decoded_polyline
        }

    except Exception as e:
        logger.error(f"HERE Directions API error: {e}", exc_info=True)
        raise LocationServiceError("An unexpected error occurred while calculating directions.") from e

async def get_place_details_by_name(
    http_client: httpx.AsyncClient, place_name: str, coords: Tuple[float, float]
) -> Optional[Dict[str, Any]]:
    """Fetches place details using the HERE Geocode & Search API (Discover endpoint)."""
    if not http_client or not place_name: return None
    if not settings.HERE_API_KEY: raise LocationServiceError("HERE_API_KEY not configured.")

    discover_url = (
        f"https://discover.search.hereapi.com/v1/discover"
        f"?q={quote_plus(place_name)}"
        f"&at={coords[0]},{coords[1]}"
        f"&limit=1&apiKey={settings.HERE_API_KEY}"
    )
    try:
        response = await http_client.get(discover_url)
        response.raise_for_status()
        data = response.json()
        if not data.get("items"): return None
        place = data["items"][0]
        return {
            "here_id": place.get("id"),
            "name": place.get("title"),
            "position": place.get("position"),
            "openingHours": place.get("openingHours"),
            "rating": None, "user_ratings_total": 0, "price_level": None 
        }
    except Exception as e:
        logger.warning(f"HERE Discover API error for '{place_name}': {e}")
        return None

# --- WIKIPEDIA & OSM HELPERS (UNCHANGED) ---
async def fetch_wikipedia_summary(place_name: str, wiki_title: Optional[str]) -> Optional[str]:
    """Fetches Wikipedia summary. Returns None if not found, raises on API error."""
    if not wiki_title:
        return None
    
    cleaned_title = wiki_title.split(':')[-1].strip().split('(')[0].strip()
    if not cleaned_title:
        return None
        
    logger.debug(f"Attempting Wikipedia lookup for: '{cleaned_title}'")
    try:
        loop = asyncio.get_running_loop()
        summary_func = functools.partial(wikipedia.summary, cleaned_title, sentences=2, auto_suggest=False, redirect=True)
        summary = await asyncio.wait_for(loop.run_in_executor(None, summary_func), timeout=WIKI_LOOKUP_TIMEOUT)
        return ' '.join(summary.split()) if isinstance(summary, str) and summary.strip() else None
    except (PageError, DisambiguationError):
        logger.info(f"Wikipedia page not found or ambiguous for title: '{cleaned_title}'")
        return None
    except Exception as e:
        logger.warning(f"Wikipedia lookup failed for '{cleaned_title}': {type(e).__name__}")
        raise LocationServiceError("Wikipedia service is currently unavailable.") from e

async def fetch_osm_element_details(osm_type: str, osm_id: int, http_client: httpx.AsyncClient) -> Optional[Dict[str, Any]]:
    """Fetches OSM element details. Returns None if not found, raises on API error."""
    if osm_type not in ["node", "way", "relation"] or not http_client:
        return None
    query = f"[out:json][timeout:{OVERPASS_TIMEOUT}];({osm_type}({osm_id}););out center;"
    try:
        response = await http_client.post(OVERPASS_API_URL, data=query, headers={'User-Agent': f'CabitoApp/{APP_VERSION}'})
        response.raise_for_status()
        data = response.json()
        if data.get("elements"):
            element = data["elements"][0]
            if element.get('type') == 'node':
                element['_lat'], element['_lon'] = element.get('lat'), element.get('lon')
            elif 'center' in element:
                element['_lat'], element['_lon'] = element['center'].get('lat'), element['center'].get('lon')
            return element
        return None
    except Exception as e:
        logger.error(f"OSM element fetch error for {osm_type}/{osm_id}: {e}")
        raise LocationServiceError("OSM data service is currently unavailable.") from e

# --- OLD GOOGLE MAPS PLATFORM FUNCTIONS (COMMENTED OUT FOR REFERENCE) ---
#
# async def get_google_directions(
#     gmaps_client: googlemaps.Client,
#     origin_coords: Tuple[float, float],
#     destination_coords: Tuple[float, float],
#     mode: str = "driving",
#     departure_time: Optional[datetime] = None
# ) -> Dict[str, Any]:
#     """Fetches directions. Raises LocationServiceError on failure."""
#     if not gmaps_client:
#         raise LocationServiceError("Google Maps client not provided for directions.")
#     try:
#         loop = asyncio.get_running_loop()
#         directions_result = await loop.run_in_executor(
#             None, functools.partial(gmaps_client.directions, origin=origin_coords, destination=destination_coords, mode=mode, departure_time=departure_time)
#         )
#         if not directions_result or not directions_result[0].get('legs'):
#             raise LocationServiceError(f"No valid route found between {origin_coords} and {destination_coords}.")
#         
#         leg = directions_result[0]['legs'][0]
#         duration_data = leg.get('duration_in_traffic', leg.get('duration', {}))
#         distance_meters = leg.get('distance', {}).get('value', 0)
#         duration_seconds = duration_data.get('value', 0)
#         
#         return {
#             "distance_km": distance_meters / 1000.0,
#             "duration_hrs": duration_seconds / 3600.0,
#             "overview_polyline": directions_result[0].get('overview_polyline', {}).get('points')
#         }
#     except Exception as e:
#         logger.error(f"Google Directions API error: {e}", exc_info=True)
#         raise LocationServiceError("Could not calculate directions.") from e
#
# async def find_google_place_id_by_name(gmaps_client: googlemaps.Client, place_name: str, coords: Tuple[float, float]) -> Optional[str]:
#     """Finds Google Place ID. Returns None if not found, raises on API error."""
#     if not gmaps_client or not place_name:
#         return None
#     try:
#         logger.debug(f"Executing Google Find Place search for '{place_name}'")
#         find_place_result = await asyncio.to_thread(
#             gmaps_client.find_place,
#             input=place_name,
#             input_type="textquery",
#             fields=["place_id"],
#             location_bias=f"circle:2000@{coords[0]},{coords[1]}"
#         )
#         if find_place_result and find_place_result.get('candidates'):
#             place_id = find_place_result['candidates'][0]['place_id']
#             logger.debug(f"Found Place ID '{place_id}' for '{place_name}'")
#             return place_id
#         return None
#     except Exception as e:
#         logger.warning(f"Google Find Place API error for '{place_name}': {e}")
#         raise LocationServiceError(f"API error while searching for '{place_name}'.") from e
#
# async def get_google_place_details(gmaps_client: googlemaps.Client, place_id: str) -> Optional[Dict[str, Any]]:
#     """Fetches Google Place details. Returns None if not found, raises on API error."""
#     if not gmaps_client or not place_id:
#         return None
#     try:
#         fields = ["place_id", "name", "geometry", "rating", "user_ratings_total", "opening_hours",
#                   "business_status", "type", "formatted_address", "website", "photo", "utc_offset",
#                   "price_level", "editorial_summary"]
#         
#         place_details_result = await asyncio.to_thread(
#             gmaps_client.place, place_id=place_id, fields=fields, language="en"
#         )
#         
#         if place_details_result and place_details_result.get("status") == "OK":
#             result = place_details_result.get("result", {})
#             if 'utc_offset' in result:
#                 result['utc_offset_minutes'] = result.pop('utc_offset')
#             return result
#         return None
#     except Exception as e:
#         logger.error(f"Google Place Details API error for {place_id}: {e}", exc_info=True)
#         raise LocationServiceError(f"API error fetching details for place ID {place_id}.") from e
#