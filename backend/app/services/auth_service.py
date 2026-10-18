import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from backend.app.models.patient import Patient
from backend.app.schemas.patient import PatientCreate, PatientLogin
from backend.app.core.security import hash_password, verify_password

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Patient]:
        """Find a patient by case-insensitive normalized email."""
        normalized_email = email.strip().lower()
        return db.query(Patient).filter(Patient.email == normalized_email).first()

    @staticmethod
    def get_by_id(db: Session, patient_id: int) -> Optional[Patient]:
        """Find a patient by primary key ID."""
        return db.query(Patient).filter(Patient.id == patient_id).first()

    @classmethod
    def register_patient(cls, db: Session, patient_in: PatientCreate) -> Patient:
        """
        Registers a new patient with Argon2id password hashing.
        Validates duplicate email and never persists plain text password.
        """
        normalized_email = patient_in.email.strip().lower()

        # Check for existing patient with same email
        existing_patient = cls.get_by_email(db, normalized_email)
        if existing_patient:
            logger.warning("Registration attempt with already registered email")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        # Hash password securely using Argon2id
        hashed_password = hash_password(patient_in.password)

        # Create Patient model record (confirm_password is never persisted)
        db_patient = Patient(
            first_name=patient_in.first_name.strip(),
            last_name=patient_in.last_name.strip(),
            email=normalized_email,
            gender=patient_in.gender.value if hasattr(patient_in.gender, "value") else str(patient_in.gender),
            medical_condition=patient_in.medical_condition,
            preferred_language=patient_in.preferred_language,
            password_hash=hashed_password,
            is_active=True
        )

        try:
            db.add(db_patient)
            db.commit()
            db.refresh(db_patient)
            logger.info("Patient successfully registered with ID %s", db_patient.id)
            return db_patient
        except IntegrityError:
            db.rollback()
            logger.warning("IntegrityError during registration for email")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )
        except Exception as e:
            db.rollback()
            logger.error("Unexpected error during patient registration: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while creating your account. Please try again."
            )

    @classmethod
    def authenticate_patient(cls, db: Session, login_data: PatientLogin) -> Patient:
        """
        Authenticates a patient using email and password.
        Uses generic error messages to avoid user enumeration.
        """
        normalized_email = login_data.email.strip().lower()
        patient = cls.get_by_email(db, normalized_email)

        # Generic error message to prevent account enumeration
        generic_error = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if not patient:
            # Constant-time dummy verify can prevent timing attacks if desired,
            # but Argon2id on empty hash can also be evaluated.
            logger.info("Authentication failed: user not found")
            raise generic_error

        if not verify_password(login_data.password, patient.password_hash):
            logger.info("Authentication failed: invalid password")
            raise generic_error

        if not patient.is_active:
            logger.warning("Authentication failed: inactive account ID %s", patient.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been deactivated. Please contact clinic support.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return patient
