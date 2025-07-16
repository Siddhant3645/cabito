# /backend/services/ai_service.py (Complete File with Timeouts)

import logging
import json
import asyncio # <<< ADD THIS IMPORT
import google.generativeai as genai
from typing import Optional, List, Dict, Any

from models.all_models import UserTrip
from core import constants
from schemas import itinerary_schemas

logger = logging.getLogger(__name__)

# Define a global timeout for all AI calls to keep it consistent
AI_CALL_TIMEOUT_SECONDS = 20.0


async def analyze_description_for_keywords_and_prefs(
    gemini_model: genai.GenerativeModel,
    description: str,
    available_preferences: List[str]
) -> Dict[str, List[str]]:
    """
    Analyzes a user's description to both extract keywords and map to predefined preferences
    in a single, robust AI call.
    Returns a dictionary with 'keywords' and 'mapped_preferences'.
    """
    if not all([gemini_model, description.strip(), available_preferences]):
        return {"keywords": [], "mapped_preferences": []}

    prompt = (
        "You are an expert travel data analyst. Your task is to analyze a user's trip description and perform two actions:\n"
        "1. Extract specific, tangible keywords or short phrases (nouns, places, activities).\n"
        "2. Map the user's overall intent to a list of predefined preference categories.\n\n"
        
        f"The predefined preference categories you must use for mapping are: {available_preferences}\n\n"
        
        "Return a single, valid JSON object with two keys: \"keywords\" and \"mapped_preferences\".\n\n"
        
        "--- Examples ---\n"
        "User Description: \"I want a relaxed afternoon visiting historical temples and enjoying some local street food.\"\n"
        "JSON Output: {\"keywords\": [\"historical temples\", \"local street food\"], \"mapped_preferences\": [\"history\", \"foodie\"]}\n\n"
        
        "User Description: \"Looking for quirky, unique shops and a cool cafe with great coffee.\"\n"
        "JSON Output: {\"keywords\": [\"quirky shops\", \"unique shops\", \"cool cafe\", \"great coffee\"], \"mapped_preferences\": [\"shopping\", \"foodie\"]}\n\n"

        "User Description: \"I'd like to see the Bara Imambara and maybe some Mughal architecture.\"\n"
        "JSON Output: {\"keywords\": [\"Bara Imambara\", \"Mughal architecture\"], \"mapped_preferences\": [\"history\", \"sights\"]}\n\n"
        
        "User Description: \"I just want to find a nice place to eat.\"\n"
        "JSON Output: {\"keywords\": [\"nice place to eat\", \"restaurants\"], \"mapped_preferences\": [\"foodie\"]}\n\n"

        "User Description: \"I'm not sure, just show me something interesting.\"\n"
        "JSON Output: {\"keywords\": [], \"mapped_preferences\": []}\n\n"

        "--- End of Examples ---\n\n"
        
        f"User Description: \"{description}\"\n"
        "JSON Output:"
    )

    try:
        generation_config = genai.types.GenerationConfig(
            candidate_count=1, max_output_tokens=250, temperature=0.2, response_mime_type="application/json"
        )
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)
        
        if response.text:
            analysis_result = json.loads(response.text)
            keywords = analysis_result.get("keywords", [])
            mapped_prefs = analysis_result.get("mapped_preferences", [])
            
            if isinstance(keywords, list) and isinstance(mapped_prefs, list):
                logger.info(f"AI analysis result: keywords={keywords}, mapped_prefs={mapped_prefs}")
                return {"keywords": [k.lower() for k in keywords], "mapped_preferences": mapped_prefs}

    except asyncio.TimeoutError:
        logger.warning("AI description analysis timed out.")
    except Exception as e:
        logger.error(f"AI description analysis error: {e}", exc_info=True)

    return {"keywords": [], "mapped_preferences": []}


async def get_dynamic_local_keywords_for_preference(
    gemini_model: genai.GenerativeModel,
    city: str,
    preference: str
) -> List[str]:
    """Gets hyper-local, specific keywords for a preference to improve search quality."""
    if not all([gemini_model, city, preference]):
        return []

    example_text = constants.PROMPT_EXAMPLES_FOR_PREFERENCES.get(preference)
    if not example_text:
        return []
    
    if preference == 'shopping':
        example_text += " For Lucknow, this would include 'Chikankari embroidery' or 'Attar perfumes'."

    prompt = (
        f"You are an expert local guide for the city of '{city.title()}'. Your goal is to suggest specific, queryable keywords for a tourist interested in '{preference}'. "
        f"These should be unique local aspects, not generic terms. {example_text}\n"
        f"Return your response ONLY as a JSON formatted list of strings. If no truly iconic or unique local aspects come to mind, return an empty list."
    )
    
    try:
        generation_config = genai.types.GenerationConfig(
            candidate_count=1, max_output_tokens=100, temperature=0.2, response_mime_type="application/json"
        )
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)

        if response.text:
            keywords = json.loads(response.text)
            if isinstance(keywords, list) and all(isinstance(k, str) for k in keywords):
                logger.info(f"Dynamically fetched keywords for '{preference}': {keywords}")
                return [k.lower() for k in keywords]
    except asyncio.TimeoutError:
        logger.warning(f"Dynamic keywords AI call for '{preference}' timed out.")
    except Exception as e:
        logger.error(f"Dynamic keywords AI error for '{preference}': {e}", exc_info=True)
    return []


