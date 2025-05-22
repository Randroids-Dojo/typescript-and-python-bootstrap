from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://app_user:app_password@postgres:5432/app_db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # Auth Service
    AUTH_SERVICE_URL: str = "http://auth-service:3001"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost:3000"
    ]
    
    # API
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Bootstrap API"
    
    class Config:
        env_file = ".env"


settings = Settings()