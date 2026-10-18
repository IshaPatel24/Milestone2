import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict
from app.models.patient import GenderEnum

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_\-+=\[\]{}|;:,.<>]{8,128}$"
)

class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50, description="Patient's first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="Patient's last name")
    email: EmailStr = Field(..., description="Valid patient email address")
    gender: GenderEnum = Field(..., description="Gender selection")
    medical_condition: Optional[str] = Field(None, max_length=2000, description="Optional medical conditions, allergies, or notes")
    preferred_language: str = Field(default="English", min_length=2, max_length=50, description="Preferred communication language")

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def clean_name(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Name cannot be empty or only whitespace")
            return cleaned
        return v

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("medical_condition", mode="before")
    @classmethod
    def clean_medical_condition(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v

    @field_validator("preferred_language", mode="before")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = v.strip()
            if not cleaned:
                return "English"
            return cleaned
        return "English"

class PatientCreate(PatientBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password meeting security complexity requirements"
    )
    confirm_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password confirmation must match password"
    )

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[@$!%*?&#^()_\-+=\[\]{}|;:,.<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @model_validator(mode="after")
    def verify_passwords_match(self) -> "PatientCreate":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class PatientPublic(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    gender: Optional[str] = None
    medical_condition: Optional[str] = None
    preferred_language: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PatientLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = Field(default=False)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v
