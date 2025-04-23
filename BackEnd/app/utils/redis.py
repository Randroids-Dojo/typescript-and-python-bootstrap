import logging
import redis.asyncio as redis
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Redis connection instance
_redis_client: Optional[redis.Redis] = None

async def get_redis_connection() -> redis.Redis:
    """
    Create or return the existing Redis connection
    """
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    return _redis_client

async def close_redis_connection():
    """
    Close the Redis connection and cleanup resources
    """
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")

async def set_cache(key: str, value: str, expire: int = 300):
    """
    Set a value in Redis cache with expiration time
    
    Args:
        key: Cache key
        value: Value to store
        expire: Expiration time in seconds (default: 300 seconds / 5 minutes)
    """
    client = await get_redis_connection()
    await client.set(key, value, ex=expire)

async def get_cache(key: str) -> Optional[str]:
    """
    Get a value from Redis cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None if key doesn't exist
    """
    client = await get_redis_connection()
    return await client.get(key)

async def delete_cache(key: str):
    """
    Delete a value from Redis cache
    
    Args:
        key: Cache key to delete
    """
    client = await get_redis_connection()
    await client.delete(key)

async def clear_cache_pattern(pattern: str):
    """
    Clear all keys matching a pattern
    
    Args:
        pattern: Redis key pattern to match (e.g. "user:*")
    """
    client = await get_redis_connection()
    keys = await client.keys(pattern)
    if keys:
        await client.delete(*keys)
        logger.info(f"Cleared {len(keys)} keys matching pattern: {pattern}")