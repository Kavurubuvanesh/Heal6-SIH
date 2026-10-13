import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.db.base import Base
from app.db.models import Patient, WoundAssessment, PhysicianValidation, ReverificationRequest

logger = logging.getLogger("heal6.database")

# Build async engine according to DB dialect
connect_args = {}
engine_kwargs = {"echo": False, "future": True}

db_url = settings.async_database_url
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 60.0
else:
    # Production PostgreSQL connection pool configurations
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    })

engine = create_async_engine(db_url, connect_args=connect_args, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an isolated async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initializes database schema and seeds baseline clinical cases if table is empty.
    Ensures zero downtime and continuous operation with existing frontend clients.
    """
    async with engine.begin() as conn:
        if db_url.startswith("sqlite"):
            try:
                await conn.exec_driver_sql("PRAGMA journal_mode = WAL;")
                await conn.exec_driver_sql("PRAGMA synchronous = NORMAL;")
                await conn.exec_driver_sql("PRAGMA busy_timeout = 60000;")
            except Exception as pragma_err:
                logger.warning(f"Could not set SQLite WAL pragmas: {pragma_err}")
        await conn.run_sync(Base.metadata.create_all)
        # Migrate any missing columns in physician_validations
        for col, col_type in [
            ("review_status", "TEXT DEFAULT 'Reviewed & Prescribed'"),
            ("prescriptions", "TEXT"),
            ("precautions", "TEXT"),
            ("follow_up_date", "TEXT"),
            ("call_back_days", "INTEGER")
        ]:
            try:
                await conn.exec_driver_sql(f"ALTER TABLE physician_validations ADD COLUMN {col} {col_type};")
            except Exception:
                pass
