# /backend/main.py (Complete File)

import logging
from contextlib import asynccontextmanager

import google.generativeai as genai
# import googlemaps # <<< Can be commented out or removed
import httpx
# import requests # <<< No longer needed
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# --- Corrected absolute imports for deployment ---
from api import auth, itinerary, trips, users
from core.config import settings
from core.limiter import limiter
from database import create_db_and_tables

logging.basicConfig(level=settings.LOG_LEVEL.upper(), format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application startup and shutdown events, including resource initialization."""
    logger.info(f"Starting up {settings.PROJECT_NAME}...")

    logger.info("Initializing database and creating tables...")
    await create_db_and_tables()
    logger.info("Database tables checked/created.")

    # --- CACHE INITIALIZATION ---
    try:
        redis = aioredis.from_url("redis://localhost", encoding="utf-8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
        logger.info("Redis cache backend initialized.")
    except Exception as e:
        logger.error(f"Could not connect to Redis for cache. Cache will be unavailable. Error: {e}")

    # --- HTTP & API CLIENT INITIALIZATION ---
    app.state.httpx_client = httpx.AsyncClient(timeout=90.0)
    app.state.gemini_model = None
    
    # --- OLD GOOGLE MAPS CLIENT INITIALIZATION (COMMENTED OUT) ---
    # app.state.gmaps_client = None 
    # if settings.MAPS_API_KEY:
    #     session = requests.Session()
    #     adapter = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=100)
    #     session.mount("https://", adapter)
    #     app.state.gmaps_client = googlemaps.Client(key=settings.MAPS_API_KEY, requests_session=session)
    #     logger.info("Google Maps client initialized with custom session.")
    # else:
    #     logger.warning("MAPS_API_KEY not set. Google Maps features will be unavailable.")

    if settings.GOOGLE_API_KEY_GEMINI:
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY_GEMINI)
            app.state.gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
            logger.info("Google Gemini client configured.")
        except Exception as e:
            logger.error(f"Failed to configure Google Gemini client. AI features may be disabled. Error: {e}")
            app.state.gemini_model = None
    else:
        logger.warning("GOOGLE_API_KEY_GEMINI not found. AI features will be disabled.")
    
    logger.info("Startup complete.")
    yield
    # --- SHUTDOWN LOGIC ---
    logger.info("Shutting down...")
    await app.state.httpx_client.aclose()
    logger.info("Shutdown complete.")


# Create the main FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="4.0.0",
    lifespan=lifespan
)

# Add Rate Limiting and Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware to allow the frontend to communicate with the API
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS enabled for origins: {settings.CORS_ORIGINS}")

# Include all the modular API routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(itinerary.router, prefix="/api/itinerary", tags=["Itinerary"])


@app.get("/health", tags=["System"])
def health_check():
    """A simple health check endpoint to confirm the server is running."""
    return {"status": "ok", "version": app.version}