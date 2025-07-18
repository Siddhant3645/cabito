# /backend/services/itinerary_service.py (Corrected with user's baseline)

import asyncio
import inspect
import logging
import math
import random
import re
import time
import uuid
from collections import Counter
from datetime import datetime, time as dt_time, timedelta, timezone as dt_timezone
from difflib import SequenceMatcher
from typing import Any, Coroutine, Dict, List, Optional, Set, Tuple

import google.generativeai as genai
import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models
from core import constants
from schemas import itinerary_schemas
from services import ai_service, location_service, weather_service
from services.location_service import LocationServiceError

try:
    from opening_hours import OpeningHours
    HAS_OPENING_HOURS_LIB = True
except ImportError:
    HAS_OPENING_HOURS_LIB = False
    class OpeningHours:
        def __init__(self, *args, **kwargs): pass
        def is_open(self, *args, **kwargs) -> bool: return True
        def next_change(self, *args, **kwargs) -> Optional[datetime]: return None

logger = logging.getLogger(__name__)


# --- Internal Helper Functions ---

def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def _normalize_city_name(location_str: str) -> str:
    if not location_str: return ""
    return location_str.split(',')[0].strip().lower()

async def _check_place_viability_and_timing(
    place_name: str,
    opening_hours: Optional[Any], # This is now generic, as we don't get structured data
    current_arrival_utc: datetime,
    activity_duration_hrs: float,
    itinerary_end_utc: datetime,
    return_journey_hrs: float
) -> itinerary_schemas.ActivityTimeViability:
    # As we no longer have a reliable source for opening hours, this check is simplified.
    # It now primarily checks if there's enough time left in the user's window.
    total_time_for_activity_and_return = timedelta(hours=(activity_duration_hrs + return_journey_hrs))
    if current_arrival_utc + total_time_for_activity_and_return > itinerary_end_utc:
        return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Not enough time for activity and return journey.")

    return itinerary_schemas.ActivityTimeViability(is_viable=True, adjusted_arrival_utc=current_arrival_utc, adjusted_departure_utc=current_arrival_utc + timedelta(hours=activity_duration_hrs), adjusted_activity_duration_hrs=activity_duration_hrs, reason="Time window is sufficient.")

# --- OLD VIABILITY CHECK (COMMENTED OUT) ---
# async def _check_place_viability_and_timing(
#     place_name: str,
#     google_opening_hours: Optional[List[Dict[str, Any]]],
#     utc_offset_minutes: Optional[int],
#     current_arrival_utc: datetime,
#     activity_duration_hrs: float,
#     itinerary_end_utc: datetime,
#     return_journey_hrs: float
# ) -> itinerary_schemas.ActivityTimeViability:
#     total_time_for_activity_and_return = timedelta(hours=(activity_duration_hrs + return_journey_hrs))
#
#     if current_arrival_utc + total_time_for_activity_and_return > itinerary_end_utc:
#         return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Not enough time for activity and return journey.")
#
#     if not HAS_OPENING_HOURS_LIB or not google_opening_hours or utc_offset_minutes is None:
#         return itinerary_schemas.ActivityTimeViability(is_viable=True, adjusted_arrival_utc=current_arrival_utc, adjusted_departure_utc=current_arrival_utc + timedelta(hours=activity_duration_hrs), adjusted_activity_duration_hrs=activity_duration_hrs, reason="No opening hours data.")
#
#     oh_str_parts = []
#     google_days_map = {0: "Su", 1: "Mo", 2: "Tu", 3: "We", 4: "Th", 5: "Fr", 6: "Sa"}
#     for period in google_opening_hours:
#         open_day_g = period.get("open", {}).get("day")
#         open_time_g = period.get("open", {}).get("time")
#         if open_day_g is None or open_time_g is None: continue
#         open_day_oh = google_days_map.get(open_day_g)
#         if not open_day_oh: continue
#         if open_day_g == 0 and open_time_g == "0000" and "close" not in period:
#             if "24/7" not in oh_str_parts: oh_str_parts.append("24/7"); break
#             continue
#         close_time_g = period.get("close", {}).get("time", "2359")
#         oh_str_parts.append(f"{open_day_oh} {open_time_g[:2]}:{open_time_g[2:]}-{close_time_g[:2]}:{close_time_g[2:]}")
#
#     opening_hours_string = "; ".join(oh_str_parts) or "24/7"
#
#     try:
#         oh_parser = OpeningHours(opening_hours_string)
#         place_local_tz = dt_timezone(timedelta(minutes=utc_offset_minutes))
#         arrival_local_naive = current_arrival_utc.astimezone(place_local_tz).replace(tzinfo=None)
#        
#         is_open_now = oh_parser.is_open(arrival_local_naive)
#         wait_time_hrs, actual_arrival_utc = 0.0, current_arrival_utc
#         if not is_open_now:
#             next_open_dt = oh_parser.next_change(arrival_local_naive)
#             if not next_open_dt: return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Closed indefinitely.")
#             next_open_utc = next_open_dt.replace(tzinfo=place_local_tz).astimezone(dt_timezone.utc)
#             if next_open_utc > itinerary_end_utc: return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Next opening is after trip ends.")
#             wait_time_hrs = max(0, (next_open_utc - current_arrival_utc).total_seconds() / 3600.0)
#             if wait_time_hrs > constants.MAX_WAIT_TIME_HOURS: return itinerary_schemas.ActivityTimeViability(is_viable=False, reason=f"Wait time of {wait_time_hrs:.1f} hrs is too long.")
#             actual_arrival_utc = next_open_utc
#
#         final_duration_hrs = activity_duration_hrs
#         potential_departure_utc = actual_arrival_utc + timedelta(hours=final_duration_hrs)
#
#         if potential_departure_utc + timedelta(hours=return_journey_hrs) > itinerary_end_utc:
#             available_time_hrs = (itinerary_end_utc - actual_arrival_utc - timedelta(hours=return_journey_hrs)).total_seconds() / 3600.0
#             if available_time_hrs < constants.MIN_VIABLE_ACTIVITY_HOURS:
#                 return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Not enough time for activity and return journey after waiting.")
#             final_duration_hrs = available_time_hrs
#             potential_departure_utc = actual_arrival_utc + timedelta(hours=final_duration_hrs)
#
#         arrival_for_closing_check_naive = actual_arrival_utc.astimezone(place_local_tz).replace(tzinfo=None)
#         next_closing_dt = oh_parser.next_change(arrival_for_closing_check_naive)
#         if next_closing_dt:
#             next_closing_utc = next_closing_dt.replace(tzinfo=place_local_tz).astimezone(dt_timezone.utc)
#             if potential_departure_utc > next_closing_utc:
#                 duration_before_closing_hrs = (next_closing_utc - actual_arrival_utc).total_seconds() / 3600.0
#                 if duration_before_closing_hrs < constants.MIN_VIABLE_ACTIVITY_HOURS:
#                     return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Closes too soon after arrival.")
#                 final_duration_hrs = duration_before_closing_hrs
#                 potential_departure_utc = next_closing_utc
#        
#         return itinerary_schemas.ActivityTimeViability(is_viable=True, adjusted_arrival_utc=actual_arrival_utc, adjusted_departure_utc=potential_departure_utc, adjusted_activity_duration_hrs=final_duration_hrs, wait_time_hrs=wait_time_hrs)
#     except Exception as e:
#         logger.error(f"Opening hours check error for '{place_name}': {e}")
#         return itinerary_schemas.ActivityTimeViability(is_viable=False, reason="Opening hours parsing error.")

