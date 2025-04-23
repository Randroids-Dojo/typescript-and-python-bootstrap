from typing import List, Optional

import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate
from app.services.base import BaseService

# Initialize Redis client for caching
redis_client = redis.from_url(settings.REDIS_URL)


class ItemService(BaseService[Item, ItemCreate, ItemUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ItemCreate, owner_id: int
    ) -> Item:
        """Create a new item with owner"""
        obj_in_data = obj_in.dict()
        db_obj = Item(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Item]:
        """Get multiple items by owner"""
        # Check if cached
        cache_key = f"items:owner:{owner_id}:skip:{skip}:limit:{limit}"
        cached_items = redis_client.get(cache_key)
        
        if cached_items:
            # In a real implementation, we would deserialize the cached items
            # But for simplicity in this example, we'll just fetch from DB
            pass
            
        # Fetch from database
        items = (
            db.query(Item)
            .filter(Item.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Cache results (TTL 5 minutes)
        # In a real implementation, we would serialize the items list
        # For simplicity, we'll just mark that we've seen this query
        redis_client.setex(cache_key, 300, "1")
        
        return items


item_service = ItemService(Item)