async def generate_creative_trip_title(
    gemini_model: genai.GenerativeModel,
    city: str,
    preferences: List[str],
    itinerary_items: List[itinerary_schemas.ItineraryItem]
) -> str:
    if not gemini_model:
        return f"Your Trip to {city.title()}"
    try:
        if not preferences:
            pref_str = "discovery and exploration"
        elif len(preferences) == 1:
            pref_str = f"a {preferences[0]} experience"
        else:
            pref_str = f"{', '.join(preferences[:-1])} and {preferences[-1]}"
        activity_names = [item.activity for item in itinerary_items if item.leg_type == 'ACTIVITY']
        activity_summary = ""
        if activity_names:
            summary_list = activity_names[:3]
            activity_summary = f"The plan includes visiting {', '.join(summary_list)}"
            if len(activity_names) > 3:
                activity_summary += " and more."
            else:
                activity_summary += "."
        prompt = (
            f"You are a creative travel writer. A user is planning a trip to '{city.title()}' with an interest in {pref_str}. "
            f"{activity_summary} "
            "Based on this, create one captivating and friendly headline for their trip. Make it sound like a unique adventure. "
            "Maximum 15 words. Do not use quotes in the output. "
            "Example Style: \"Lucknow's Culinary Secrets: Your Foodie Adventure Awaits!\""
        )
        generation_config = genai.types.GenerationConfig(candidate_count=1, max_output_tokens=60, temperature=0.7)
        
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)

        title = response.text.strip().replace('"', '')
        if title:
            logger.info(f"Generated creative title: {title}")
            return title
    except asyncio.TimeoutError:
        logger.warning("Creative title generation timed out.")
    except Exception as e:
        logger.error(f"Creative title generation failed: {e}")
    return f"Your Adventure in {city.title()}"


async def generate_ai_insight(
    gemini_model: genai.GenerativeModel,
    place_name: str,
    description: Optional[str],
    user_preferences: List[str]
) -> Optional[str]:
    """Generates a concise 'Cabito Tip' for a specific place."""
    if not gemini_model:
        return None
    
    try:
        pref_str = f"The user is interested in {', '.join(user_preferences)}." if user_preferences else ""
        
        prompt = (
            f"You are 'Cabito', a witty and knowledgeable travel assistant. "
            f"For the place named '{place_name}', which is described as: '{description or 'a place of interest'}', "
            f"{pref_str} "
            "Provide a single, concise, and helpful tip (max 20-25 words). "
            "It should be a practical tip, a fun fact, or an insider's secret. Make it unique and engaging. "
            "IMPORTANT: Do NOT add a prefix like 'Cabito Tip:' to your response. Just provide the tip itself."
        )
        
        generation_config = genai.types.GenerationConfig(candidate_count=1, max_output_tokens=60, temperature=0.75)
        
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)

        return response.text.strip().replace('"', '') if response.text else None
    except asyncio.TimeoutError:
        logger.warning(f"AI insight generation timed out for {place_name}.")
    except Exception as e:
        logger.error(f"AI insight generation failed for {place_name}: {e}")
        return None


async def generate_serendipity_suggestion_text(
    gemini_model: genai.GenerativeModel,
    place_to_suggest: Dict[str, Any],
    user_preferences: List[str],
    target_city: Optional[str] = None
) -> Optional[str]:
    if not gemini_model:
        return "Here's a spontaneous idea for you!"
    place_name = place_to_suggest.get("activity", "a nearby spot")
    description = place_to_suggest.get("description") or "a notable local attraction"
    prompt = (
        f"You are 'Cabito', an AI travel assistant. Your task is to write a short, engaging message inviting a user to visit a specific place.\n"
        f"The user is exploring {target_city or 'the area'}.\n"
        f"The specific place to suggest is: '{place_name}'.\n"
        f"A description of this place is: \"{description}\".\n\n"
        f"Your message MUST be about '{place_name}' and nothing else. "
        f"Start with an engaging hook like 'Fancy a detour?' or 'Feeling spontaneous?'. Make it sound exciting and easy. "
        f"The message should be a maximum of 2 short sentences or 30 words."
        f"Example for a different place: 'Feeling spontaneous? Just around the corner is La Pedrera, a true architectural marvel!'"
    )
    try:
        generation_config = genai.types.GenerationConfig(candidate_count=1, max_output_tokens=60, temperature=0.8)
        
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)

        return response.text.strip().replace('"', '') if response.text else f"✨ How about a quick visit to {place_name}?"
    except asyncio.TimeoutError:
         logger.warning(f"Serendipity text generation timed out for {place_name}.")
    except Exception as e:
        logger.error(f"Gemini serendipity text generation error for {place_name}: {e}")
    return f"✨ How about a quick visit to {place_name}?"


