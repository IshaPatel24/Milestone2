"""
Safe data migration script: SQLite -> Neon PostgreSQL
Transfers existing patient records from local SQLite database to Neon PostgreSQL
without data loss or password hash alteration.

Usage:
    export DATABASE_URL="postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require"
    python scripts/migrate_sqlite_to_pg.py
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.models.patient import Patient
from app.db.base import Base

def migrate():
    sqlite_path = backend_dir / "data" / "patient_portal.db"
    pg_url = os.environ.get("DATABASE_URL")

    if not sqlite_path.exists():
        print(f"No local SQLite database found at {sqlite_path}. Nothing to migrate.")
        return

    if not pg_url or pg_url.startswith("sqlite"):
        print("Error: DATABASE_URL must be set to a valid PostgreSQL connection string.")
        print("Example: export DATABASE_URL='postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require'")
        sys.exit(1)

    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to source SQLite: {sqlite_path}")
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SqliteSession()

    print(f"Connecting to destination PostgreSQL: {pg_url.split('@')[-1]}")
    pg_engine = create_engine(pg_url)
    PgSession = sessionmaker(bind=pg_engine)
    pg_session = PgSession()

    try:
        # Fetch patients from SQLite
        patients = sqlite_session.query(Patient).all()
        print(f"Found {len(patients)} patient record(s) in local SQLite database.")

        migrated_count = 0
        skipped_count = 0

        for p in patients:
            # Check if patient already exists in PostgreSQL
            existing = pg_session.query(Patient).filter(Patient.email == p.email).first()
            if existing:
                print(f"  - Skipping {p.email} (already exists in PostgreSQL)")
                skipped_count += 1
                continue

            new_patient = Patient(
                first_name=p.first_name,
                last_name=p.last_name,
                email=p.email,
                gender=p.gender,
                medical_condition=p.medical_condition,
                preferred_language=p.preferred_language,
                password_hash=p.password_hash,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at
            )
            pg_session.add(new_patient)
            migrated_count += 1
            print(f"  + Queued {p.email} ({p.first_name} {p.last_name})")

        pg_session.commit()
        print(f"\nMigration completed successfully!")
        print(f"  Migrated: {migrated_count}")
        print(f"  Skipped:  {skipped_count}")

    except Exception as e:
        pg_session.rollback()
        print(f"Migration error: {e}")
        sys.exit(1)
    finally:
        sqlite_session.close()
        pg_session.close()

if __name__ == "__main__":
    migrate()
