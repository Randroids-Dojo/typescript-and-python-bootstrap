import os
from better_auth import BetterAuthClient

# Initialize the BetterAuth client for authentication operations
auth_client = BetterAuthClient(
    base_url=os.getenv("AUTH_SERVICE_URL", "http://auth:4000/api/auth"),
    cache_redis_url=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    client_id=os.getenv("BETTER_AUTH_CLIENT_ID", "backend-service"),
    client_secret=os.getenv("BETTER_AUTH_CLIENT_SECRET", "backend-service-secret")
)
