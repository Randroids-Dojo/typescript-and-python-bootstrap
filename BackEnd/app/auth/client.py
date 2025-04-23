import os
import sys
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

# For synchronous import contexts, initialize with a placeholder offline client
# This will be replaced with the proper client during application startup
auth_client = BetterAuthClient(
    base_url=os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth"),
    offline_mode=True
)

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

# Configure the retry policy for initialization
max_init_retries = int(os.getenv("BETTER_AUTH_INIT_RETRIES", "5"))  # Increased from 3 to 5
init_retry_delay = float(os.getenv("BETTER_AUTH_INIT_RETRY_DELAY", "2.0"))  # Increased from 0.5 to 2.0
fallback_to_offline = os.getenv("BETTER_AUTH_FALLBACK_TO_OFFLINE", "true").lower() in ("true", "1", "yes", "y", "t")

async def initialize_auth_client():
    """Initialize the auth client with retries and graceful fallback"""
    global auth_client
    
    base_url = os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth")
    cache_redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Log initialization attempt
    logger.info(f"Initializing BetterAuth client with base_url={base_url}, max_retries={max_init_retries}")
    
    connection_timeout = int(os.getenv("BETTER_AUTH_CONNECTION_TIMEOUT", "10"))  # Increased from 5 to 10
    # Increase timeout for initial connection attempt to be more tolerant of startup delay
    initial_timeout = min(connection_timeout * 3, 30)  # Increased to max 30 seconds
    
    offline_mode_fallback = None
    
    for attempt in range(max_init_retries):
        try:
            # Initialize the BetterAuth client - use longer timeout on first attempt
            current_timeout = initial_timeout if attempt == 0 else connection_timeout
            
            client = BetterAuthClient(
                base_url=base_url,
                cache_redis_url=cache_redis_url,
                client_id=os.getenv("BETTER_AUTH_CLIENT_ID", "backend-service"),
                client_secret=os.getenv("BETTER_AUTH_CLIENT_SECRET", "backend-service-secret"),
                token_cleanup_interval=int(os.getenv("BETTER_AUTH_TOKEN_CLEANUP_INTERVAL", "3600")),
                connection_timeout=current_timeout,
                cache_ttl=int(os.getenv("BETTER_AUTH_CACHE_TTL", "300"))
            )
            
            # Test connection if not in testing mode
            if "pytest" not in sys.modules:
                logger.info(f"Performing health check (attempt {attempt+1}/{max_init_retries})")
                is_healthy = await client.health_check()
                
                if not is_healthy:
                    if attempt < max_init_retries - 1:
                        logger.warning(f"Auth service health check failed (attempt {attempt+1}/{max_init_retries}), retrying in {init_retry_delay * (attempt + 1)} seconds...")
                        await asyncio.sleep(init_retry_delay * (attempt + 1))
                        continue
                    
                    if fallback_to_offline:
                        logger.warning("Auth service health check failed after retries, falling back to offline mode")
                        offline_mode_fallback = BetterAuthClient(base_url=base_url, offline_mode=True)
                        # Store the regular client for potential recovery later
                        auth_client = client
                        # But replace it with the offline client for now
                        auth_client = offline_mode_fallback
                        
                        # Start a background task to periodically try to recover 
                        # the connection to the auth service
                        _start_recovery_monitoring()
                        
                        return
                    else:
                        logger.error("Auth service health check failed and fallback to offline mode is disabled")
            
            # If we made it here, the client is working (or we're in testing mode)
            auth_client = client
            logger.info("BetterAuth client initialized successfully")
            return
            
        except BetterAuthConnectionError as e:
            logger.error(f"Failed to connect to BetterAuth service (attempt {attempt+1}/{max_init_retries}): {e}")
            if attempt < max_init_retries - 1:
                retry_delay = init_retry_delay * (attempt + 1)
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                continue
                
            if fallback_to_offline:
                logger.warning("Falling back to offline mode after connection failures")
                offline_mode_client = BetterAuthClient(base_url=base_url, offline_mode=True)
                auth_client = offline_mode_client
                
                # Start a background task to periodically try to recover
                _start_recovery_monitoring()
                return
            raise
            
        except BetterAuthConfigError as e:
            logger.error(f"Invalid BetterAuth configuration: {e}")
            raise
            
        except Exception as e:
            logger.error(f"Unexpected error initializing BetterAuth client: {e}")
            if attempt < max_init_retries - 1:
                retry_delay = init_retry_delay * (attempt + 1)
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                continue
            
            if fallback_to_offline:
                logger.warning(f"Falling back to offline mode after unexpected error: {e}")
                offline_mode_client = BetterAuthClient(base_url=base_url, offline_mode=True)
                auth_client = offline_mode_client
                
                # Start a background task to periodically try to recover
                _start_recovery_monitoring()
                return
            raise

