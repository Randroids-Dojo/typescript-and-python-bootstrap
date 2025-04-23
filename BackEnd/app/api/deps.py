from typing import Generator, Optional

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.middleware.auth import verify_token


def get_current_user(request: Request, token_session = Depends(verify_token)):
    """Get current user from session provided by auth middleware"""
    return request.state.user


def get_current_active_user(current_user = Depends(get_current_user)):
    """Check if current user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_admin(request: Request, token_session = Depends(verify_token)):
    """Check if current user has admin role"""
    user = request.state.user
    if not user or not user.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return user
