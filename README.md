# Aegis Health Patient Portal — Milestone 2

> **Full-Stack Patient Registration, Login & Persistent Database Integration**  
> Architected for clinical privacy, modern usability, and secure healthcare authentication.

---

## 1. System Overview & Architecture

This repository delivers **Milestone 2** of the Patient Portal web application. It is a full-stack, production-grade system implementing secure patient registration, credential authentication, persistent SQLite database storage via SQLAlchemy and Alembic, and protected patient profile management.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Next.js Frontend (App Router)                 │
│  - /signup: Accessible two-column registration with live complexity    │
│  - /login: Centered auth card, generic error handling, remember-me     │
│  - /dashboard: Protected patient landing, masked medical notes         │
│  - React Hook Form + Zod validation | Tailwind CSS | Lucide React      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HttpOnly Cookie / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend API                           │
│  - Versioned REST API under /api/v1/auth                               │
│  - Argon2id Password Hashing (time_cost=2, memory=64MB, parallelism=1) │
│  - Signed JWT Access Tokens transmitted via HttpOnly, SameSite cookies │
│  - Sliding-window auth rate limiting (brute-force prevention)          │
│  - Pydantic v2 validation | Centralized exception handling             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy ORM & Alembic
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Dedicated SQLite Database                        │
│  - Stored in backend/data/patient_portal.db                            │
│  - Schema versioning via Alembic migrations                            │
│  - Unique lower-case email index, transaction-safe isolation           │
│  - Patient passwords NEVER stored in plain text or returned in API     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19 & TypeScript
- **Styling**: Tailwind CSS (calm healthcare palette: slate neutrals, muted teal accents)
- **Form Handling**: React Hook Form
- **Schema Validation**: Zod
- **Icons**: Lucide React
- **Typography**: Inter (Google Fonts)

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Validation**: Pydantic v2 & `pydantic-settings`
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic 1.13+
- **Password Hashing**: Argon2id via `argon2-cffi`
- **JWT Tokens**: `python-jose` (cryptography)
- **Server**: Uvicorn

### Database
- **Engine**: SQLite 3 (dedicated backend storage: `backend/data/patient_portal.db`)
- **Isolation**: Session scoped dependency injection (`get_db`) with automatic commit/rollback.

---

## 3. Repository Structure

```
Milestone2/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example              # Sample backend environment configuration
│   ├── requirements.txt          # Python dependencies
│   ├── alembic.ini               # Alembic configuration
│   ├── alembic/
│   │   ├── env.py                # Migration environment with SQLite batch support
│   │   └── versions/             # Auto-generated database migration scripts
│   ├── data/
│   │   └── patient_portal.db     # Persistent SQLite database file
│   ├── app/
│   │   ├── main.py               # FastAPI application, CORS, security headers
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic BaseSettings
│   │   │   ├── security.py       # Argon2id password hasher & JWT handlers
│   │   │   └── rate_limit.py     # Auth endpoint sliding-window rate limiter
│   │   ├── db/
│   │   │   ├── base.py           # DeclarativeBase
│   │   │   └── session.py        # SQLAlchemy engine and sessionmaker
│   │   ├── models/
│   │   │   └── patient.py        # Patient ORM model with indexes & constraints
│   │   ├── schemas/
│   │   │   ├── patient.py        # Patient registration, login, profile schemas
│   │   │   └── auth.py           # Token and message schemas
│   │   ├── services/
│   │   │   └── auth_service.py   # Registration, authentication, duplicate checks
│   │   └── api/
│   │       ├── deps.py           # get_db and get_current_patient dependencies
│   │       └── v1/
│   │           └── auth.py       # /register, /login, /me, /logout routes
│   └── tests/
│       ├── conftest.py           # Isolated test database fixture & TestClient
│       └── test_auth.py          # 15 comprehensive automated backend tests
└── frontend/
    ├── .env.example              # Sample frontend environment configuration
    ├── .env.local                # Local environment (NEXT_PUBLIC_API_URL)
    ├── package.json              # Next.js scripts & dependencies
    ├── tsconfig.json             # TypeScript configuration
    ├── app/
    │   ├── layout.tsx            # Inter typography, metadata, shell
    │   ├── globals.css           # Tailwind configuration
    │   ├── page.tsx              # Smart session check & auto-redirection
    │   ├── loading.tsx           # Global loading spinner
    │   ├── not-found.tsx         # Accessible 404 screen
    │   ├── error.tsx             # Global error boundary
    │   ├── signup/page.tsx       # Two-column patient registration page
    │   ├── login/page.tsx        # Authentication card with Remember Me
    │   └── dashboard/page.tsx    # Protected landing with medical data masking
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx        # Accessible button with spinner & icon states
    │   │   ├── Input.tsx         # Accessible input with error feedback
    │   │   ├── PasswordInput.tsx # Password input with show/hide toggle
    │   │   ├── Select.tsx        # Accessible dropdown selector
    │   │   ├── Textarea.tsx      # Medical condition textarea with helper text
    │   │   ├── Alert.tsx         # Notification, warning & error banners
    │   │   └── Navbar.tsx        # Portal navigation header & sign out
    │   └── auth/
    │       └── PasswordRequirementList.tsx # Dynamic security criteria checklist
    ├── lib/
    │   ├── api.ts                # API client with HttpOnly credentials
    │   └── validation.ts         # Zod schemas & password requirement checkers
    ├── types/
    │   └── index.ts              # TypeScript definitions
    └── tests/
        └── validation.test.ts    # 17 automated client validation tests
```

