from fastapi import HTTPException, Security, Depends, Request, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import datetime
import httpx
from typing import Optional
from app.core.config import settings
from app.database import get_db

security = HTTPBearer(auto_error=False)


async def verify_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Verify the token with the auth service - supports both Bearer token and cookies"""
    # Support test mode with X-Test-User-ID header
    test_user_id = request.headers.get("X-Test-User-ID")
    if test_user_id:
        return {"session": {"id": "test-session"}, "user": {"id": test_user_id}}

    token = None

    # First try to get token from Authorization header
    if credentials and credentials.credentials:
        token = credentials.credentials
        print(f"Using Bearer token from Authorization header")
    else:
        # Try to get better-auth.session_token cookie (this is what Better Auth uses)
        auth_session_cookie = request.cookies.get("better-auth.session_token")
        if auth_session_cookie:
            # URL decode the cookie value
            import urllib.parse

            token = urllib.parse.unquote(auth_session_cookie)
            print(f"Using better-auth.session_token cookie: {token[:20]}...")
        else:
            print(
                f"No authentication found - looking for 'better-auth.session_token' in cookies: {list(request.cookies.keys())}"
            )

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Call the auth service to validate the token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/validate-token",
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("valid"):
                    return {"session": data.get("session"), "user": data.get("user")}
            else:
                print(
                    f"Auth validation failed: {response.status_code} - {response.text}"
                )

        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth service error: {e}")
        raise HTTPException(status_code=503, detail="Authentication service error")


async def get_current_user(session: dict = Depends(verify_token)) -> dict:
    """Get the current authenticated user from the session"""
    user = session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="User not found in session")
    return user


async def get_current_user_id(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Get the current user's ID"""
    # Support test mode with X-Test-User-ID header
    test_user_id = request.headers.get("X-Test-User-ID")
    if test_user_id:
        return test_user_id

    # Production mode - get user through normal auth flow
    try:
        session = await verify_token(request, credentials, db)
        user = session.get("user")
        if not user:
            raise HTTPException(status_code=401, detail="User not found in session")
        return user.get("id", "")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Not authenticated")