def _get_matched_preferences(tags: Dict[str, Any], user_prefs: Set[str]) -> List[str]:
    """
    Determines which user preferences match a given set of OSM tags.
    """
    matched = []
    for pref in user_prefs:
        if pref in constants.PREFERENCE_TO_OSM_SELECTOR:
            selectors = constants.PREFERENCE_TO_OSM_SELECTOR[pref]
            for selector in selectors:
                # Basic parsing of Overpass-style selectors like '[key="value"]' or '[key]'
                match = re.match(r'\[(\w+)(?:~"([^"]+)")?\]', selector)
                if match:
                    key, values_str = match.groups()
                    if key in tags:
                        if values_str:
                            # Handles key~"value1|value2"
                            possible_values = set(values_str.split('|'))
                            if tags.get(key) in possible_values:
                                if pref not in matched:
                                    matched.append(pref)
                                break  # Move to the next preference once one selector matches
                        else:
                            # Handles [key]
                            if pref not in matched:
                                matched.append(pref)
                            break
            if pref in matched:
                continue # Skip other selectors for this pref if already matched
    return matched

# --- REVISED SCORING FUNCTION ---
def _get_candidate_score(
    candidate: Dict[str, Any],
    all_keywords: List[str],
    matched_prefs: List[str],
    distance_from_start: float,
    fulfilled_preferences: Set[str],
    added_activity_signatures: Set[str],
    ideal_arrival_utc: datetime, # Kept for potential future use with timing scores
    added_meal_times: Set[str] # Kept for meal diversity logic
) -> int:
    """
    Calculates a candidate's score based on available OSM data, keywords, and user preferences.
    This version is lightweight and does NOT rely on external API calls (like Google ratings).
    """
    score = 0
    name_lower = (candidate.get('name') or '').lower()
    tags = candidate.get('tags', {})
    description = (candidate.get('description') or '').lower()
    is_foodie = 'foodie' in matched_prefs
    is_shopping = 'shopping' in matched_prefs
    is_sightseeing_or_history = any(p in matched_prefs for p in ["sights", "history", "religious"])
    is_park = 'park' in matched_prefs

    # --- 1. Preference & Keyword Matching ---

    # Big bonus if a user's specific keyword is in the place name (high relevance)
    if any(re.search(re.escape(kw), name_lower, re.IGNORECASE) for kw in all_keywords):
        score += constants.KEYWORD_DISCOVERY_BONUS

    # Bonus for fulfilling a preference category for the first time
    newly_fulfilled_prefs = set(matched_prefs) - fulfilled_preferences
    if newly_fulfilled_prefs:
        score += constants.PREFERENCE_COVERAGE_BONUS * len(newly_fulfilled_prefs)

    # Smaller bonus for simply diversifying the plan
    if matched_prefs and not fulfilled_preferences.intersection(matched_prefs):
        score += constants.DIVERSIFICATION_BONUS

    # --- 2. Notability & Quality Proxies (from OSM data) ---

    # Having a Wikipedia tag is a strong indicator of notability
    if 'wikipedia' in tags or 'wikidata' in tags:
        if is_foodie: score += constants.WIKIPEDIA_NOTABILITY_BOOST_FOOD
        elif is_shopping: score += constants.WIKIPEDIA_NOTABILITY_BOOST_SHOP
        elif is_sightseeing_or_history: score += constants.SIGNIFICANCE_BONUS_SIGHTS
        elif is_park: score += constants.SIGNIFICANCE_BONUS_PARK
        else: score += 50 # Generic notability bonus

    # Check for authenticity keywords in the description
    if description:
        if is_foodie and any(kw in description for kw in constants.AUTHENTICITY_KEYWORDS):
            score += constants.AUTHENTICITY_KEYWORD_BOOST_FOOD
        if is_shopping and any(kw in description for kw in constants.SHOPPING_AUTHENTICITY_KEYWORD_BOOST):
            score += constants.SHOPPING_AUTHENTICITY_KEYWORD_BOOST

    # --- 3. Preference-Specific Heuristics & Penalties ---

    if is_foodie:
        # Penalize generic international fast-food chains
        if any(chain in name_lower for chain in constants.INTERNATIONAL_FOOD_CHAINS_EXCLUDE):
            return -9999  # Disqualify immediately
        # Penalize generic fast food tags
        if tags.get('amenity') == 'fast_food':
            score += constants.GENERIC_FAST_FOOD_PENALTY

    if is_shopping:
        # Heavily penalize common, non-touristy generic stores by name
        if any(term in name_lower.split() for term in constants.GENERIC_STORE_MATCH_TERMS):
            score += constants.GENERIC_STORE_KEYWORDS_PENALTY
        # Boost specific, desirable shop types
        shop_type = tags.get('shop')
        if shop_type == 'mall': score += constants.SHOPPING_MALL_BOOST
        elif shop_type in {'souvenir', 'gift', 'crafts', 'art'}: score += constants.SOUVENIR_GIFT_CRAFT_ART_BOOST
        # Penalize generic shop tags that passed the name check
        elif shop_type in {'general', 'department_store'}: score += constants.GENERAL_SHOP_PENALTY

    # Penalize adding too many activities of the same specific type (e.g., two museums)
    activity_signature = None
    if matched_prefs:
        # Create a signature like "history_museum" or "foodie_restaurant"
        primary_pref = matched_prefs[0]
        sub_type = tags.get('amenity') or tags.get('shop') or tags.get('leisure') or tags.get('historic')
        if sub_type:
            activity_signature = f"{primary_pref}_{sub_type}"
            if activity_signature in added_activity_signatures:
                score += constants.SIMILAR_ACTIVITY_PENALTY

    # --- 4. Final Adjustments ---

    # Penalize locations that are very far from the starting point
    if distance_from_start > 5: # Penalize distances over 5 km
        score -= int((distance_from_start - 5) * 50)

    return score


