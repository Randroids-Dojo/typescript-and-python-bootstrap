from typing import List, Dict, Any, Optional, Union

import redis
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate, UserAdminUpdate
from app.services.base import BaseService

# Initialize Redis client for caching
redis_client = redis.from_url(settings.REDIS_URL)


class UserService(BaseService[User, UserCreate, UserUpdate]):
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """Create a new user"""
        db_obj = User(
            email=obj_in.email,
            full_name=obj_in.full_name,
            is_active=True,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, UserAdminUpdate, Dict[str, Any]]
    ) -> User:
        """Update a user"""
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Handle role assignment if using UserAdminUpdate
        role_ids = update_data.pop("roles", None)
        
        # Update user attributes
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        # Update roles if provided
        if role_ids is not None:
            # Clear current roles
            db_obj.roles = []
            # Add new roles
            roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
            db_obj.roles.extend(roles)
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Invalidate cache
        cache_key = f"user:{db_obj.id}"
        redis_client.delete(cache_key)
        
        return db_obj

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Get a user by email"""
        return db.query(User).filter(User.email == email).first()

    def is_active(self, user: User) -> bool:
        """Check if user is active"""
        return user.is_active


user_service = UserService(User)
