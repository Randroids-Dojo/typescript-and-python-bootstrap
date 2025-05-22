from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from typing import Optional
from app.core.config import settings

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify the token with the auth service"""
    token = credentials.credentials
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/auth/verify-token",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("valid"):
                    return data.get("session", {})
                    
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail="Auth service unavailable"
            )


async def get_current_user(session: dict = Depends(verify_token)) -> dict:
    """Get the current authenticated user from the session"""
    user = session.get("user")
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found in session"
        )
    return user


async def get_current_user_id(user: dict = Depends(get_current_user)) -> str:
    """Get the current user's ID"""
    return user.get("id", "")