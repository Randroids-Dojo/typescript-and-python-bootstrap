from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user_profile import UserProfile
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/user", tags=["user"])


class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    created_at: str
    updated_at: str


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's profile"""
    user_id = await get_current_user_id(request)
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Create profile if it doesn't exist
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=profile.user_id,
        display_name=profile.display_name,
        bio=profile.bio,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat()
    )


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Update the current user's profile"""
    user_id = await get_current_user_id(request)
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Create profile if it doesn't exist
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    
    # Update fields
    if profile_update.display_name is not None:
        profile.display_name = profile_update.display_name
    if profile_update.bio is not None:
        profile.bio = profile_update.bio
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=profile.user_id,
        display_name=profile.display_name,
        bio=profile.bio,
        created_at=profile.created_at.isoformat(),
        updated_at=profile.updated_at.isoformat()
    )