---

## 4. API Specification (`/api/v1`)

| Method | Endpoint | Description | Request Body | Response Codes |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Registers a new patient with Argon2id password hash | `PatientCreate` | `201 Created`, `409 Conflict`, `422 Unprocessable` |
| `POST` | `/api/v1/auth/login` | Authenticates credentials, sets `patient_access_token` cookie | `PatientLogin` | `200 OK`, `401 Unauthorized`, `422 Unprocessable` |
| `GET` | `/api/v1/auth/me` | Returns authenticated patient's safe profile | *None* (Cookie/Bearer) | `200 OK`, `401 Unauthorized` |
| `POST` | `/api/v1/auth/logout` | Clears HttpOnly session cookie | *None* | `200 OK` |
| `GET` | `/api/v1/health` | Health check for monitoring | *None* | `200 OK` |

### Registration Payload (`POST /api/v1/auth/register`)
```json
{
  "first_name": "Eleanor",
  "last_name": "Vance",
  "email": "eleanor.vance@healthcare.org",
  "gender": "female",
  "preferred_language": "English",
  "medical_condition": "Penicillin allergy. Mild asthma.",
  "password": "AegisHealth2026!",
  "confirm_password": "AegisHealth2026!"
}
```

### Response (`201 Created`)
```json
{
  "id": 1,
  "first_name": "Eleanor",
  "last_name": "Vance",
  "email": "eleanor.vance@healthcare.org",
  "gender": "female",
  "medical_condition": "Penicillin allergy. Mild asthma.",
  "preferred_language": "English",
  "is_active": true,
  "created_at": "2026-10-18T18:48:00.000000Z",
  "updated_at": "2026-10-18T18:48:00.000000Z"
}
```
*(Notice: `password_hash` and `confirm_password` are never returned)*.

---

## 5. Security & Privacy Features

1. **Argon2id Hashing**: Modern, memory-hard password hashing using `argon2-cffi` configured with 64 MB memory cost, 2 iterations, and a 32-byte digest to prevent GPU/ASIC rainbow-table cracking.
2. **HttpOnly Cookie Authentication**: The authentication token (`patient_access_token`) is transmitted as an `HttpOnly`, `SameSite=lax` cookie, preventing client-side JavaScript from reading or exfiltrating the token (mitigating XSS token theft).
3. **Medical Data Privacy Masking**: In the patient dashboard, sensitive health notes (allergies and chronic conditions) are masked by default behind a "View Medical Info" privacy toggle to prevent shoulder-surfing in public environments.
4. **Account Enumeration Prevention**: Login endpoint returns a generic failure (`"Invalid email address or password"`) for both incorrect passwords and non-existent email addresses.
5. **Rate Limiting**: Sliding-window in-memory rate limiter on authentication endpoints protects against brute-force password guessing.
6. **Security Headers**: Standard defense-in-depth headers applied on every HTTP response:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
7. **Patient Data Isolation**: The `/api/v1/auth/me` endpoint extracts the patient ID directly from the cryptographically verified JWT subject, guaranteeing that patients can only view their own records.

