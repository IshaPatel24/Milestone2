# Aegis Health Patient Portal — Milestone 2
## Production Deployment Guide: Vercel & Neon PostgreSQL

> **Full-Stack Patient Registration, Authentication & Persistent Database Storage**  
> Architected for HIPAA-grade patient privacy, serverless scalability, and zero-downtime deployment.

---

## 1. System & Deployment Architecture

This repository delivers a healthcare authentication web application deployable across **two interconnected Vercel projects** backed by **Neon Serverless PostgreSQL**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Vercel Frontend: "milestone2"                        │
│  - Framework: Next.js 16 (App Router) with React 19 & TypeScript       │
│  - Root Directory: frontend                                            │
│  - Domain: https://milestone2.vercel.app                               │
│  - Features: /signup, /login, /dashboard, dual-layer cookie+bearer auth │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS API Calls (Credentials + Bearer)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Vercel Backend API: "milestone2-api"                   │
│  - Framework: FastAPI (Python Serverless Functions on Vercel)          │
│  - Root Directory: backend                                             │
│  - Domain: https://milestone2-api.vercel.app                           │
│  - Entrypoint: main.py / api/index.py with vercel.json routing         │
│  - Security: Argon2id password hashing, JWT HttpOnly cookies, CORS     │
│  - Serverless Engine: NullPool connection management (no leaks)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SSL Pooled Connection (port 5432/6543)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Neon Serverless PostgreSQL                        │
│  - High-availability cloud PostgreSQL instance                         │
│  - Connection pooling via PgBouncer (-pooler endpoint)                 │
│  - Schema versioned and applied via Alembic migrations                 │
│  - Persistent patient accounts across all deployments and redeploys    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Vercel Project Configurations

Deploying frontend and backend as two decoupled Vercel projects connected to the same GitHub repository (`IshaPatel24/Milestone2`) guarantees isolated build pipelines and serverless scale.

### Project 1: Backend API (`milestone2-api`)

| Configuration Setting | Required Value | Notes |
|---|---|---|
| **Project Name** | `milestone2-api` | Target domain: `https://milestone2-api.vercel.app` |
| **Framework Preset** | `Other` | Vercel auto-detects Python Functions from `requirements.txt` |
| **Root Directory** | `backend` | **Important**: Set to `backend` in Project Settings |
| **Build Command** | *Leave empty / default* | Dependencies installed automatically from `requirements.txt` |
| **Output Directory** | *Leave empty / default* | Handled dynamically by Vercel Python runtime |
| **Install Command** | *Leave empty / default* | `pip install -r requirements.txt` is run by Vercel |

#### Backend Environment Variables (`milestone2-api`)
Configure these under **Project Settings ➔ Environment Variables**:

| Variable | Environment(s) | Example / Recommended Value | Description |
|---|---|---|---|
| `DATABASE_URL` | Production, Preview, Dev | `postgresql://neondb_owner:***@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` | Pooled Neon PostgreSQL connection string |
| `ENVIRONMENT` | Production | `production` | Enables production security controls |
| `SECRET_KEY` | Production, Preview, Dev | `openssl rand -hex 32` (generate a unique 64-char key) | Secret used to sign JWT access tokens |
| `BACKEND_CORS_ORIGINS` | Production, Preview, Dev | `https://milestone2.vercel.app,http://localhost:3000` | Whitelisted origins permitted to send credentials |
| `COOKIE_SAMESITE` | Production, Preview | `none` | Required for cross-origin cookie delivery between subdomains |
| `SECURE_COOKIES` | Production, Preview | `true` | Enforces `Secure` flag on HTTPS cookies |
| `DB_POOL_NULL` | Production, Preview | `true` | Prevents connection pooling leaks in serverless functions |
| `AUTH_RATE_LIMIT_PER_MINUTE` | Production, Preview | `30` | Max auth requests per minute per IP |

---

### Project 2: Frontend (`milestone2`)

| Configuration Setting | Required Value | Notes |
|---|---|---|
| **Project Name** | `milestone2` | Target domain: `https://milestone2.vercel.app` |
| **Framework Preset** | `Next.js` | Automatically detected |
| **Root Directory** | `frontend` | **Important**: Set to `frontend` in Project Settings |
| **Build Command** | `next build` | Standard Next.js production build |
| **Output Directory** | `.next` | Standard Next.js output directory |
| **Install Command** | `npm install` | Uses `package-lock.json` |

#### Frontend Environment Variables (`milestone2`)
Configure under **Project Settings ➔ Environment Variables**:

| Variable | Environment(s) | Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Production | `https://milestone2-api.vercel.app/api/v1` | URL of the deployed backend project |
| `NEXT_PUBLIC_API_URL` | Preview | `https://milestone2-api.vercel.app/api/v1` | Target API for preview branch testing |
| `NEXT_PUBLIC_API_URL` | Development | `http://localhost:8000/api/v1` | Local development backend |

---

## 3. Neon PostgreSQL Database Setup

