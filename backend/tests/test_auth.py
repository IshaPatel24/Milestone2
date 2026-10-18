import pytest
from fastapi import status
from sqlalchemy.orm import Session

from backend.app.models.patient import Patient
from backend.app.core.security import verify_password
from backend.app.core.config import settings

VALID_REGISTRATION_DATA = {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "gender": "female",
    "medical_condition": "Mild seasonal allergies, takes cetirizine as needed.",
    "preferred_language": "English",
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!"
}

def test_successful_registration(client, db_session: Session):
    response = client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Doe"
    assert data["email"] == "jane.doe@example.com"
    assert data["gender"] == "female"
    assert data["medical_condition"] == "Mild seasonal allergies, takes cetirizine as needed."
    assert data["preferred_language"] == "English"
    assert data["is_active"] is True
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data

def test_missing_required_fields(client):
    incomplete_data = {
        "first_name": "John",
        "email": "incomplete@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=incomplete_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_invalid_email(client):
    invalid_data = {**VALID_REGISTRATION_DATA, "email": "not-an-email-address"}
    response = client.post("/api/v1/auth/register", json=invalid_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_password_confirmation_mismatch(client):
    mismatched_data = {
        **VALID_REGISTRATION_DATA,
        "email": "mismatch@example.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!"
    }
    response = client.post("/api/v1/auth/register", json=mismatched_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert any("Passwords do not match" in err.get("message", "") for err in data.get("errors", []))

def test_duplicate_email_registration(client):
    # First registration
    res1 = client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)
    assert res1.status_code == status.HTTP_201_CREATED

    # Duplicate registration with different casing and whitespace
    duplicate_data = {
        **VALID_REGISTRATION_DATA,
        "first_name": "Another",
        "last_name": "Person",
        "email": "  JANE.DOE@example.com  "
    }
    res2 = client.post("/api/v1/auth/register", json=duplicate_data)
    assert res2.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in res2.json()["detail"].lower()

def test_password_hashing_verification(client, db_session: Session):
    response = client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)
    assert response.status_code == status.HTTP_201_CREATED

    patient = db_session.query(Patient).filter(Patient.email == "jane.doe@example.com").first()
    assert patient is not None
    # Verify Argon2id hash format
    assert patient.password_hash.startswith("$argon2id$")
    # Verify plain text password is not stored anywhere
    assert patient.password_hash != VALID_REGISTRATION_DATA["password"]
    # Verify Argon2 verification succeeds
    assert verify_password(VALID_REGISTRATION_DATA["password"], patient.password_hash) is True
    assert verify_password("WrongPassword123!", patient.password_hash) is False

def test_successful_login(client):
    # Register first
    client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)

    # Login
    login_payload = {
        "email": "jane.doe@example.com",
        "password": VALID_REGISTRATION_DATA["password"],
        "remember_me": True
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["patient"]["email"] == "jane.doe@example.com"
    assert "password_hash" not in data["patient"]

    # Verify HttpOnly cookie is set
    cookies = response.cookies
    assert settings.AUTH_COOKIE_NAME in cookies
    assert cookies[settings.AUTH_COOKIE_NAME] == data["access_token"]

def test_login_incorrect_password(client):
    client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)

    response = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@example.com",
        "password": "WrongPassword999!"
    })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid email address or password" in response.json()["detail"].lower()

def test_login_unknown_email_generic_failure(client):
    # Ensures no user enumeration
    response = client.post("/api/v1/auth/login", json={
        "email": "does.not.exist@example.com",
        "password": "Password123!"
    })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid email address or password" in response.json()["detail"].lower()

def test_inactive_patient_login(client, db_session: Session):
    # Register patient
    client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)
    # Deactivate account directly in database
    patient = db_session.query(Patient).filter(Patient.email == "jane.doe@example.com").first()
    patient.is_active = False
    db_session.commit()

    response = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@example.com",
        "password": VALID_REGISTRATION_DATA["password"]
    })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "deactivated" in response.json()["detail"].lower()

def test_authenticated_me_request(client):
    # Register and login
    client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)
    login_res = client.post("/api/v1/auth/login", json={
        "email": "jane.doe@example.com",
        "password": VALID_REGISTRATION_DATA["password"]
    })
    token = login_res.json()["access_token"]

    # Test via HttpOnly cookie (cookie jar maintained by TestClient)
    me_res_cookie = client.get("/api/v1/auth/me")
    assert me_res_cookie.status_code == status.HTTP_200_OK
    assert me_res_cookie.json()["email"] == "jane.doe@example.com"

    # Test via Authorization Bearer header
    client.cookies.clear()
    me_res_header = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res_header.status_code == status.HTTP_200_OK
    assert me_res_header.json()["email"] == "jane.doe@example.com"

def test_unauthenticated_me_request(client):
    client.cookies.clear()
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_logout_and_session_invalidation(client):
    client.post("/api/v1/auth/register", json=VALID_REGISTRATION_DATA)
    client.post("/api/v1/auth/login", json={
        "email": "jane.doe@example.com",
        "password": VALID_REGISTRATION_DATA["password"]
    })

    # Verify authenticated before logout
    assert client.get("/api/v1/auth/me").status_code == status.HTTP_200_OK

    # Call logout
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == status.HTTP_200_OK
    assert "logged out" in logout_res.json()["message"].lower()

    # Verify cookie was cleared
    # In FastAPI/Starlette, deleting cookie sets its value to "" and expires in the past
    cookie_val = client.cookies.get(settings.AUTH_COOKIE_NAME)
    assert cookie_val is None or cookie_val == ""

def test_patient_data_isolation(client):
    # Register Patient A
    client.post("/api/v1/auth/register", json={
        **VALID_REGISTRATION_DATA,
        "first_name": "Alice",
        "email": "alice@example.com"
    })
    # Register Patient B
    client.post("/api/v1/auth/register", json={
        **VALID_REGISTRATION_DATA,
        "first_name": "Bob",
        "email": "bob@example.com"
    })

    # Login as Alice
    client.post("/api/v1/auth/login", json={
        "email": "alice@example.com",
        "password": VALID_REGISTRATION_DATA["password"]
    })

    # Alice requests /me
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == status.HTTP_200_OK
    data = me_res.json()
    assert data["first_name"] == "Alice"
    assert data["email"] == "alice@example.com"
    assert data["email"] != "bob@example.com"

def test_database_persistence(client, db_session: Session):
    response = client.post("/api/v1/auth/register", json={
        **VALID_REGISTRATION_DATA,
        "first_name": "Persistent",
        "last_name": "Patient",
        "email": "persistent@example.com",
        "preferred_language": "Hindi"
    })
    assert response.status_code == status.HTTP_201_CREATED
    patient_id = response.json()["id"]

    # Verify directly via a fresh database query
    db_patient = db_session.query(Patient).filter(Patient.id == patient_id).first()
    assert db_patient is not None
    assert db_patient.first_name == "Persistent"
    assert db_patient.last_name == "Patient"
    assert db_patient.email == "persistent@example.com"
    assert db_patient.preferred_language == "Hindi"
    assert db_patient.created_at is not None
    assert db_patient.updated_at is not None