# <<< MODIFIED: This function no longer calls HERE API >>>
async def enrich_candidate(
    element: Dict[str, Any], 
    http_client: httpx.AsyncClient,
    gemini_model: genai.GenerativeModel, 
    user_prefs: Set[str],
    semaphore: asyncio.Semaphore
) -> Optional[Dict[str, Any]]:
    async with semaphore:
        element_name = element.get('tags', {}).get('name', f"OSM ID {element.get('id')}")
        try:
            tags = element.get('tags', {})
            name = tags.get('name')
            if not (element.get('id') and name and name.strip()): return None
            
            lat, lon = (element.get('lat'), element.get('lon')) if element.get('type') == 'node' else (element.get('center', {}).get('lat'), element.get('center', {}).get('lon'))
            if lat is None or lon is None: return None
            
            if any(ek in tags for ek in constants.EXCLUDED_OSM_TAGS["_exclude_key_exists"]): return None
            if any(tags.get(key) in excluded_values for key, excluded_values in constants.EXCLUDED_OSM_TAGS.items() if key != "_exclude_key_exists"): return None

            wiki_summary = await location_service.fetch_wikipedia_summary(name, tags.get("wikipedia"))
            description = wiki_summary or tags.get("description")

            avg_dur = constants.DEFAULT_ACTIVITY_TIME_HOURS; food_type: Optional[str] = None
            estimated_cost = constants.DEFAULT_ENTRY_COST_INR
            
            if tags.get('shop'):
                estimated_cost = None
            elif tags.get('amenity') in constants.MEAL_AMENITIES:
                food_type = 'meal'; avg_dur = constants.DEFAULT_MEAL_DURATION_HOURS
                estimated_cost = constants.DEFAULT_RESTAURANT_COST_INR
            elif tags.get('amenity') in constants.SNACK_AMENITIES:
                food_type = 'snack'; avg_dur = constants.DEFAULT_SNACK_DURATION_HOURS
                estimated_cost = constants.DEFAULT_SNACK_COST_INR
            elif tags.get('amenity') in constants.DESSERT_AMENITIES or tags.get('shop') in constants.DESSERT_SHOP_TAGS:
                food_type = 'dessert'; avg_dur = constants.DEFAULT_DESSERT_DURATION_HOURS
                estimated_cost = constants.DEFAULT_DESSERT_SPECIALTY_COST_INR

            return {
                "osm_id": element.get('id'), "name": name, "tags": tags, "lat": float(lat), "lon": float(lon),
                "avg_visit_duration_hrs": avg_dur, "_food_type": food_type, "estimated_cost_inr": estimated_cost,
                "description": description,
                "opening_hours": tags.get("opening_hours"),
            }
        except Exception as e:
            logger.error(f"An unexpected error occurred while enriching candidate '{element_name}': {e}", exc_info=True)
            return None


# --- OLD ENRICHMENT FUNCTION (COMMENTED OUT) ---
# async def enrich_candidate(
#     element: Dict[str, Any], gmaps_client: googlemaps.Client,
#     gemini_model: genai.GenerativeModel, user_prefs: Set[str],
#     semaphore: asyncio.Semaphore
# ) -> Optional[Dict[str, Any]]:
#     async with semaphore:
#         element_name = element.get('tags', {}).get('name', f"OSM ID {element.get('id')}")
#         try:
#             tags = element.get('tags', {})
#             name = tags.get('name')
#             if not (element.get('id') and name and name.strip()): return None
#            
#             lat, lon = (element.get('lat'), element.get('lon')) if element.get('type') == 'node' else (element.get('center', {}).get('lat'), element.get('center', {}).get('lon'))
#             if lat is None or lon is None: return None
#            
#             if any(ek in tags for ek in constants.EXCLUDED_OSM_TAGS["_exclude_key_exists"]): return None
#             if any(tags.get(key) in excluded_values for key, excluded_values in constants.EXCLUDED_OSM_TAGS.items() if key != "_exclude_key_exists"): return None
#
#             place_id = tags.get("ref:google")
#             if not place_id:
#                 place_id = await location_service.find_google_place_id_by_name(gmaps_client, name, (lat, lon))
#            
#             google_details = await location_service.get_google_place_details(gmaps_client, place_id)
#
#             if google_details:
#                 rating = google_details.get('rating', 0.0)
#                 reviews = google_details.get('user_ratings_total', 0)
#                 if rating > 4.1 and reviews < constants.MIN_REVIEWS_FOR_HIGH_RATING:
#                     return None
#            
#             wiki_summary = await location_service.fetch_wikipedia_summary(name, tags.get("wikipedia"))
#             description = wiki_summary or tags.get("description")
#
#             avg_dur = constants.DEFAULT_ACTIVITY_TIME_HOURS; food_type: Optional[str] = None
#             estimated_cost = constants.DEFAULT_ENTRY_COST_INR
#            
#             if tags.get('shop'):
#                 estimated_cost = None
#             elif tags.get('amenity') in constants.MEAL_AMENITIES:
#                 food_type = 'meal'; avg_dur = constants.DEFAULT_MEAL_DURATION_HOURS
#                 price_level = google_details.get('price_level') if google_details else None
#                 estimated_cost = constants.GOOGLE_PRICE_LEVEL_TO_INR.get(price_level, constants.DEFAULT_RESTAURANT_COST_INR)
#             elif tags.get('amenity') in constants.SNACK_AMENITIES:
#                 food_type = 'snack'; avg_dur = constants.DEFAULT_SNACK_DURATION_HOURS
#                 estimated_cost = constants.DEFAULT_SNACK_COST_INR
#             elif tags.get('amenity') in constants.DESSERT_AMENITIES or tags.get('shop') in constants.DESSERT_SHOP_TAGS:
#                 food_type = 'dessert'; avg_dur = constants.DEFAULT_DESSERT_DURATION_HOURS
#                 estimated_cost = constants.DEFAULT_DESSERT_SPECIALTY_COST_INR
#
#             return {
#                 "osm_id": element.get('id'), "name": name, "tags": tags, "lat": float(lat), "lon": float(lon),
#                 "avg_visit_duration_hrs": avg_dur, "_food_type": food_type, "estimated_cost_inr": estimated_cost,
#                 "description": description,
#                 "google_opening_hours_periods": google_details.get("opening_hours", {}).get("periods") if google_details else None,
#                 "google_utc_offset_minutes": google_details.get('utc_offset_minutes') if google_details else None,
#                 "rating_google": google_details.get('rating') if google_details else None,
#                 "user_ratings_total_google": google_details.get('user_ratings_total') if google_details else 0
#             }
#         except LocationServiceError as e:
#             logger.warning(f"Skipping candidate '{element_name}' due to a non-critical enrichment error: {e}")
#             return None
#         except Exception as e:
#             logger.error(f"An unexpected error occurred while enriching candidate '{element_name}': {e}", exc_info=True)
#             return None


