from typing import Optional
from pydantic import BaseModel
from app.schemas.patient import PatientPublic

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    patient: PatientPublic

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
