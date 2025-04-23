from fastapi import Depends, HTTPException
from app.middleware.auth import verify_token

def require_auth(session = Depends(verify_token)):
    """Dependency to require authentication"""
    return session

def require_admin(session = Depends(verify_token)):
    """Dependency to require admin role"""
    if "admin" not in session.user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    return session
