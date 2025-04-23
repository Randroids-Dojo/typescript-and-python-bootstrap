import os
import logging
from better_auth import BetterAuthClient
from better_auth.exceptions import BetterAuthConnectionError, BetterAuthConfigError

logger = logging.getLogger(__name__)

# Required environment variables for BetterAuth configuration
required_env_vars = [
    "AUTH_SERVICE_URL",
    "REDIS_URL",
    "BETTER_AUTH_CLIENT_ID",
    "BETTER_AUTH_CLIENT_SECRET"
]

# Check if required environment variables are present
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    logger.warning(f"Missing required environment variables for BetterAuth: {', '.join(missing_vars)}")
    logger.warning("Using default values which may not work in production")

try:
    # Initialize the BetterAuth client for authentication operations
    auth_client = BetterAuthClient(
        base_url=os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth"),
        cache_redis_url=os.getenv("REDIS_URL", "redis://redis:6379/0"),
        client_id=os.getenv("BETTER_AUTH_CLIENT_ID", "backend-service"),
        client_secret=os.getenv("BETTER_AUTH_CLIENT_SECRET", "backend-service-secret"),
        token_cleanup_interval=int(os.getenv("BETTER_AUTH_TOKEN_CLEANUP_INTERVAL", "3600")),  # 1 hour default
        connection_timeout=int(os.getenv("BETTER_AUTH_CONNECTION_TIMEOUT", "5")),  # 5 seconds default
        cache_ttl=int(os.getenv("BETTER_AUTH_CACHE_TTL", "300"))  # 5 minutes default
    )
    
    # Test connection on startup
    auth_client.health_check()
    logger.info("BetterAuth client initialized successfully")
    
except BetterAuthConnectionError as e:
    logger.error(f"Failed to connect to BetterAuth service: {e}")
    # Initialize with offline mode to avoid blocking the application startup
    auth_client = BetterAuthClient(
        base_url=os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth"),
        offline_mode=True
    )
    logger.warning("BetterAuth client initialized in offline mode - authentication will not work")
    
except BetterAuthConfigError as e:
    logger.error(f"Invalid BetterAuth configuration: {e}")
    raise
    
except Exception as e:
    logger.error(f"Unexpected error initializing BetterAuth client: {e}")
    raise
