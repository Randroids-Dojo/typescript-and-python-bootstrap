import logging
import time
import os
from fastapi import Request, HTTPException, Depends
from app.auth.better_auth import BetterAuthConnectionError, BetterAuthValidationError
from app.auth.client import auth_client
from app.utils.redis import get_cache, set_cache

logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_PERIOD = 60  # 1 minute
MAX_FAILED_ATTEMPTS = 5  # 5 failed attempts within period triggers temporary block

async def verify_token(request: Request):
    """
    Verify JWT token from request with enhanced error handling and rate limiting
    
    This middleware:
    1. Extracts the token from cookies or Authorization header
    2. Validates the token using BetterAuth service
    3. Stores user info in request.state for use in route handlers
    4. Implements rate limiting for failed authentication attempts
    5. Provides detailed error responses for different failure scenarios
    
    Returns:
        validated session object with user information
    """
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Check if IP is blocked for too many failed attempts
    block_key = f"auth:block:{client_ip}"
    if await get_cache(block_key):
        logger.warning(f"Blocked authentication attempt from rate-limited IP: {client_ip}")
        raise HTTPException(
            status_code=429, 
            detail="Too many failed authentication attempts. Please try again later."
        )
    
    # Extract token from various possible sources
    token = (
        request.cookies.get("access_token") or 
        request.headers.get("Authorization", "").replace("Bearer ", "") or
        request.query_params.get("access_token")
    )
    
    if not token:
        logger.warning(f"Authentication attempt with no token from IP: {client_ip}")
        raise HTTPException(
            status_code=401, 
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        # Validate token with BetterAuth service
        session = await auth_client.validate_token(token)
        
        if not session:
            # Track failed attempt for rate limiting
            await _track_failed_attempt(client_ip)
            
            logger.warning(f"Invalid token provided from IP: {client_ip}")
            raise HTTPException(
                status_code=401, 
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""}
            )
        
        # Add user info to request state for use in route handlers
        request.state.user = session.user
        
        # Add audit log for sensitive operations if needed
        path = request.url.path
        if path.startswith("/api/v1/admin") or request.method in ["POST", "PUT", "DELETE"]:
            logger.info(f"Authenticated access to {request.method} {path} by user {session.user.id}")
        
        return session
        
    except BetterAuthConnectionError as e:
        logger.error(f"BetterAuth service connection error: {e}")
        
        # Check if we should use fallback mode
        fallback_enabled = os.getenv("BETTER_AUTH_FALLBACK_MODE", "true").lower() in ("true", "1", "yes", "y", "t")
        if not fallback_enabled:
            raise HTTPException(
                status_code=503, 
                detail="Authentication service unavailable, please try again later"
            )
            
        # Try to get cached user session if available
        try:
            from app.utils.redis import get_cache
            import json
            
            # Check for cached session data
            cache_key = f"auth:token:{token[:20]}"
            cached_data = await get_cache(cache_key)
            
            if cached_data:
                logger.warning(f"Using cached auth data due to Auth service unavailability")
                session = json.loads(cached_data)
                request.state.user = session.get("user")
                return session
        except Exception as cache_error:
            logger.error(f"Failed to retrieve cached auth data: {cache_error}")
        
        # If we reached here, we can't authenticate properly
        # Check if we should allow fallback access with limited privileges
        allow_limited_access = os.getenv("BETTER_AUTH_ALLOW_LIMITED_ACCESS", "false").lower() in ("true", "1", "yes", "y", "t")
        
        if allow_limited_access:
            # Provide limited access with basic privileges
            logger.warning(f"Providing limited access due to Auth service unavailability")
            session = {
                "user": {
                    "id": "fallback-user",
                    "email": "fallback@example.com",
                    "roles": ["limited"],
                    "is_active": True,
                    "permissions": ["read:basic"]
                },
                "exp": int(time.time() + 300)  # Short expiration
            }
            request.state.user = session["user"]
            return session
        
        # Otherwise deny access with helpful message
        raise HTTPException(
            status_code=503, 
            detail="Authentication service unavailable, please try again later"
        )
        
    except BetterAuthValidationError as e:
        # Track failed attempt for rate limiting
        await _track_failed_attempt(client_ip)
        
        logger.warning(f"Token validation error from IP {client_ip}: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Invalid authentication token format",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""}
        )
        
    except Exception as e:
        logger.error(f"Unexpected error validating token: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during authentication"
        )

async def _track_failed_attempt(client_ip: str):
    """
    Track failed authentication attempts for rate limiting
    
    Args:
        client_ip: Client IP address to track
    """
    attempts_key = f"auth:attempts:{client_ip}"
    
    # Get current failed attempts count
    current_attempts = await get_cache(attempts_key)
    attempts = int(current_attempts) if current_attempts else 0
    attempts += 1
    
    # Update attempts count with TTL
    await set_cache(attempts_key, str(attempts), expire=RATE_LIMIT_PERIOD)
    
    # If too many attempts, block the IP temporarily
    if attempts >= MAX_FAILED_ATTEMPTS:
        block_key = f"auth:block:{client_ip}"
        block_time = RATE_LIMIT_PERIOD * 2  # Block for twice the rate limit period
        await set_cache(block_key, "1", expire=block_time)
        logger.warning(f"IP {client_ip} blocked for {block_time} seconds due to too many failed auth attempts")
