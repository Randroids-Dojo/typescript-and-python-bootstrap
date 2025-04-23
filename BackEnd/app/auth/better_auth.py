"""
Python client for interacting with the Auth service.
This implements the functionality needed to validate and refresh tokens with the Auth service.
"""
import os
import json
import logging
import httpx
from typing import Dict, Any, Optional, TypedDict
import asyncio
import time

logger = logging.getLogger(__name__)

class User(TypedDict):
    """Type definition for a user"""
    id: str
    email: str
    roles: list[str]
    is_active: bool

class Session(TypedDict):
    """Type definition for a session"""
    user: User
    exp: int  # Expiration timestamp

class BetterAuthException(Exception):
    """Base exception for BetterAuth client"""
    pass

class BetterAuthConnectionError(BetterAuthException):
    """Exception raised when connection to Auth service fails"""
    pass

class BetterAuthConfigError(BetterAuthException):
    """Exception raised when there's a configuration error"""
    pass

class BetterAuthValidationError(BetterAuthException):
    """Exception raised when token validation fails"""
    pass

class BetterAuthClient:
    """Client for interacting with the Auth service"""
    
    def __init__(
        self, 
        base_url: str = None,
        cache_redis_url: str = None,
        client_id: str = None,
        client_secret: str = None,
        token_cleanup_interval: int = 3600,
        connection_timeout: int = 5,
        cache_ttl: int = 300,
        offline_mode: bool = False
    ):
        self.base_url = base_url or os.getenv("AUTH_SERVICE_URL")
        self.cache_redis_url = cache_redis_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_cleanup_interval = token_cleanup_interval
        self.connection_timeout = connection_timeout
        self.cache_ttl = cache_ttl
        self.offline_mode = offline_mode
        self._http_client = None
        
        if not self.base_url and not self.offline_mode:
            raise BetterAuthConfigError("base_url is required when not in offline mode")
            
        logger.info(f"BetterAuthClient initialized with base_url={self.base_url}, offline_mode={self.offline_mode}")
    
    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                timeout=self.connection_timeout,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            )
            if self.client_id and self.client_secret:
                self._http_client.headers.update({
                    "X-Client-ID": self.client_id,
                    "X-Client-Secret": self.client_secret
                })
        return self._http_client
    
    async def health_check(self) -> bool:
        """Check if the Auth service is healthy"""
        if self.offline_mode:
            return False
            
        try:
            # Use an asynchronous request for health check
            logger.info(f"Attempting health check to {self.base_url}/health with timeout {self.connection_timeout}s")
            
            async with httpx.AsyncClient(timeout=self.connection_timeout) as client:
                try:
                    # Add more detailed debugging and exception handling
                    logger.debug(f"Sending GET request to {self.base_url}/health")
                    response = await client.get(f"{self.base_url}/health")
                    logger.debug(f"Received response with status code: {response.status_code}")
                    
                    # Check response status and content
                    if response.status_code == 200:
                        # Also validate response content to ensure service is truly healthy
                        data = response.json()
                        logger.debug(f"Health check response: {data}")
                        
                        # Check if overall status is healthy
                        if data.get("status") == "healthy":
                            logger.info("Auth service reports healthy status")
                            return True
                            
                        # Check if any specific service components are degraded
                        if data.get("components") and data.get("components").get("auth_service") == "degraded":
                            logger.warning("Auth service component is in degraded state")
                            return False
                            
                        # Default to overall status if components aren't specified
                        return data.get("status") == "healthy"
                        
                    logger.warning(f"Auth service returned non-200 status: {response.status_code}")
                    return False
                    
                except httpx.ConnectError as e:
                    logger.error(f"Connection error during health check: {e}")
                    # Add more specific information about what might be wrong
                    logger.error(f"Unable to connect to {self.base_url}/health - check if service is running and network is configured correctly")
                    return False
                    
                except httpx.TimeoutException as e:
                    logger.error(f"Timeout during health check: {e}")
                    logger.error(f"Request to {self.base_url}/health timed out after {self.connection_timeout}s")
                    return False
                    
                except Exception as e:
                    logger.error(f"Health check request failed: {e}")
                    return False
                
        except Exception as e:
            logger.error(f"Unexpected error in health check: {e}")
            return False
    
    async def validate_token(self, token: str, max_retries: int = 3) -> Optional[Session]:
        """
        Validate a JWT token with the Auth service
        
        Args:
            token: The JWT token to validate
            max_retries: Maximum number of retry attempts for transient errors
            
        Returns:
            Session object if token is valid, None otherwise
            
        Raises:
            BetterAuthConnectionError: If connection to Auth service fails after retries
            BetterAuthValidationError: If token format is invalid
        """
        if self.offline_mode:
            # In offline mode, return a dummy admin session
            logger.warning("Token validation skipped in offline mode")
            return {
                "user": {
                    "id": "offline-admin",
                    "email": "admin@example.com",
                    "roles": ["admin"],
                    "is_active": True
                },
                "exp": int(time.time() + 3600)  # Expires in 1 hour
            }
        
        # First check Redis cache if available to avoid service call
        if self.cache_redis_url:
            try:
                from app.utils.redis import get_cache
                cache_key = f"auth:token:{token[:20]}"  # Use part of token as key
                cached_session = await get_cache(cache_key)
                if cached_session:
                    logger.debug("Using cached session data")
                    return json.loads(cached_session)
            except Exception as e:
                logger.warning(f"Cache retrieval failed, will try direct validation: {e}")
        
        # Try the Auth service with retries for transient errors
        for attempt in range(max_retries):
            try:
                # No cached result, call Auth service
                response = await self.http_client.post(
                    f"{self.base_url}/validate",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=self.connection_timeout
                )
                
                if response.status_code != 200:
                    logger.warning(f"Token validation failed: {response.status_code} {response.text}")
                    # Don't retry for 401/403 errors (invalid token)
                    if response.status_code in (401, 403):
                        return None
                    # For server errors (5xx), retry if we haven't exhausted retries
                    if response.status_code >= 500 and attempt < max_retries - 1:
                        await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
                        continue
                    return None
                    
                # Parse response
                result = response.json()
                
                if not result.get("valid"):
                    return None
                    
                session = {
                    "user": result.get("user"),
                    "exp": result.get("exp", int(time.time() + 3600))  # Use provided exp or default to 1 hour
                }
                
                # Cache successful result if Redis is available
                if self.cache_redis_url:
                    try:
                        from app.utils.redis import set_cache
                        cache_key = f"auth:token:{token[:20]}"
                        await set_cache(cache_key, json.dumps(session), expire=self.cache_ttl)
                    except Exception as e:
                        logger.warning(f"Failed to cache token validation result: {e}")
                    
                return session
                
            except httpx.ConnectError as e:
                logger.warning(f"Connection error validating token (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff before retry
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                logger.error("Max retries exceeded for token validation")
                raise BetterAuthConnectionError(f"Failed to connect to Auth service after {max_retries} attempts: {e}")
                
            except httpx.TimeoutException as e:
                logger.warning(f"Timeout validating token (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff before retry
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                logger.error("Max retries exceeded for token validation")
                raise BetterAuthConnectionError(f"Auth service timeout after {max_retries} attempts: {e}")
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response from Auth service")
                return None
                
            except Exception as e:
                logger.error(f"Error validating token: {e}")
                raise BetterAuthValidationError(f"Token validation error: {e}")
    
    async def refresh_token(self, refresh_token: str, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        """
        Refresh an access token using a refresh token
        
        Args:
            refresh_token: The refresh token
            max_retries: Maximum number of retry attempts for transient errors
            
        Returns:
            Dict with new access and refresh tokens if successful, None otherwise
        """
        if self.offline_mode:
            logger.warning("Token refresh skipped in offline mode")
            return {
                "accessToken": "offline-access-token",
                "refreshToken": "offline-refresh-token"
            }
        
        # Try the Auth service with retries for transient errors
        for attempt in range(max_retries):
            try:
                response = await self.http_client.post(
                    f"{self.base_url}/refresh",
                    json={"refreshToken": refresh_token},
                    timeout=self.connection_timeout
                )
                
                if response.status_code != 200:
                    logger.warning(f"Token refresh failed: {response.status_code} {response.text}")
                    
                    # Don't retry for 401/403 errors (invalid refresh token)
                    if response.status_code in (401, 403):
                        return None
                        
                    # For server errors (5xx), retry if we haven't exhausted retries
                    if response.status_code >= 500 and attempt < max_retries - 1:
                        await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
                        continue
                        
                    return None
                    
                result = response.json()
                return result.get("tokens")
                
            except httpx.ConnectError as e:
                logger.warning(f"Connection error refreshing token (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff before retry
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                logger.error("Max retries exceeded for token refresh")
                return None
                
            except httpx.TimeoutException as e:
                logger.warning(f"Timeout refreshing token (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff before retry
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                logger.error("Max retries exceeded for token refresh")
                return None
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response from Auth service during token refresh")
                return None
                
            except Exception as e:
                logger.error(f"Error refreshing token: {e}")
                return None
    
    async def close(self):
        """Close HTTP client connection"""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
            logger.info("HTTP client closed")