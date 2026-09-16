import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Heal6 Clinical Telemetry API"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    # Dual-Engine Database URL:
    # Defaults to async SQLite for friction-free local dev,
    # or overrides via environment variable DATABASE_URL for production PostgreSQL
    # e.g., postgresql+asyncpg://postgres:postgres@localhost:5432/heal6_db
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./heal6_clinical.db"
    )

    # In production, ensure postgresql URLs use asyncpg driver if specified as postgresql://
    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

settings = Settings()
