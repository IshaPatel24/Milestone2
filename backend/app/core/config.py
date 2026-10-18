import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Healthcare Patient Portal"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "super-secret-development-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REMEMBER_ME_EXPIRE_DAYS: int = 30
    
    # Cookie Configuration
    AUTH_COOKIE_NAME: str = "patient_access_token"
    SECURE_COOKIES: bool = False  # Set to True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    # Stored in dedicated data directory under backend
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'data' / 'patient_portal.db'}"

    # Rate Limiting (per minute for auth endpoints)
    AUTH_RATE_LIMIT_PER_MINUTE: int = 15

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

settings = Settings()

# Ensure dedicated data directory exists
(BACKEND_DIR / "data").mkdir(parents=True, exist_ok=True)