1. **Create a Neon Account & Database**:
   - Navigate to [neon.tech](https://neon.tech) and log in or create an account.
   - Create a project: e.g. `patient-portal`.
   - Neon creates a default database named `neondb`.

2. **Retrieve Connection String**:
   - In the Neon Console Dashboard, locate the **Connection Details** card.
   - Select **Connection string** with **Pooled connection** checked (port `5432` or `6543`, containing `-pooler` in the host).
   - The connection string will look like:
     ```text
     postgresql://neondb_owner:npg_xyz@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

3. **Run Alembic Migrations Against Neon**:
   Before triggering the initial Vercel backend deployment, execute the migration to create the `patients` table in Neon:
   ```bash
   cd backend
   source venv/bin/activate

   # Export your Neon connection URL
   export DATABASE_URL="postgresql://neondb_owner:npg_xyz@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Apply migrations
   alembic upgrade head
   ```

4. **Verify Schema in Neon Console**:
   - Open Neon's SQL Editor and verify the table structure:
     ```sql
     SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'patients';
     ```

5. **(Optional) Data Migration from Local SQLite**:
   If you have registered test patients in local SQLite that you wish to preserve in Neon:
   ```bash
   python scripts/migrate_sqlite_to_pg.py
   ```
   *(This script safely reads local records, skips duplicates, and preserves IDs and Argon2id password hashes).*

---

## 4. Deployment Sequence (Avoiding URL Mismatches)

To avoid CORS and base URL configuration mismatches between frontend and backend:

1. **Step 1: Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: configure Vercel serverless deployment and Neon PostgreSQL integration"
   git push origin main
   ```

2. **Step 2: Deploy Backend First (`milestone2-api`)**:
   - In Vercel Dashboard, click **Add New ➔ Project**.
   - Select repository `IshaPatel24/Milestone2`.
   - Set **Project Name**: `milestone2-api`.
   - Set **Root Directory**: `backend`.
   - Add Environment Variables:
     - `DATABASE_URL`: Your Neon PostgreSQL pooled URL.
     - `ENVIRONMENT`: `production`.
     - `SECRET_KEY`: A secure random key.
     - `BACKEND_CORS_ORIGINS`: `https://milestone2.vercel.app,http://localhost:3000`.
     - `COOKIE_SAMESITE`: `none`.
     - `SECURE_COOKIES`: `true`.
   - Click **Deploy**.
   - Once deployed, note your backend URL: e.g. `https://milestone2-api.vercel.app`.
   - Verify health: Open `https://milestone2-api.vercel.app/api/v1/health` in your browser. It should return `{"status":"healthy","database":"postgresql"}`.

3. **Step 3: Deploy Frontend (`milestone2`)**:
   - In Vercel Dashboard, click **Add New ➔ Project**.
   - Select repository `IshaPatel24/Milestone2`.
   - Set **Project Name**: `milestone2`.
   - Set **Root Directory**: `frontend`.
   - Add Environment Variable:
     - `NEXT_PUBLIC_API_URL`: `https://milestone2-api.vercel.app/api/v1`
   - Click **Deploy**.
   - Once deployed, visit `https://milestone2.vercel.app/signup`.

---

## 5. Local Development Commands

### Backend Local Setup
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations (defaults to local SQLite if DATABASE_URL is unset)
alembic upgrade head

# Start local server on port 8000
uvicorn main:app --reload --port 8000
```

### Frontend Local Setup
```bash
cd frontend
npm install

# Start local Next.js dev server on port 3000
npm run dev
```

---

## 6. Running Automated Tests Locally

### Backend Unit & Integration Tests (15 Tests)
```bash
cd backend
source venv/bin/activate
pytest tests -v
```
All 15 tests run against an isolated in-memory/temporary SQLite database:
- `test_successful_registration`
- `test_missing_required_fields`
- `test_invalid_email`
- `test_password_confirmation_mismatch`
- `test_duplicate_email_registration` (409 Conflict)
- `test_password_hashing_verification` (Argon2id prefix check)
- `test_successful_login`
- `test_login_incorrect_password`
- `test_login_unknown_email_generic_failure`
- `test_inactive_patient_login`
- `test_authenticated_me_request`
- `test_unauthenticated_me_request`
- `test_logout_and_session_invalidation`
- `test_patient_data_isolation`
- `test_database_persistence`

### Frontend Validation & Schema Tests (17 Tests)
```bash
cd frontend
npm test
```
All 17 tests run using Node's native test runner:
- Password length, uppercase, lowercase, numeric digit, and special character criteria.
- Valid registration payload verification.
- Empty first name, last name, and invalid email rejection.
- Password mismatch rejection with user-friendly error message.
- Optional medical condition omission verification.
- Login credential validation.

---

## 7. Security & HIPAA Privacy Safeguards

1. **Argon2id Memory-Hard Hashing**: Protects patient passwords with 64 MB RAM cost, 2 iterations, and 16-byte random salt.
2. **Dual-Layer Session Authentication**: Transmits authentication credentials via `HttpOnly`, `SameSite=none`, `Secure` cookies, backed by Bearer authorization header fallback for third-party cookie restricted environments.
3. **Clinical Data Masking**: Sensitive medical notes are masked by default on the client side behind a privacy toggle.
4. **Anti-Enumeration Login**: Returns identical generic error messages for non-existent emails and wrong passwords.
5. **No Password Persistence**: Confirm password is never stored; password hashes are excluded from all API response schemas.
6. **Defense-in-Depth Headers**: Standard security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`, `Permissions-Policy`) applied on all responses.
