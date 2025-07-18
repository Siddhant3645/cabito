# /backend/core/config.py (Complete)

from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

# --- Explicit Path to .env file ---
env_path = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    """
    Manages application settings and secrets loaded from the environment.
    """
    PROJECT_NAME: str = "Cabito API"
    
    # --- Critical secrets - NO DEFAULTS! ---
    SECRET_KEY: str
    DATABASE_URL: str
    GOOGLE_API_KEY_GEMINI: str
    OPENROUTESERVICE_API_KEY: str # <<< ADD THIS LINE

    # --- Configuration with sensible defaults ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    ALGORITHM: str = "HS256"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "https://www.cabito.co.in"]
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = env_path
        case_sensitive = True

# Create a single, importable instance of the settings.
settings = Settings()