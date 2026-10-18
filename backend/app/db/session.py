from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings

def create_app_engine():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")

    if is_sqlite:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
    else:
        # PostgreSQL / Neon configuration
        # For serverless functions (like Vercel Python), NullPool prevents holding
        # idle or stale connections across lambdas/cold starts and integrates with Neon PgBouncer.
        if settings.DB_POOL_NULL:
            return create_engine(
                db_url,
                poolclass=NullPool,
                pool_pre_ping=True,
            )
        else:
            return create_engine(
                db_url,
                pool_size=5,
                max_overflow=2,
                pool_recycle=300,
                pool_pre_ping=True,
            )

engine = create_app_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session() -> Generator[Session, None, None]:
    """Dependency that yields a database session and guarantees closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