---

## 6. Local Setup and Installation

### Prerequisites
- Python 3.12+
- Node.js 18+ (tested on Node v26)
- npm 9+

---

### Step 1: Clone Repository and Configure Environment

```bash
cd /path/to/Milestone2

# Configure backend environment
cp backend/.env.example backend/.env

# Configure frontend environment
cp frontend/.env.example frontend/.env.local
```

---

### Step 2: Backend Setup & Database Migration

```bash
cd backend

# Create Python virtual environment
python3.12 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations to initialize tables
export PYTHONPATH=..
alembic upgrade head
```

---

### Step 3: Start the Backend API Server

```bash
# From the backend directory with venv activated:
export PYTHONPATH=..
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API is available at `http://127.0.0.1:8000`.  
Interactive OpenAPI documentation is at `http://127.0.0.1:8000/docs`.

---

### Step 4: Frontend Setup & Dev Server

Open a second terminal window:

```bash
cd frontend

# Install npm packages
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 7. Running Automated Tests

### Backend Test Suite (Pytest)
From the `backend/` directory:
```bash
source venv/bin/activate
export PYTHONPATH=..
pytest tests -v
```
**Backend Test Scenarios Covered (15/15 Passed):**
1. `test_successful_registration`: Creates patient, returns HTTP 201 without password fields.
2. `test_missing_required_fields`: Rejects missing mandatory fields with HTTP 422.
3. `test_invalid_email`: Rejects malformed email with HTTP 422.
4. `test_password_confirmation_mismatch`: Rejects differing passwords with HTTP 422.
5. `test_duplicate_email_registration`: Case-insensitive duplicate check returns HTTP 409 Conflict.
6. `test_password_hashing_verification`: Verifies Argon2id hash prefix and plain-text absence.
7. `test_successful_login`: Returns HTTP 200, JWT token, and sets HttpOnly cookie.
8. `test_login_incorrect_password`: Rejects wrong password with generic HTTP 401.
9. `test_login_unknown_email_generic_failure`: Rejects non-existent email with generic HTTP 401.
10. `test_inactive_patient_login`: Rejects deactivated account with HTTP 401 notice.
11. `test_authenticated_me_request`: Tests profile retrieval via HttpOnly cookie and Bearer token.
12. `test_unauthenticated_me_request`: Rejects unauthenticated request with HTTP 401.
13. `test_logout_and_session_invalidation`: Clears HttpOnly authentication cookie.
14. `test_patient_data_isolation`: Confirms Patient A cannot access Patient B's data.
15. `test_database_persistence`: Verifies data integrity across independent queries.

### Frontend Test Suite (Node.js Test Runner)
From the `frontend/` directory:
```bash
npm test
```
**Frontend Test Scenarios Covered (17/17 Passed):**
- Password length, uppercase, lowercase, numeric digit, and special character validation.
- Valid registration payload verification.
- Empty first name, last name, and invalid email rejection.
- Password mismatch rejection with user-friendly error message.
- Optional medical condition omission verification.
- Login credential validation.

---

## 8. Milestone 2 Acceptance Criteria Verification

| Requirement | Implementation Details | Status |
|---|---|---|
| Complete Registration Form | First Name, Last Name, Email, Gender (dropdown with Prefer not to say), Medical Condition (textarea with guidance), Preferred Language (English & Hindi), Password & Confirm Password. | Verified |
| Password Security | Argon2id memory-hard hashing; dynamic live security criteria checklist on frontend; show/hide toggles. | Verified |
| SQLite Persistence | Dedicated `backend/data/patient_portal.db` managed via Alembic migration scripts. | Verified |
| Dedicated Login Page | Centered healthcare card, show/hide toggle, Remember Me, Forgot Password modal, redirect to `/dashboard`. | Verified |
| Protected Dashboard | Authenticated `/me` fetch, patient greeting, demographic overview, sensitive medical notes masked behind privacy toggle, Logout action. | Verified |
| Session Invalidation | `/auth/logout` endpoint clears `patient_access_token` cookie; frontend redirects safely to `/login`. | Verified |
| Error Handling | Generic login errors to prevent account enumeration; accessible field-level error messages. | Verified |
| Automated Tests | 15 backend tests (`pytest`) + 17 frontend tests (`npm test`) passing with zero failures. | Verified |
