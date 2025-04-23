from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    full_name: str


# Properties to receive via API on update
class UserUpdate(UserBase):
    pass


# Role schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    pass


class RoleInDBBase(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Role(RoleInDBBase):
    pass


# Additional properties to return via API
class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        orm_mode = True


# Return model
class User(UserInDBBase):
    roles: List[Role] = []


# Admin update model to modify roles
class UserAdminUpdate(UserUpdate):
    roles: Optional[List[int]] = Field(None, description="List of role IDs to assign to user")
