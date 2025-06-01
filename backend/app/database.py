from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.core.config import settings

# Convert postgres:// to postgresql:// for SQLAlchemy
database_url = settings.DATABASE_URL.replace("postgres://", "postgresql://")
# Use asyncpg for async support
async_database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

# Async engine
engine = create_async_engine(async_database_url, echo=True)

# Async session
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Base class for models
Base = declarative_base()


# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
