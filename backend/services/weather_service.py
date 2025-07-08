# /backend/services/weather_service.py (Corrected for Time Accuracy)

import logging
from datetime import datetime, timezone as dt_timezone, timedelta
import httpx
from typing import Optional, Dict, Any
import google.generativeai as genai

from schemas import itinerary_schemas
from core.constants import DEFAULT_WEATHER_CONDITION_OBJ, WMO_CODE_DESCRIPTIONS_DICT

logger = logging.getLogger(__name__)


async def generate_weather_ai_sentence(
    gemini_model: genai.GenerativeModel,
    condition_desc: str,
    temp_c: float,
    is_day: Optional[int],
    time_of_day: Optional[str],
    precip_prob: int,
    wind_kmh: float
) -> Optional[str]:
    """Generates a friendly weather summary sentence using the AI model."""
    if not gemini_model:
        logger.warning("Gemini client not provided for weather sentence generation.")
        return None

    day_night_info = "daytime" if is_day == 1 else "nighttime" if is_day == 0 else ""
    prompt_parts = [
        "You are 'Cabito', an AI travel assistant providing a very short, friendly weather update.",
        f"The current weather is: {condition_desc.lower()}. Temperature: around {temp_c:.0f}°C.",
        f"It's currently {time_of_day.lower() if time_of_day else day_night_info}."
    ]
    if precip_prob > 40:
        prompt_parts.append(f"There's a {precip_prob}% chance of rain.")
    if wind_kmh > 15:
        prompt_parts.append(f"It's a bit windy ({wind_kmh:.0f} km/h).")
    prompt_parts.append("Generate a single, concise, friendly, and slightly witty sentence (max 20-25 words) advising the user.")

    weather_prompt = "\n".join(prompt_parts)

    try:
        gen_config = genai.types.GenerationConfig(candidate_count=1, max_output_tokens=60, temperature=0.7)
        response = await gemini_model.generate_content_async(weather_prompt, generation_config=gen_config)
        return response.text.strip() if response.text else None
    except Exception as e:
        logger.error(f"Gemini weather sentence error: {e}")
        return None


async def get_weather_forecast(
    latitude: float,
    longitude: float,
    itinerary_start_dt_utc: datetime,
    http_client: httpx.AsyncClient,
    gemini_model: genai.GenerativeModel
) -> Optional[itinerary_schemas.WeatherForecast]:
    """Fetches and processes weather forecast data from the Open-Meteo API."""
    if not http_client:
        logger.warning("Weather forecast: HTTP client not available.")
        return None

    date_str = itinerary_start_dt_utc.strftime("%Y-%m-%d")
    base_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,apparent_temperature,precipitation_probability,weathercode,wind_speed_10m,is_day",
        "start_date": date_str,
        "end_date": date_str,
        "timezone": "auto"
    }

    try:
        response = await http_client.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        hourly_data = data.get("hourly", {})
        times = hourly_data.get("time", [])
        utc_offset_seconds = data.get("utc_offset_seconds", 0)

        if not times:
            logger.warning("Weather API response missing hourly data.")
            return None

        # --- REFINED LOGIC for finding the correct forecast hour ---
        local_tz = dt_timezone(timedelta(seconds=utc_offset_seconds))
        start_time_local = itinerary_start_dt_utc.astimezone(local_tz)
        
        # Round the user's start time to the nearest hour to match the API's hourly forecast
        target_hour_dt = start_time_local.replace(minute=0, second=0, microsecond=0)
        if start_time_local.minute >= 30:
            target_hour_dt += timedelta(hours=1)
        
        target_time_str = target_hour_dt.strftime('%Y-%m-%dT%H:%M')
        
        try:
            relevant_idx = times.index(target_time_str)
        except ValueError:
            logger.warning(f"Could not find exact weather match for {target_time_str}, falling back to closest time.")
            hourly_datetimes_local = [datetime.fromisoformat(t).replace(tzinfo=local_tz) for t in times]
            time_diffs = [abs(itinerary_start_dt_utc - dt) for dt in hourly_datetimes_local]
            relevant_idx = time_diffs.index(min(time_diffs))
        # --- END REFINED LOGIC ---

        if not (0 <= relevant_idx < len(times)):
             logger.error("Weather data processing failed: relevant_idx is out of bounds.")
             return None

        local_hour_dt = datetime.fromisoformat(times[relevant_idx])
        local_hour = local_hour_dt.hour
        time_of_day_descriptor = "Morning" if 5 <= local_hour < 12 else "Afternoon" if 12 <= local_hour < 17 else "Evening" if 17 <= local_hour < 21 else "Night"

        temp_c_val = hourly_data.get("temperature_2m")[relevant_idx]
        precip_prob_val = hourly_data.get("precipitation_probability")[relevant_idx]
        wind_kmh_val = hourly_data.get("wind_speed_10m")[relevant_idx]
        raw_code = hourly_data.get("weathercode")[relevant_idx]
        current_is_day = hourly_data.get("is_day")[relevant_idx]
        condition = WMO_CODE_DESCRIPTIONS_DICT.get(raw_code, DEFAULT_WEATHER_CONDITION_OBJ)

        ai_sentence = await generate_weather_ai_sentence(
            gemini_model=gemini_model,
            condition_desc=condition.description,
            temp_c=temp_c_val,
            is_day=current_is_day,
            time_of_day=time_of_day_descriptor,
            precip_prob=precip_prob_val,
            wind_kmh=wind_kmh_val
        )

        return itinerary_schemas.WeatherForecast(
            temperature_celsius=temp_c_val,
            feels_like_celsius=hourly_data.get("apparent_temperature")[relevant_idx],
            precipitation_probability_percent=precip_prob_val,
            wind_speed_kmh=wind_kmh_val,
            condition=itinerary_schemas.WeatherCondition(
                description=condition.description,
                icon_char=condition.icon_char
            ),
            raw_code=raw_code,
            is_day=current_is_day,
            time_of_day_descriptor=time_of_day_descriptor,
            ai_weather_sentence=ai_sentence,
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching weather: {e.response.status_code}", exc_info=True)
    except (KeyError, IndexError) as e:
        logger.error(f"Error processing weather data, likely missing key or index: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"An unexpected error occurred while processing weather data: {e}", exc_info=True)

    return None