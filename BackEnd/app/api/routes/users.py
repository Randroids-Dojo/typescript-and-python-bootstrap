from typing import Any, List

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.schemas.user import User, UserCreate, UserUpdate, UserAdminUpdate
from app.services.user import user_service

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, description="Skip items"),
    limit: int = Query(100, description="Limit items"),
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Retrieve users. Admin only."""
    users = user_service.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
async def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Create new user. Admin only."""
    user = user_service.create(db, obj_in=user_in)
    return user


@router.get("/me", response_model=User)
async def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get current user."""
    return current_user


@router.put("/me", response_model=User)
async def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update current user."""
    user = user_service.update(db, db_obj=current_user, obj_in=user_in)
    return user


@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: int = Path(..., description="The ID of the user to get"),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Get a specific user by id."""
    user = user_service.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    if user.id != current_user.id and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=403, 
            detail="The user doesn't have enough privileges"
        )
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int = Path(..., description="The ID of the user to update"),
    user_in: UserAdminUpdate,
    current_user: User = Depends(deps.require_admin),
) -> Any:
    """Update a user. Admin only."""
    user = user_service.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    user = user_service.update(db, db_obj=user, obj_in=user_in)
    return user
