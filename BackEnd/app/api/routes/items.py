from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.services.item import item_service

router = APIRouter()


@router.get("/", response_model=List[Item])
async def read_items(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, description="Skip items"),
    limit: int = Query(100, description="Limit items"),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve items."""
    if current_user.has_role("admin"):
        items = item_service.get_multi(db, skip=skip, limit=limit)
    else:
        items = item_service.get_multi_by_owner(
            db=db, owner_id=current_user.id, skip=skip, limit=limit
        )
    return items


@router.post("/", response_model=Item)
async def create_item(
    *,
    db: Session = Depends(deps.get_db),
    item_in: ItemCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """Create new item."""
    item = item_service.create_with_owner(db=db, obj_in=item_in, owner_id=current_user.id)
    return item


@router.put("/{id}", response_model=Item)
async def update_item(
    *,
    db: Session = Depends(deps.get_db),
    id: int = Path(..., description="The ID of the item to update"),
    item_in: ItemUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """Update an item."""
    item = item_service.get(db=db, id=id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.has_role("admin") and (item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    item = item_service.update(db=db, db_obj=item, obj_in=item_in)
    return item


@router.get("/{id}", response_model=Item)
async def read_item(
    *,
    db: Session = Depends(deps.get_db),
    id: int = Path(..., description="The ID of the item to get"),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """Get item by ID."""
    item = item_service.get(db=db, id=id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.has_role("admin") and (item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return item


@router.delete("/{id}", response_model=Item)
async def delete_item(
    *,
    db: Session = Depends(deps.get_db),
    id: int = Path(..., description="The ID of the item to delete"),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    """Delete an item."""
    item = item_service.get(db=db, id=id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.has_role("admin") and (item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    item = item_service.remove(db=db, id=id)
    return item
