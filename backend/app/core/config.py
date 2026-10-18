import os
import sys
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

# Ensure both backend/ and the parent workspace root are on sys.path
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(BACKEND_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR.parent))

class Settings(BaseSettings):
    APP_NAME: str = "Healthcare Patient Portal"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & Tokens
    SECRET_KEY: str = "super-secret-development-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REMEMBER_ME_EXPIRE_DAYS: int = 30

    # Cookie Configuration
    AUTH_COOKIE_NAME: str = "patient_access_token"
    SECURE_COOKIES: bool = False  # Set to True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"  # Set to "none" for cross-subdomain Vercel deployment

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://milestone2.vercel.app",
    ]
    # Regex to permit Vercel preview branch deployments (e.g. milestone2-git-main-*.vercel.app)
    CORS_ORIGIN_REGEX: Optional[str] = r"^https://milestone2.*\.vercel\.app$"

    # Database Configuration (supports Neon PostgreSQL & SQLite)
    # Stored in dedicated data directory under backend if SQLite is used
    DATABASE_URL: str = ""

    # Serverless pooling: NullPool avoids stale/exhausted connections in serverless functions
    DB_POOL_NULL: bool = True

    # Rate Limiting (per minute for sensitive auth endpoints)
    AUTH_RATE_LIMIT_PER_MINUTE: int = 30

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: Optional[str]) -> str:
        """
        Normalizes database URL for SQLAlchemy compatibility:
        - Defaults to local SQLite if empty.
        - Translates deprecated 'postgres://' URI scheme to 'postgresql://'.
        """
        if not v or not str(v).strip():
            return f"sqlite:///{BACKEND_DIR / 'data' / 'patient_portal.db'}"
        url = str(v).strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000", "https://milestone2.vercel.app"]

    @model_validator(mode="after")
    def validate_cookie_security(self) -> "Settings":
        """
        Browsers mandate that SameSite=None cookies MUST have Secure=True.
        Automatically enforce Secure=True when SameSite is None or in production.
        """
        if self.COOKIE_SAMESITE.lower() == "none" or self.ENVIRONMENT == "production":
            self.SECURE_COOKIES = True
        return self

settings = Settings()

# Ensure dedicated data directory exists if SQLite fallback is used
if settings.DATABASE_URL.startswith("sqlite"):
    (BACKEND_DIR / "data").mkdir(parents=True, exist_ok=True)
