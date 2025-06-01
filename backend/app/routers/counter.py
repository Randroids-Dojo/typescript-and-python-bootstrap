from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.counter import GlobalCounter
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/counter", tags=["counter"])


class CounterResponse(BaseModel):
    count: int
    last_updated_by: str | None = None
    last_updated_at: str


@router.get("", response_model=CounterResponse)
async def get_counter(db: AsyncSession = Depends(get_db)):
    """Get the current global counter value"""
    result = await db.execute(select(GlobalCounter).where(GlobalCounter.id == 1))
    counter = result.scalar_one_or_none()

    if not counter:
        # Initialize counter if it doesn't exist
        counter = GlobalCounter(id=1, count=0)
        db.add(counter)
        await db.commit()
        await db.refresh(counter)

    return CounterResponse(
        count=counter.count,
        last_updated_by=counter.last_updated_by,
        last_updated_at=counter.last_updated_at.isoformat(),
    )


@router.post("/increment", response_model=CounterResponse)
async def increment_counter(
    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)
):
    """Increment the global counter (requires authentication)"""
    result = await db.execute(select(GlobalCounter).where(GlobalCounter.id == 1))
    counter = result.scalar_one_or_none()

    if not counter:
        # Initialize counter if it doesn't exist
        counter = GlobalCounter(id=1, count=0)
        db.add(counter)

    # Increment counter
    counter.count += 1
    counter.last_updated_by = user_id

    await db.commit()
    await db.refresh(counter)

    return CounterResponse(
        count=counter.count,
        last_updated_by=counter.last_updated_by,
        last_updated_at=counter.last_updated_at.isoformat(),
    )