# Global variable to track if recovery monitoring is already running
_recovery_task = None

async def _recovery_monitor_worker():
    """Worker function that performs the actual recovery monitoring"""
    # Use a shorter interval initially to recover quickly if the service just had a slow start
    recovery_check_interval = int(os.getenv("BETTER_AUTH_RECOVERY_CHECK_INTERVAL", "15"))  # Default: check every 15 seconds
    max_recovery_attempts = int(os.getenv("BETTER_AUTH_MAX_RECOVERY_ATTEMPTS", "0"))  # 0 means unlimited attempts
    
    # Start with a short delay for the first few attempts, then gradually increase
    dynamic_interval = True  # Use dynamic interval timing
    
    logger.info(f"Starting Auth service recovery monitoring (initial interval: {recovery_check_interval}s)")
    
    recovery_attempts = 0
    
    while True:
        # Check if we've reached the max attempts (if configured)
        if max_recovery_attempts > 0 and recovery_attempts >= max_recovery_attempts:
            logger.warning(f"Reached maximum recovery attempts ({max_recovery_attempts}), stopping recovery monitoring")
            break
            
        recovery_attempts += 1
        
        try:
            # Only attempt recovery if we're in offline mode
            if not getattr(auth_client, "offline_mode", False):
                logger.info("Auth client is no longer in offline mode, stopping recovery monitoring")
                break
                
            logger.info(f"Attempting Auth service recovery (attempt {recovery_attempts})")
            
            # Create a new client with online mode to test connectivity
            test_client = BetterAuthClient(
                base_url=os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth"),
                cache_redis_url=os.getenv("REDIS_URL", "redis://redis:6379/0"),
                client_id=os.getenv("BETTER_AUTH_CLIENT_ID", "backend-service"),
                client_secret=os.getenv("BETTER_AUTH_CLIENT_SECRET", "backend-service-secret"),
                connection_timeout=int(os.getenv("BETTER_AUTH_CONNECTION_TIMEOUT", "5")),
            )
            
            # Test if the service is now healthy
            is_healthy = await test_client.health_check()
            
            if is_healthy:
                logger.info("Auth service has recovered, switching back to online mode")
                # Use a different approach to modify the global variable
                globals()["auth_client"] = test_client
                break
                
            logger.warning("Auth service has not yet recovered, remaining in offline mode")
            await test_client.close()
            
        except Exception as e:
            logger.error(f"Error during Auth service recovery attempt: {e}")
            
        # Calculate the next check interval dynamically if enabled
        if dynamic_interval:
            # For first 5 attempts, check more frequently
            if recovery_attempts < 5:
                current_interval = min(5, recovery_check_interval // 3)
            # For next 5 attempts, check at medium frequency
            elif recovery_attempts < 10:
                current_interval = min(15, recovery_check_interval // 2)
            # After that, use the full interval
            else:
                current_interval = recovery_check_interval
                
            logger.debug(f"Next recovery check in {current_interval} seconds (attempt {recovery_attempts})")
        else:
            current_interval = recovery_check_interval
            
        # Wait before the next recovery attempt
        await asyncio.sleep(current_interval)
        
    # Clear the global task reference when done
    global _recovery_task
    _recovery_task = None
    logger.info("Auth service recovery monitoring completed")

def _start_recovery_monitoring():
    """
    Start a background task that periodically checks if the Auth service
    has recovered and switches back from offline mode when it has.
    
    This is a non-async function that can be called from anywhere to start
    the monitoring process without awaiting it.
    """
    global _recovery_task
    
    # If recovery monitoring is already running, don't start it again
    if _recovery_task is not None:
        logger.debug("Recovery monitoring is already running")
        return
        
    # Create and store the recovery task
    _recovery_task = asyncio.create_task(_recovery_monitor_worker())
    
    # Log that we've started the recovery process
    logger.info("Auth service recovery monitoring task started")

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