async def build_itinerary(
    payload: itinerary_schemas.ItineraryRequest,
    db: AsyncSession,
    current_user: models.all_models.UserAccount,
    http_client: httpx.AsyncClient,
    gemini_model: genai.GenerativeModel
) -> itinerary_schemas.ItineraryResponse:
    start_overall_time = time.time()
    start_dt_utc = datetime.fromisoformat(payload.start_datetime.replace('Z', '+00:00')).astimezone(dt_timezone.utc)
    end_dt_utc = datetime.fromisoformat(payload.end_datetime.replace('Z', '+00:00')).astimezone(dt_timezone.utc)
    
    start_coords = None
    if payload.start_lat and payload.start_lon:
        start_coords = (payload.start_lat, payload.start_lon)
    elif payload.location:
        try:
            geo_result = await location_service.geocode_location_text(payload.location, http_client)
            start_coords = (float(geo_result['lat']), float(geo_result['lon']))
        except LocationServiceError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
    if not start_coords:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not determine start coordinates.")

    location_display_name = payload.location
    if payload.start_lat and payload.start_lon and (not payload.location or payload.location.startswith("[Lat:")):
        try:
            rev_geo_result = await location_service.reverse_geocode_coords(payload.start_lat, payload.start_lon, http_client)
            if rev_geo_result and rev_geo_result.get('address'):
                address = rev_geo_result['address']
                city_name = address.get('city') or address.get('town') or address.get('state_district') or address.get('state')
                if city_name:
                    location_display_name = city_name
                else:
                    location_display_name = rev_geo_result.get('display_name', 'your current location')
            else:
                location_display_name = "your current location"
        except LocationServiceError as e:
            logger.warning(f"Reverse geocoding failed, using default name. Error: {e}")
            location_display_name = "your current location"
    else:
        location_display_name = payload.location or "your selected area"


    target_city_normalized = _normalize_city_name(location_display_name)
    user_prefs = set(p.lower() for p in (payload.selected_preferences or []))
    all_keywords = []

    if payload.surprise_me and not user_prefs:
        user_prefs = constants.SURPRISE_ME_PREFERENCES
    
    if payload.custom_trip_description:
        analysis_result = await ai_service.analyze_description_for_keywords_and_prefs(
            gemini_model, payload.custom_trip_description, list(constants.PROMPT_EXAMPLES_FOR_PREFERENCES.keys())
        )
        all_keywords.extend(analysis_result.get("keywords", []))
        user_prefs.update(analysis_result.get("mapped_preferences", []))
        logger.info(f"AI mapped description to preferences: {analysis_result.get('mapped_preferences', [])}")

    if user_prefs:
        keywords_from_prefs = await ai_service.get_dynamic_local_keywords_for_multiple_preferences(
            gemini_model, target_city_normalized, list(user_prefs)
        )
        all_keywords.extend(keywords_from_prefs)

    all_keywords = list(set(all_keywords))
    logger.info(f"Using final keywords for search: {all_keywords}")
    
    query_radius_m = int(max((end_dt_utc - start_dt_utc).total_seconds() / 3600.0 / 2.0 * constants.SEARCH_RADIUS_SPEED_KMPH, constants.MIN_SEARCH_RADIUS_KM) * 1000)
    
    logger.info("Executing broad search for candidates...")
    osm_elements = []
    try:
        selectors_map = {pk: v for pk, v in constants.PREFERENCE_TO_OSM_SELECTOR.items() if pk in user_prefs}
        unique_selectors = list(set(s for sel_list in selectors_map.values() for s in sel_list if s))
        if unique_selectors:
            query_parts = [f"node[name]{sel}(around:{query_radius_m},{start_coords[0]},{start_coords[1]});way[name]{sel}(around:{query_radius_m},{start_coords[0]},{start_coords[1]});relation[name]{sel}(around:{query_radius_m},{start_coords[0]},{start_coords[1]});" for sel in unique_selectors]
            overpass_query = f"[out:json][timeout:{constants.OVERPASS_TIMEOUT}];({ ''.join(query_parts) });out center;"
            response = await http_client.post(constants.OVERPASS_API_URL, data=overpass_query)
            response.raise_for_status()
            osm_elements = response.json().get('elements', [])
            logger.info(f"Broad search found {len(osm_elements)} elements.")
        else:
             logger.warning("No preferences provided for search.")

    except Exception as e:
        logger.error(f"Broad search failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not fetch map data at this time.")

    enrichment_semaphore = asyncio.Semaphore(20)
    enrichment_tasks = [enrich_candidate(element, http_client, gemini_model, user_prefs, enrichment_semaphore) for element in osm_elements]
    enriched_results = await asyncio.gather(*enrichment_tasks)
    enriched_candidates = [result for result in enriched_results if result is not None]
    
    logger.info(f"De-duplicating {len(enriched_candidates)} candidates with fuzzy matching...")
    processed_candidates = []
    temp_enriched_candidates = enriched_candidates[:]
    while temp_enriched_candidates:
        base_candidate = temp_enriched_candidates.pop(0)
        base_name = (base_candidate.get("name") or "").lower().strip()
        
        similar_group = [base_candidate]
        remaining_candidates = []

        for other_candidate in temp_enriched_candidates:
            other_name = (other_candidate.get("name") or "").lower().strip()
            if SequenceMatcher(None, base_name, other_name).ratio() > 0.85:
                similar_group.append(other_candidate)
            else:
                remaining_candidates.append(other_candidate)
        
        best_in_group = max(similar_group, key=lambda x: len(x.get("description") or ""))
        processed_candidates.append(best_in_group)
        
        temp_enriched_candidates = remaining_candidates

    enriched_candidates = processed_candidates
    logger.info(f"De-duplication complete. {len(enriched_candidates)} unique candidates remaining.")
    
    itinerary_items_final: List[itinerary_schemas.ItineraryItem] = []
    total_cost_final = 0.0
    current_dt_pack, (current_lat_pack, current_lon_pack) = start_dt_utc, start_coords
    remaining_candidates_dict = {cand["osm_id"]: cand for cand in enriched_candidates if cand.get("osm_id") not in payload.exclude_osm_ids}
    fulfilled_preferences = set()
    added_activity_signatures = set()
    added_meal_times = set()

    max_iters = len(remaining_candidates_dict) + 20
    for _ in range(max_iters):
        time_left_for_trip = (end_dt_utc - current_dt_pack).total_seconds() / 3600.0
        if time_left_for_trip < constants.MIN_VIABLE_ACTIVITY_HOURS or not remaining_candidates_dict: break

        scored_candidates = []
        for key, cand_data in remaining_candidates_dict.items():
            distance_from_start = _haversine_distance(start_coords[0], start_coords[1], cand_data['lat'], cand_data['lon'])
            matched_prefs_for_cand = _get_matched_preferences(cand_data['tags'], user_prefs)
            score = _get_candidate_score(cand_data, all_keywords, matched_prefs_for_cand, distance_from_start, fulfilled_preferences, added_activity_signatures, current_dt_pack, added_meal_times)
            scored_candidates.append((score, key))
        
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        candidate_keys_to_route = [key for score, key in scored_candidates[:30]]
        
        if not candidate_keys_to_route: break

        # --- BATCHED & RATE-LIMITED ROUTING CALLS ---
        route_results = {}
        return_journey_results = {}
        chunk_size = 5  # Process 5 candidates at a time
        for i in range(0, len(candidate_keys_to_route), chunk_size):
            chunk_keys = candidate_keys_to_route[i:i+chunk_size]
            
            return_journey_tasks = [location_service.get_directions(http_client, (remaining_candidates_dict[key]['lat'], remaining_candidates_dict[key]['lon']), start_coords, payload.travel_mode) for key in chunk_keys]
            routing_tasks = [location_service.get_directions(http_client, (current_lat_pack, current_lon_pack), (remaining_candidates_dict[key]['lat'], remaining_candidates_dict[key]['lon']), payload.travel_mode) for key in chunk_keys]

            all_directions_chunk = await asyncio.gather(*return_journey_tasks, *routing_tasks, return_exceptions=True)
            
            # Process results for the current chunk
            return_journey_chunk = dict(zip(chunk_keys, all_directions_chunk[:len(chunk_keys)]))
            route_chunk = dict(zip(chunk_keys, all_directions_chunk[len(chunk_keys):]))
            
            route_results.update(route_chunk)
            return_journey_results.update(return_journey_chunk)

            # Wait before processing the next chunk to respect rate limits
            if i + chunk_size < len(candidate_keys_to_route):
                await asyncio.sleep(1) # 1-second delay between batches

        best_candidate_key, best_score, best_details = None, -float('inf'), {}
        
        for key in candidate_keys_to_route:
            route_info = route_results.get(key); return_journey_info = return_journey_results.get(key)
            if isinstance(route_info, Exception) or isinstance(return_journey_info, Exception): continue

            cand_data = remaining_candidates_dict[key]
            
            travel_hrs = route_info['duration_hrs']; return_journey_hrs = return_journey_info['duration_hrs']
            ideal_arrival_utc = current_dt_pack + timedelta(hours=travel_hrs)
            
            viability = await _check_place_viability_and_timing(cand_data['name'], cand_data.get('opening_hours'), ideal_arrival_utc, cand_data['avg_visit_duration_hrs'], end_dt_utc, return_journey_hrs)
            if not viability.is_viable: continue
            
            new_travel_cost = constants.COST_BASE_FARE_INR_DRIVING + (route_info['distance_km'] * constants.COST_PER_KM_INR_DRIVING) if payload.travel_mode == "driving" else 0.0
            new_activity_cost = cand_data.get('estimated_cost_inr') or 0.0
            if isinstance(new_activity_cost, (int, float)) and (total_cost_final + new_travel_cost + new_activity_cost) > payload.budget: continue
            
            original_score = next((s for s, k in scored_candidates if k == key), 0)
            score = original_score - (travel_hrs * 50)

            if score > best_score:
                best_score = score; best_candidate_key = key
                best_details = {'arrival_dt': viability.adjusted_arrival_utc, 'departure_dt': viability.adjusted_departure_utc, 'travel_hrs': travel_hrs, 'distance_km': route_info['distance_km'], 'activity_duration_hrs': viability.adjusted_activity_duration_hrs, '_matched_prefs': _get_matched_preferences(cand_data['tags'], user_prefs)}

        if not best_candidate_key: break
        
        selected_candidate = remaining_candidates_dict.pop(best_candidate_key); final_details = best_details
        
        previous_departure_time = itinerary_items_final[-1].estimated_departure if itinerary_items_final else start_dt_utc
        next_travel_start_time = final_details['arrival_dt'] - timedelta(hours=final_details['travel_hrs'])
        wait_duration_hrs = (next_travel_start_time - previous_departure_time).total_seconds() / 3600
        if wait_duration_hrs > 0.25:
            itinerary_items_final.append(itinerary_schemas.ItineraryItem(
                leg_type='BREAK', activity="Free Time / Break",
                estimated_duration_hrs=round(wait_duration_hrs, 2),
                estimated_arrival=previous_departure_time, estimated_departure=next_travel_start_time
            ))
        
        travel_cost = constants.COST_BASE_FARE_INR_DRIVING + (final_details['distance_km'] * constants.COST_PER_KM_INR_DRIVING) if payload.travel_mode == "driving" else 0.0
        route_info_for_leg = route_results.get(best_candidate_key)
        itinerary_items_final.append(itinerary_schemas.ItineraryItem(
            leg_type='TRAVEL', 
            activity=f"Travel to {selected_candidate['name']}", 
            estimated_duration_hrs=round(final_details['travel_hrs'], 2), 
            estimated_cost_inr=round(travel_cost, 2), 
            distance_km=round(final_details['distance_km'], 1), 
            estimated_arrival=final_details['arrival_dt'], 
            estimated_departure=current_dt_pack,
            overview_polyline=route_info_for_leg.get('overview_polyline') if route_info_for_leg else None
        ))
        total_cost_final += travel_cost

        itinerary_items_final.append(
            itinerary_schemas.ItineraryItem(
                leg_type='ACTIVITY',
                activity=selected_candidate['name'],
                osm_id=selected_candidate['osm_id'],
                description=selected_candidate['description'],
                estimated_duration_hrs=round(final_details['activity_duration_hrs'], 2),
                estimated_cost_inr=selected_candidate['estimated_cost_inr'],
                lat=selected_candidate['lat'],
                lon=selected_candidate['lon'],
                estimated_arrival=final_details['arrival_dt'],
                estimated_departure=final_details['departure_dt'],
                matched_preferences=final_details['_matched_prefs'],
                food_type=selected_candidate.get('_food_type'),
                specific_amenity=selected_candidate.get('tags', {}).get('amenity') or selected_candidate.get('tags', {}).get('shop')
            )
        )
        if isinstance(selected_candidate['estimated_cost_inr'], (int, float)): total_cost_final += selected_candidate['estimated_cost_inr']

        current_dt_pack = final_details['departure_dt']; current_lat_pack, current_lon_pack = selected_candidate['lat'], selected_candidate['lon']
        fulfilled_preferences.update(final_details['_matched_prefs'])
        
        activity_signature = f"{final_details['_matched_prefs'][0]}_{selected_candidate['tags'].get('amenity') or selected_candidate['tags'].get('shop') or selected_candidate['tags'].get('leisure')}" if final_details['_matched_prefs'] else None
        if activity_signature:
            added_activity_signatures.add(activity_signature)

    if itinerary_items_final and itinerary_items_final[-1].leg_type == "ACTIVITY":
        try:
            last_activity = itinerary_items_final[-1]
            final_return_directions = await location_service.get_directions(http_client, (last_activity.lat, last_activity.lon), start_coords, payload.travel_mode)
            if final_return_directions:
                final_travel_cost = constants.COST_BASE_FARE_INR_DRIVING + (final_return_directions['distance_km'] * constants.COST_PER_KM_INR_DRIVING) if payload.travel_mode == "driving" else 0.0
                total_cost_final += final_travel_cost
                final_leg_arrival = current_dt_pack + timedelta(hours=final_return_directions['duration_hrs'])
                itinerary_items_final.append(itinerary_schemas.ItineraryItem(
                    leg_type='TRAVEL', activity="Travel back to start location",
                    estimated_duration_hrs=round(final_return_directions['duration_hrs'], 2),
                    estimated_cost_inr=round(final_travel_cost, 2), distance_km=round(final_return_directions['distance_km'], 1),
                    estimated_arrival=final_leg_arrival, estimated_departure=current_dt_pack,
                    overview_polyline=final_return_directions.get('overview_polyline')
                ))
        except LocationServiceError as e:
            logger.error(f"Could not calculate final return journey: {e}. Itinerary may be incomplete.")


    if itinerary_items_final:
        logger.info(f"Fetching AI insights for {len([i for i in itinerary_items_final if i.leg_type == 'ACTIVITY'])} final activities...")
        insight_tasks = []
        for item in itinerary_items_final:
            if item.leg_type == 'ACTIVITY':
                task = ai_service.generate_ai_insight(
                    gemini_model, item.activity, item.description, item.matched_preferences
                )
                insight_tasks.append(task)
        
        insight_results = await asyncio.gather(*insight_tasks, return_exceptions=True)
        
        activity_index = 0
        for i, item in enumerate(itinerary_items_final):
            if item.leg_type == 'ACTIVITY':
                if activity_index < len(insight_results) and isinstance(insight_results[activity_index], str):
                    itinerary_items_final[i].ai_insight = insight_results[activity_index]
                activity_index += 1

    final_activities = [item for item in itinerary_items_final if item.leg_type == 'ACTIVITY']
    if len(final_activities) > 2:
        logger.info(f"Itinerary has {len(final_activities)} activities. Running final AI validation check.")
        rejected_activity_names = await ai_service.validate_itinerary_with_ai(
            gemini_model, itinerary_items_final, target_city_normalized, list(user_prefs)
        )
        if rejected_activity_names:
            rejected_set = set(rejected_activity_names)
            indices_to_remove = set()
            for i, item in enumerate(itinerary_items_final):
                if item.leg_type == 'ACTIVITY' and item.activity in rejected_set:
                    indices_to_remove.add(i)
                    if i > 0 and itinerary_items_final[i-1].leg_type == 'TRAVEL':
                        indices_to_remove.add(i-1)
            
            if indices_to_remove:
                itinerary_items_final = [
                    item for i, item in enumerate(itinerary_items_final)
                    if i not in indices_to_remove
                ]
                logger.info(f"Removed {len(rejected_activity_names)} activities and their travel legs after AI validation.")
    else:
        logger.info(f"Itinerary has {len(final_activities)} or fewer activities. Skipping final AI validation to ensure results are returned.")

    weather_task = weather_service.get_weather_forecast(start_coords[0], start_coords[1], start_dt_utc, http_client, gemini_model)
    title_task = ai_service.generate_creative_trip_title(gemini_model, target_city_normalized, list(user_prefs), itinerary_items_final)
    weather_info, final_custom_heading = await asyncio.gather(weather_task, title_task)

    trip_uuid_val = str(uuid.uuid4())
    itinerary_response = itinerary_schemas.ItineraryResponse(
        trip_uuid=trip_uuid_val,
        start_lat=start_coords[0],
        start_lon=start_coords[1],
        itinerary=itinerary_items_final, 
        total_estimated_cost=round(total_cost_final, 2), 
        custom_heading=final_custom_heading, 
        notes="Itinerary generated successfully!", 
        weather_info=weather_info
    )
    
    new_trip = models.all_models.UserTrip(trip_uuid=trip_uuid_val, user_id=current_user.id, original_request_details=payload.model_dump(mode='json'), generated_itinerary_response=itinerary_response.model_dump(mode='json'), trip_title=final_custom_heading, location_display_name=location_display_name, trip_start_datetime_utc=start_dt_utc, trip_end_datetime_utc=end_dt_utc, status="generated")
    db.add(new_trip); await db.commit()
    
    logger.info(f"--- Itinerary build time: {time.time() - start_overall_time:.2f} seconds ---")
    return itinerary_response

