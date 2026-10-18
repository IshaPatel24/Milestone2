from datetime import timedelta
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.security import create_access_token
from backend.app.db.session import get_db_session
from backend.app.api.deps import get_db, get_current_patient
from backend.app.models.patient import Patient
from backend.app.schemas.patient import PatientCreate, PatientLogin, PatientPublic
from backend.app.schemas.auth import TokenResponse, MessageResponse
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=PatientPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new patient account",
    description="Registers a new patient with validated profile fields and Argon2id password hashing."
)
def register(
    patient_in: PatientCreate,
    db: Session = Depends(get_db)
) -> PatientPublic:
    """Creates a new patient record in the database."""
    patient = AuthService.register_patient(db, patient_in)
    return PatientPublic.model_validate(patient)

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Patient login",
    description="Authenticates patient credentials and sets an HttpOnly session cookie."
)
def login(
    login_data: PatientLogin,
    response: Response,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """Verifies credentials, generates JWT access token, and sets secure HttpOnly cookie."""
    patient = AuthService.authenticate_patient(db, login_data)

    if login_data.remember_me:
        expires_seconds = settings.REMEMBER_ME_EXPIRE_DAYS * 24 * 3600
        expires_delta = timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS)
    else:
        expires_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        subject=patient.id,
        email=patient.email,
        expires_delta=expires_delta,
        remember_me=login_data.remember_me
    )

    # Set secure HttpOnly cookie for browser-based authentication
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=access_token,
        max_age=expires_seconds,
        expires=expires_seconds,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_seconds,
        patient=PatientPublic.model_validate(patient)
    )

@router.get(
    "/me",
    response_model=PatientPublic,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated patient profile",
    description="Returns the profile of the authenticated patient from validated session."
)
def get_current_user_profile(
    current_patient: Patient = Depends(get_current_patient)
) -> PatientPublic:
    """Retrieves safe profile for currently authenticated patient."""
    return PatientPublic.model_validate(current_patient)

@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout patient",
    description="Invalidates browser session by clearing the HttpOnly authentication cookie."
)
def logout(response: Response) -> MessageResponse:
    """Clears the authentication cookie and ends session."""
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite=settings.COOKIE_SAMESITE
    )
    return MessageResponse(message="Successfully logged out of patient portal.")
