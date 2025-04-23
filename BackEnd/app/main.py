import logging
import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.api.routes import api_router
from app.db.base_class import Base
from app.db.session import engine
from app.auth.client import auth_client, start_token_cleanup_task, stop_token_cleanup_task

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    debug=settings.DEBUG,
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
    license_info={
        "name": "Private License",
        "url": "https://example.com/license",
    },
    openapi_tags=[
        {
            "name": "users",
            "description": "User management endpoints",
            "externalDocs": {
                "description": "User documentation",
                "url": "https://example.com/docs/users",
            },
        },
        {
            "name": "items",
            "description": "Item management endpoints",
            "externalDocs": {
                "description": "Item documentation",
                "url": "https://example.com/docs/items",
            },
        },
        {
            "name": "auth",
            "description": "Authentication endpoints and BetterAuth integration",
            "externalDocs": {
                "description": "Auth documentation",
                "url": "https://example.com/docs/auth",
            },
        },
    ],
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for production environments
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS
    )

# Add response headers middleware for security
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize resources on application startup"""
    logger.info("Application starting up")
    
    # Initialize the BetterAuth client
    try:
        from app.auth.client import initialize_auth_client
        await initialize_auth_client()
        logger.info("BetterAuth client initialization completed")
    except Exception as e:
        logger.error(f"Failed to initialize BetterAuth client: {e}")
    
    # Start BetterAuth token cleanup task
    try:
        await start_token_cleanup_task()
        logger.info("BetterAuth token cleanup task started")
    except Exception as e:
        logger.error(f"Failed to start BetterAuth token cleanup task: {e}")
    
    # Check Auth service health
    try:
        is_healthy = await auth_client.health_check()
        if is_healthy:
            logger.info("Auth service health check: OK")
        else:
            logger.warning("Auth service health check: DEGRADED - service may be unavailable")
            logger.warning("The application will continue to function with reduced auth capabilities")
            logger.warning("Auth operations will use cached values when possible or fallback behaviors")
    except Exception as e:
        logger.error(f"Auth service health check failed: {e}")
    
    logger.info("Application startup complete")

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "backend"}

@app.get("/health")
async def detailed_health_check():
    """More detailed health check with component status"""
    health = {
        "service": "backend",
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "components": {
            "database": "unknown",
            "redis": "unknown",
            "auth_service": "unknown"
        }
    }
    
    # Check database connectivity
    try:
        from sqlalchemy import text
        from app.db.session import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health["components"]["database"] = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health["components"]["database"] = "unhealthy"
        health["status"] = "degraded"
    
    # Check Redis connectivity
    try:
        from app.utils.redis import get_redis_connection
        redis = await get_redis_connection()
        await redis.ping()
        health["components"]["redis"] = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health["components"]["redis"] = "unhealthy"
        health["status"] = "degraded"
    
    # Check Auth service connectivity
    try:
        auth_status = await auth_client.health_check()
        if auth_status:
            health["components"]["auth_service"] = "healthy"
        else:
            # If offline mode is active, show that in the health status
            if auth_client.offline_mode:
                health["components"]["auth_service"] = "offline"
                health["status"] = "degraded"
                logger.warning("Auth service is in offline mode")
            else:
                health["components"]["auth_service"] = "degraded"
                health["status"] = "degraded"
                logger.warning("Auth service health check reports degraded status")
    except Exception as e:
        logger.error(f"Auth service health check failed: {e}")
        health["components"]["auth_service"] = "unhealthy"
        health["status"] = "degraded"
        
    # Add additional information about fallback status
    if health["components"]["auth_service"] != "healthy":
        fallback_enabled = os.getenv("BETTER_AUTH_FALLBACK_MODE", "true").lower() in ("true", "1", "yes", "y", "t")
        limited_access = os.getenv("BETTER_AUTH_ALLOW_LIMITED_ACCESS", "false").lower() in ("true", "1", "yes", "y", "t")
        health["auth_fallback"] = {
            "enabled": fallback_enabled,
            "limited_access": limited_access,
            "offline_mode": getattr(auth_client, "offline_mode", False)
        }
    
    return health

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on application shutdown"""
    logger.info("Application shutting down")
    
    # Stop BetterAuth token cleanup task
    try:
        await stop_token_cleanup_task()
        logger.info("BetterAuth token cleanup task stopped")
    except Exception as e:
        logger.error(f"Error stopping BetterAuth token cleanup task: {e}")
    
    # Close Redis connection and cleanup BetterAuth token cache
    try:
        await auth_client.close()
        logger.info("BetterAuth client closed successfully")
    except Exception as e:
        logger.error(f"Error closing BetterAuth client: {e}")
    
    # Close any other resources that need cleanup
    try:
        from app.utils.redis import close_redis_connection
        await close_redis_connection()
        logger.info("Redis connection closed successfully")
    except Exception as e:
        logger.error(f"Error closing Redis connection: {e}")
        
    logger.info("Application shutdown complete")
