from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import datetime
import httpx
from typing import Optional
from app.core.config import settings
from app.database import get_db

security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Verify the token directly from the database"""
    token = credentials.credentials
    
    try:
        # Query the session and user data directly
        query = text("""
            SELECT s.id as session_id, s."userId", s."expiresAt",
                   u.id as user_id, u.email, u.name, u."emailVerified"
            FROM session s
            JOIN "user" u ON s."userId" = u.id
            WHERE s.token = :token AND s."expiresAt" > :now
        """)
        
        result = await db.execute(
            query, 
            {"token": token, "now": datetime.utcnow()}
        )
        row = result.first()
        
        if row:
            return {
                "session": {
                    "id": row.session_id,
                    "userId": row.userId,
                    "expiresAt": row.expiresAt.isoformat()
                },
                "user": {
                    "id": row.user_id,
                    "email": row.email,
                    "name": row.name,
                    "emailVerified": row.emailVerified
                }
            }
        
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="Authentication service error"
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