async def get_serendipity_suggestion(
    payload: itinerary_schemas.SerendipityRequest,
    current_user: models.all_models.UserAccount,
    http_client: httpx.AsyncClient,
    gemini_model: genai.GenerativeModel
) -> Optional[itinerary_schemas.SerendipityResponse]:
    try:
        logger.info("--- Starting Intelligent Serendipity Suggestion ---")
        original_req = payload.original_request_details
        if not (original_req.start_lat and original_req.start_lon):
            return None

        start_coords = (original_req.start_lat, original_req.start_lon)
        radius_m = int(max(constants.MIN_SEARCH_RADIUS_KM, (datetime.fromisoformat(original_req.end_datetime.replace('Z', '+00:00')) - datetime.fromisoformat(original_req.start_datetime.replace('Z', '+00:00'))).total_seconds() / 3600 / 2.5 * constants.SEARCH_RADIUS_SPEED_KMPH) * 1000)
        user_prefs = set(original_req.selected_preferences or []) or constants.SURPRISE_ME_PREFERENCES
        
        selectors = list(set(s for p in user_prefs for s in constants.PREFERENCE_TO_OSM_SELECTOR.get(p, [])))
        if not selectors: return None
            
        query_parts = [f"node[name]{sel}(around:{radius_m},{start_coords[0]},{start_coords[1]});way[name]{sel}(around:{radius_m},{start_coords[0]},{start_coords[1]});" for sel in selectors]
        overpass_query = f"[out:json][timeout:{constants.OVERPASS_TIMEOUT}];({ ''.join(query_parts) });out center {constants.MAX_SERENDIPITY_CANDIDATES_FROM_OVERPASS * 2};"
        
        response = await http_client.post(constants.OVERPASS_API_URL, data=overpass_query)
        response.raise_for_status()
        elements = response.json().get('elements', [])

        existing_osm_ids = {str(item.osm_id) for item in payload.current_itinerary if item.osm_id}
        excluded_osm_ids = set(payload.excluded_serendipity_ids or [])
        
        candidates = []
        for el in elements:
            osm_id = el.get("id")
            if not osm_id or str(osm_id) in existing_osm_ids or str(osm_id) in excluded_osm_ids: continue
            candidates.append(el)

        if not candidates: return None
        
        sample_size = min(len(candidates), 10)
        sampled_candidates = random.sample(candidates, sample_size)
        
        enrichment_semaphore = asyncio.Semaphore(10)
        enrichment_tasks = [enrich_candidate(c, http_client, gemini_model, user_prefs, enrichment_semaphore) for c in sampled_candidates]
        enriched_candidates = [res for res in await asyncio.gather(*enrichment_tasks) if res is not None]

        if not enriched_candidates:
            logger.warning("Serendipity: No candidates survived the enrichment process.")
            return None

        best_candidate = max(enriched_candidates, key=lambda c: _get_candidate_score(c, [], list(user_prefs), 0, set(), set(), datetime.now(dt_timezone.utc), set()))

        logger.info(f"Serendipity selected best candidate: '{best_candidate['name']}' (OSM ID: {best_candidate['osm_id']})")
        
        activity_legs = [item for item in payload.current_itinerary if item.leg_type == 'ACTIVITY']
        now_utc = datetime.now(dt_timezone.utc)
        current_activity_node = max([act for act in activity_legs if act.estimated_arrival and act.estimated_arrival <= now_utc], key=lambda x: x.estimated_arrival, default=None)
        next_activity_node = min([act for act in activity_legs if act.estimated_arrival and act.estimated_arrival > now_utc], key=lambda x: x.estimated_arrival, default=None)

        from_coords = (current_activity_node.lat, current_activity_node.lon) if current_activity_node else start_coords
        to_coords = (next_activity_node.lat, next_activity_node.lon) if next_activity_node else from_coords
        suggested_coords = (best_candidate['lat'], best_candidate['lon'])
        travel_mode = original_req.travel_mode or constants.DEFAULT_TRAVEL_MODE

        directions = await asyncio.gather(
            location_service.get_directions(http_client, from_coords, suggested_coords, travel_mode),
            location_service.get_directions(http_client, suggested_coords, to_coords, travel_mode),
            location_service.get_directions(http_client, from_coords, to_coords, travel_mode) if from_coords != to_coords else asyncio.sleep(0, result={'duration_hrs': 0}),
            return_exceptions=True
        )
        if any(isinstance(d, Exception) for d in directions):
            logger.warning(f"Serendipity suggestion for '{best_candidate['name']}' failed due to routing error.")
            return None
        
        directions_to_suggestion, directions_from_suggestion, original_leg_directions = directions

        time_extension_minutes = ((directions_to_suggestion['duration_hrs'] + best_candidate['avg_visit_duration_hrs'] + directions_from_suggestion['duration_hrs']) - original_leg_directions['duration_hrs']) * 60

        suggested_item = itinerary_schemas.ItineraryItem(
            leg_type='ACTIVITY', 
            activity=best_candidate['name'], 
            osm_id=best_candidate['osm_id'],
            estimated_duration_hrs=best_candidate['avg_visit_duration_hrs'], 
            estimated_cost_inr=best_candidate['estimated_cost_inr'],
            lat=best_candidate['lat'], 
            lon=best_candidate['lon'], 
            description=best_candidate['description'],
            rating=best_candidate.get('rating_google'),
            ai_insight=await ai_service.generate_ai_insight(gemini_model, best_candidate['name'], best_candidate['description'], list(user_prefs))
        )

        actionable_text = await ai_service.generate_serendipity_suggestion_text(
            gemini_model=gemini_model, place_to_suggest=suggested_item.model_dump(),
            user_preferences=list(user_prefs), target_city=_normalize_city_name(original_req.location or "")
        )
        
        logger.info("--- Intelligent Serendipity Suggestion Successfully Generated ---")
        return itinerary_schemas.SerendipityResponse(
            suggestion_id=str(uuid.uuid4()), 
            suggested_activity=suggested_item,
            actionable_text=actionable_text or f"✨ How about a visit to {suggested_item.activity}?",
            replaces_activity_osm_id=None,
            time_extension_minutes=time_extension_minutes
        )

    except Exception as e:
        logger.error(f"Unexpected error in get_serendipity_suggestion: {e}", exc_info=True)
        return None

