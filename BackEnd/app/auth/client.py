import os
import logging
import asyncio
# Import our Auth service client implementation
from app.auth.better_auth import BetterAuthClient, BetterAuthConnectionError, BetterAuthConfigError
from app.utils.redis import clear_cache_pattern

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

# Global background task reference
_cleanup_task = None

async def start_token_cleanup_task():
    """Start a background task to periodically clean up expired tokens in the cache"""
    global _cleanup_task
    
    if _cleanup_task is not None:
        return
    
    async def token_cleanup_worker():
        cleanup_interval = int(os.getenv("BETTER_AUTH_TOKEN_CLEANUP_INTERVAL", "3600"))  # 1 hour default
        while True:
            try:
                logger.debug("Running token cache cleanup")
                # Clean auth:token:* keys that might be expired but still in cache
                await clear_cache_pattern("auth:token:*")
                # Clean auth:session:* keys that might be expired but still in cache
                await clear_cache_pattern("auth:session:*")
                logger.debug(f"Token cache cleanup complete, next run in {cleanup_interval} seconds")
            except Exception as e:
                logger.error(f"Error during token cache cleanup: {e}")
            
            await asyncio.sleep(cleanup_interval)
    
    _cleanup_task = asyncio.create_task(token_cleanup_worker())
    logger.info("BetterAuth token cleanup background task started")

async def stop_token_cleanup_task():
    """Stop the token cleanup background task"""
    global _cleanup_task
    if _cleanup_task is not None:
        _cleanup_task.cancel()
        try:
            await _cleanup_task
        except asyncio.CancelledError:
            pass
        _cleanup_task = None
        logger.info("BetterAuth token cleanup background task stopped")

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
    
    # We'll check the health later in the startup process
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

# Functions to handle token refresh and session validation
async def refresh_token(refresh_token: str):
    """
    Refresh an access token using a refresh token
    
    Args:
        refresh_token: The refresh token to use
        
    Returns:
        New session with refreshed access token or None if refresh failed
    """
    try:
        return await auth_client.refresh_token(refresh_token)
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        return None

async def validate_session(token: str, required_permissions=None):
    """
    Validate a session token and optionally check permissions
    
    Args:
        token: The session token to validate
        required_permissions: Optional list of permissions to check
        
    Returns:
        Validated session or None if invalid
    """
    try:
        session = await auth_client.validate_token(token)
        
        if not session:
            return None
            
        # Check permissions if specified
        if required_permissions and not all(perm in session.user.permissions for perm in required_permissions):
            logger.warning(f"User {session.user.id} missing required permissions: {required_permissions}")
            return None
            
        return session
    except Exception as e:
        logger.error(f"Error validating session: {e}")
        return None