async def generate_ai_memory_snapshot_text(
    gemini_model: genai.GenerativeModel,
    trip: UserTrip
) -> Optional[str]:
    if not gemini_model:
        logger.warning(f"Memory Snapshot: Gemini client not provided for trip {trip.trip_uuid}.")
        return "AI Storyteller is currently taking a break."
    try:
        itinerary_data = trip.generated_itinerary_response
        if not isinstance(itinerary_data, dict):
            logger.error(f"Memory Snapshot: Invalid itinerary data type for trip {trip.trip_uuid}.")
            return "Could not retrieve itinerary details for this memory."
        trip_title = trip.trip_title or "Your Adventure"
        location = trip.location_display_name or "the area"
        start_date_str = trip.trip_start_datetime_utc.strftime("%A, %B %d, %Y")
        activities = [item for item in itinerary_data.get("itinerary", []) if item.get("leg_type") == "ACTIVITY"]
        if not activities:
            return f"Your trip to {location} on {start_date_str} was a quiet one, with no specific activities logged."
        activity_details_list = [f"- Visited '{act.get('activity', 'a mysterious place')}'." for act in activities[:5]]
        activities_summary = "\n".join(activity_details_list)
        if len(activities) > 5:
            activities_summary += f"\n... and {len(activities) - 5} other interesting stops!"
        prompt = (
            f"You are 'Cabito Memory Weaver'. A user completed a trip titled \"{trip_title}\" in {location} on {start_date_str}. "
            f"Key activities:\n{activities_summary}\n\nCraft a warm, whimsical, concise (3-5 sentences, ~80 words) 'Memory Snapshot' narrative. "
            f"Focus on the feeling of discovery. End on a memorable note."
        )
        generation_config = genai.types.GenerationConfig(candidate_count=1, max_output_tokens=200, temperature=0.75)
        
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)

        return response.text.strip() if response.text else "The details of this adventure seem to be written in the wind..."
    except asyncio.TimeoutError:
        logger.warning(f"Memory Snapshot generation timed out for trip {trip.trip_uuid}.")
    except Exception as e:
        logger.error(f"Memory Snapshot: Error generating AI narrative for trip {trip.trip_uuid}: {e}", exc_info=True)
    return "An unexpected gust of wind scattered the pages of this memory!"


async def validate_itinerary_with_ai(
    gemini_model: genai.GenerativeModel,
    itinerary_items: List[itinerary_schemas.ItineraryItem],
    city: str,
    preferences: List[str]
) -> List[str]:
    if not gemini_model or not itinerary_items:
        return []
    activity_names = [item.activity for item in itinerary_items if item.leg_type == 'ACTIVITY']
    
    prompt = (
        f"You are an expert, discerning trip planner for '{city}', creating a high-quality experience for a client whose interests are: {', '.join(preferences)}. "
        f"Perform a final quality check on this proposed list of activities: {activity_names}. "
        "Your task is to identify and list any items that are CLEARLY unsuitable for a tourist. "
        "This includes non-tourist infrastructure (e.g., 'Airtel Telecom Tower', 'Water Pumping Station'), "
        "blatant duplicates, or things that are nonsensical for a tourist itinerary. "
        "Crucially, also remove common, non-touristy commercial stores like 'Spencer's Supermarket', 'Reliance Fresh', 'Universal Stores', or generic 'Department Store' entries, "
        "unless they are a famous, iconic part of the city's experience (like Harrods in London). The focus is on unique, local, or interesting places for a traveler. "
        "Return ONLY a JSON formatted list of strings of the exact names of the activities to remove. "
        "If all activities are suitable, return an empty list. Example of what to remove: [\"Sewage Treatment Plant\", \"Spencer's\"]"
    )
    try:
        generation_config = genai.types.GenerationConfig(
            temperature=0.1, response_mime_type="application/json"
        )
        coro = gemini_model.generate_content_async(prompt, generation_config=generation_config)
        response = await asyncio.wait_for(coro, timeout=AI_CALL_TIMEOUT_SECONDS)

        rejected_names = json.loads(response.text)
        if isinstance(rejected_names, list):
            logger.info(f"AI validation as 'expert trip planner' rejected the following items: {rejected_names}")
            return rejected_names
    except asyncio.TimeoutError:
        logger.warning("AI validation check timed out. Proceeding without AI validation.")
    except Exception as e:
        logger.error(f"AI validation check failed: {e}")
    return []