async def insert_activity_into_itinerary(
    payload: itinerary_schemas.ItineraryInsertionRequest,
    db: AsyncSession,
    http_client: httpx.AsyncClient,
    gemini_model: genai.GenerativeModel,
    current_user: models.all_models.UserAccount,
) -> itinerary_schemas.ItineraryResponse:
    logger.info(f"Starting insertion of '{payload.new_activity.activity}' into itinerary.")
    try:
        original_req = payload.original_request
        
        activity_nodes = [item for item in payload.current_itinerary if item.leg_type == 'ACTIVITY']
        start_coords = (original_req.start_lat, original_req.start_lon)
        new_activity_coords = (payload.new_activity.lat, payload.new_activity.lon)
        travel_mode = original_req.travel_mode

        path_coords = [start_coords] + [(act.lat, act.lon) for act in activity_nodes if act.lat and act.lon] + [start_coords]
        
        detour_tasks = []
        for i in range(len(path_coords) - 1):
            from_coords, to_coords = path_coords[i], path_coords[i+1]
            
            original_leg_task = location_service.get_directions(http_client, from_coords, to_coords, travel_mode)
            leg1_task = location_service.get_directions(http_client, from_coords, new_activity_coords, travel_mode)
            leg2_task = location_service.get_directions(http_client, new_activity_coords, to_coords, travel_mode)
            detour_tasks.extend([original_leg_task, leg1_task, leg2_task])

        all_directions = await asyncio.gather(*detour_tasks, return_exceptions=True)

        best_insert_index, min_extra_travel_hours = -1, float('inf')
        for i in range(len(path_coords) - 1):
            original_leg, leg1, leg2 = all_directions[i*3], all_directions[i*3+1], all_directions[i*3+2]
            if any(isinstance(leg, Exception) for leg in [original_leg, leg1, leg2]):
                logger.warning(f"Could not calculate detour for insertion at index {i} due to routing error.")
                continue
                
            extra_travel_hours = (leg1['duration_hrs'] + leg2['duration_hrs']) - original_leg['duration_hrs']
            if extra_travel_hours < min_extra_travel_hours:
                min_extra_travel_hours = extra_travel_hours
                best_insert_index = i

        if best_insert_index == -1:
            raise HTTPException(status_code=400, detail="Could not find a valid insertion point for the new activity.")

        logger.info(f"Best insertion point found at index {best_insert_index} with {min_extra_travel_hours:.2f} extra travel hours.")
        new_activity_sequence = activity_nodes[:]
        new_activity_sequence.insert(best_insert_index, payload.new_activity)

        new_itinerary_items = []
        total_cost = 0.0
        current_time = datetime.fromisoformat(original_req.start_datetime.replace('Z', '+00:00'))
        current_coords = start_coords

        for activity in new_activity_sequence:
            travel_directions = await location_service.get_directions(http_client, current_coords, (activity.lat, activity.lon), travel_mode)
            travel_leg_cost = constants.COST_BASE_FARE_INR_DRIVING + (travel_directions['distance_km'] * constants.COST_PER_KM_INR_DRIVING) if travel_mode == "driving" else 0.0
            travel_arrival_time = current_time + timedelta(hours=travel_directions['duration_hrs'])
            new_itinerary_items.append(itinerary_schemas.ItineraryItem(
                leg_type='TRAVEL', activity=f"Travel to {activity.activity}",
                estimated_duration_hrs=travel_directions['duration_hrs'], estimated_cost_inr=travel_leg_cost,
                distance_km=travel_directions['distance_km'], estimated_arrival=travel_arrival_time,
                estimated_departure=current_time, overview_polyline=travel_directions.get('overview_polyline')
            ))
            total_cost += travel_leg_cost
            current_time = travel_arrival_time

            activity_duration_hrs = activity.estimated_duration_hrs or constants.DEFAULT_ACTIVITY_TIME_HOURS
            activity_departure_time = current_time + timedelta(hours=activity_duration_hrs)
            activity.estimated_arrival = current_time
            activity.estimated_departure = activity_departure_time
            new_itinerary_items.append(activity)
            
            if activity.estimated_cost_inr is not None: total_cost += activity.estimated_cost_inr
            current_time = activity_departure_time
            current_coords = (activity.lat, activity.lon)

        original_end_time = datetime.fromisoformat(original_req.end_datetime.replace('Z', '+00:00'))
        allowed_end_time = original_end_time + timedelta(hours=1)
        
        final_return_directions = await location_service.get_directions(http_client, current_coords, start_coords, travel_mode)
        final_arrival_time = current_time + timedelta(hours=final_return_directions['duration_hrs'])
        if final_arrival_time > allowed_end_time:
            raise HTTPException(status_code=400, detail="Adding this activity exceeds the trip time window by more than 1 hour.")
            
        final_travel_cost = constants.COST_BASE_FARE_INR_DRIVING + (final_return_directions['distance_km'] * constants.COST_PER_KM_INR_DRIVING) if travel_mode == "driving" else 0.0
        new_itinerary_items.append(itinerary_schemas.ItineraryItem(
            leg_type='TRAVEL', activity="Travel back to start location",
            estimated_duration_hrs=final_return_directions['duration_hrs'],
            estimated_cost_inr=final_travel_cost, distance_km=final_return_directions['distance_km'],
            estimated_arrival=final_arrival_time, estimated_departure=current_time,
            overview_polyline=final_return_directions.get('overview_polyline')
        ))
        total_cost += final_travel_cost

        final_response = itinerary_schemas.ItineraryResponse(
            itinerary=new_itinerary_items,
            total_estimated_cost=round(total_cost, 2),
            start_lat=start_coords[0],
            start_lon=start_coords[1],
            custom_heading=payload.current_heading or "Your Updated Trip",
            weather_info=payload.current_weather,
            notes="Your itinerary has been updated with the new activity."
        )
        
        trip_uuid_to_update = payload.current_itinerary[0].trip_uuid if payload.current_itinerary and hasattr(payload.current_itinerary[0], 'trip_uuid') else None
        if trip_uuid_to_update:
            stmt = select(models.all_models.UserTrip).where(models.all_models.UserTrip.trip_uuid == trip_uuid_to_update, models.all_models.UserTrip.user_id == current_user.id)
            result = await db.execute(stmt)
            trip_to_update = result.scalars().first()
            if trip_to_update:
                logger.info(f"Updating trip {trip_uuid_to_update} in DB with new itinerary.")
                final_response.trip_uuid = trip_uuid_to_update
                trip_to_update.generated_itinerary_response = final_response.model_dump(mode='json')
                trip_to_update.updated_at = datetime.now(dt_timezone.utc)
                db.add(trip_to_update)
                await db.commit()
        else:
            logger.warning("Could not find a trip UUID to update after insertion.")

        return final_response
    except LocationServiceError as e:
        logger.error(f"Failed to insert activity due to a critical routing error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not calculate route to new activity: routing service unavailable.")
    except Exception as e:
        logger.error(f"Unexpected error in insert_activity_into_itinerary: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred while updating your itinerary.")