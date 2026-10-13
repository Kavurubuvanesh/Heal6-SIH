"""
Heal6 Backend Pytest Fixtures & Test Isolation Configuration
============================================================
Guarantees strict test isolation:
- Spins up a dedicated in-memory or temporary test SQLite database for test execution.
- Automatically wipes and unlinks any test database artifacts upon completion.
- Zero pollution of production heal6_clinical.db.
"""

import os
import sys
import tempfile
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Ensure backend root in path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.base import Base

@pytest.fixture(scope="session")
def test_db_path():
    temp_dir = tempfile.mkdtemp()
    db_file = os.path.join(temp_dir, "test_clinical_isolated.db")
    yield db_file
    # Teardown: delete test database file and directory
    try:
        if os.path.exists(db_file):
            os.remove(db_file)
        if os.path.exists(temp_dir):
            os.rmdir(temp_dir)
    except Exception:
        pass

@pytest_asyncio.fixture(scope="function")
async def isolated_db_engine(test_db_path):
    database_url = f"sqlite+aiosqlite:///{test_db_path}"
    engine = create_async_engine(database_url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def isolated_session(isolated_db_engine):
    SessionLocal = async_sessionmaker(bind=isolated_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session
        await session.rollback()
