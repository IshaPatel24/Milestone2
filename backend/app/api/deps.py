from typing import Generator, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.security import decode_access_token
from backend.app.db.session import SessionLocal
from backend.app.models.patient import Patient
from backend.app.services.auth_service import AuthService

security_bearer = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    """Database session generator."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_token_from_request(
    request: Request,
    bearer_auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[str]:
    """
    Extracts token from HttpOnly cookie first, then falls back to Authorization Bearer header.
    """
    # 1. Prefer HttpOnly cookie
    cookie_token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if cookie_token:
        return cookie_token

    # 2. Fall back to Authorization: Bearer <token>
    if bearer_auth and bearer_auth.credentials:
        return bearer_auth.credentials

    return None

def get_current_patient(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db)
) -> Patient:
    """
    Validates authenticated patient from token.
    Enforces that patients can only access their own profile.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    patient_id_str = payload.get("sub")
    if not patient_id_str:
        raise credentials_exception

    try:
        patient_id = int(patient_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    patient = AuthService.get_by_id(db, patient_id=patient_id)
    if not patient:
        raise credentials_exception

    if not patient.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account has been deactivated. Please contact clinic support.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return patient
