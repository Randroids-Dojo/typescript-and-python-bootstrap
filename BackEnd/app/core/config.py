import logging
import os
import sys
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, PostgresDsn, validator, root_validator

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Backend API"
    PROJECT_DESCRIPTION: str = "FastAPI Backend for the application"
    VERSION: str = "0.1.0"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret-key-for-dev-only")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t", "yes")
    
    # 60 minutes * 24 hours * 8 days = 8 days in minutes
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # Frontend
        "http://frontend:3000",   # Frontend service name in Docker
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration
    DATABASE_URL: PostgresDsn = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/app"
    )

    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Auth Service Configuration
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth")
    BETTER_AUTH_CLIENT_ID: str = os.getenv("BETTER_AUTH_CLIENT_ID", "backend-service")
    BETTER_AUTH_CLIENT_SECRET: str = os.getenv("BETTER_AUTH_CLIENT_SECRET", "backend-service-secret")
    BETTER_AUTH_TOKEN_CLEANUP_INTERVAL: int = int(os.getenv("BETTER_AUTH_TOKEN_CLEANUP_INTERVAL", "3600"))
    BETTER_AUTH_CONNECTION_TIMEOUT: int = int(os.getenv("BETTER_AUTH_CONNECTION_TIMEOUT", "5"))
    BETTER_AUTH_CACHE_TTL: int = int(os.getenv("BETTER_AUTH_CACHE_TTL", "300"))
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Allowed hosts for deployments
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    @validator("ALLOWED_HOSTS", pre=True)
    def assemble_allowed_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    @root_validator
    def validate_required_settings(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that required environment variables are set."""
        required_settings = {
            "DATABASE_URL": "Database connection string",
            "REDIS_URL": "Redis connection string for caching",
            "AUTH_SERVICE_URL": "BetterAuth service URL",
            "SECRET_KEY": "Secret key for security" 
        }
        
        # Check for production environment
        if values.get("ENVIRONMENT") == "production":
            missing = []
            for key, description in required_settings.items():
                if key not in os.environ:
                    missing.append(f"{key}: {description}")
            
            if missing:
                err_msg = "Missing required environment variables in production:\n"
                err_msg += "\n".join(missing)
                logger.error(err_msg)
                
                # In production, we should fail to start if required variables are missing
                if not values.get("DEBUG", False):
                    sys.exit(1)
        
        return values

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

# Log startup configuration information
if settings.DEBUG:
    logger.info(f"Running in {settings.ENVIRONMENT} mode with DEBUG=True")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    logger.info(f"Redis URL: {settings.REDIS_URL}")
    logger.info(f"Auth Service URL: {settings.AUTH_SERVICE_URL}")
else:
    logger.info(f"Running in {settings.ENVIRONMENT} mode with DEBUG=False")
