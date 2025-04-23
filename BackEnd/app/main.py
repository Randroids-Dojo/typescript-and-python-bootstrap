import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.api.routes import api_router
from app.db.base import Base
from app.db.session import engine
from app.auth.client import auth_client

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
        redis = get_redis_connection()
        redis.ping()
        health["components"]["redis"] = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health["components"]["redis"] = "unhealthy"
        health["status"] = "degraded"
    
    # Check Auth service connectivity
    try:
        auth_status = auth_client.health_check()
        health["components"]["auth_service"] = "healthy" if auth_status else "degraded"
        if not auth_status:
            health["status"] = "degraded"
    except Exception as e:
        logger.error(f"Auth service health check failed: {e}")
        health["components"]["auth_service"] = "unhealthy"
        health["status"] = "degraded"
    
    return health

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on application shutdown"""
    logger.info("Application shutting down")
    
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
