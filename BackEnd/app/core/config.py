import logging
import os
import sys
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, PostgresDsn, validator, root_validator

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Application core settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Backend API"
    PROJECT_DESCRIPTION: str = "FastAPI Backend for the application"
    VERSION: str = "0.1.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret-key-for-dev-only")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t", "yes")
    
    # 60 minutes * 24 hours * 8 days = 8 days in minutes
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    # Database connection settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/app")
    
    # Redis configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Auth service configuration
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth")
    BETTER_AUTH_CLIENT_ID: str = os.getenv("BETTER_AUTH_CLIENT_ID", "backend-service")
    BETTER_AUTH_CLIENT_SECRET: str = os.getenv("BETTER_AUTH_CLIENT_SECRET", "backend-service-secret")
    BETTER_AUTH_TOKEN_CLEANUP_INTERVAL: int = int(os.getenv("BETTER_AUTH_TOKEN_CLEANUP_INTERVAL", "3600"))
    BETTER_AUTH_CONNECTION_TIMEOUT: int = int(os.getenv("BETTER_AUTH_CONNECTION_TIMEOUT", "5"))
    BETTER_AUTH_CACHE_TTL: int = int(os.getenv("BETTER_AUTH_CACHE_TTL", "300"))
    
    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://frontend:3000"]
    
    # Logging configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Allowed hosts for deployments
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    class Config:
        case_sensitive = True
        # Don't use env_file to avoid parsing issues
        env_file_encoding = "utf-8"


settings = Settings()

# Log startup configuration information
if settings.DEBUG:
    logger.info(f"Running in {settings.ENVIRONMENT} mode with DEBUG=True")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    logger.info(f"Redis URL: {settings.REDIS_URL}")
    logger.info(f"Auth Service URL: {settings.AUTH_SERVICE_URL}")
else:
    logger.info(f"Running in {settings.ENVIRONMENT} mode with DEBUG=False")
