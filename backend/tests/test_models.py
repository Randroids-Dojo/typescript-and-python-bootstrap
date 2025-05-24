import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.models.user_profile import UserProfile
from app.models.counter import Counter

@pytest.mark.asyncio
async def test_counter_model_creation(test_db: AsyncSession):
    """Test Counter model creation and default values."""
    counter = Counter()
    test_db.add(counter)
    await test_db.commit()
    await test_db.refresh(counter)
    
    assert counter.id == 1
    assert counter.count == 0
    assert isinstance(counter.updated_at, datetime)

@pytest.mark.asyncio
async def test_counter_model_update(test_db: AsyncSession):
    """Test Counter model update."""
    counter = Counter()
    test_db.add(counter)
    await test_db.commit()
    
    initial_updated_at = counter.updated_at
    
    # Update count
    counter.count = 10
    await test_db.commit()
    await test_db.refresh(counter)
    
    assert counter.count == 10
    assert counter.updated_at > initial_updated_at

@pytest.mark.asyncio
async def test_user_profile_model_creation(test_db: AsyncSession):
    """Test UserProfile model creation."""
    profile = UserProfile(
        user_id="test-user-123",
        bio="Test bio",
        display_name="Test User"
    )
    test_db.add(profile)
    await test_db.commit()
    await test_db.refresh(profile)
    
    assert profile.id is not None
    assert profile.user_id == "test-user-123"
    assert profile.bio == "Test bio"
    assert profile.display_name == "Test User"
    assert isinstance(profile.created_at, datetime)
    assert isinstance(profile.updated_at, datetime)

@pytest.mark.asyncio
async def test_user_profile_model_nullable_fields(test_db: AsyncSession):
    """Test UserProfile model with nullable fields."""
    profile = UserProfile(user_id="test-user-456")
    test_db.add(profile)
    await test_db.commit()
    await test_db.refresh(profile)
    
    assert profile.bio is None
    assert profile.display_name is None

@pytest.mark.asyncio
async def test_user_profile_unique_constraint(test_db: AsyncSession):
    """Test UserProfile unique constraint on user_id."""
    # Create first profile
    profile1 = UserProfile(user_id="same-user-id")
    test_db.add(profile1)
    await test_db.commit()
    
    # Try to create second profile with same user_id
    profile2 = UserProfile(user_id="same-user-id")
    test_db.add(profile2)
    
    with pytest.raises(Exception):  # Should raise IntegrityError
        await test_db.commit()

@pytest.mark.asyncio
async def test_counter_singleton_behavior(test_db: AsyncSession):
    """Test that Counter behaves as a singleton in the application logic."""
    # Create first counter
    counter1 = Counter()
    test_db.add(counter1)
    await test_db.commit()
    
    # Query for counters
    result = await test_db.execute(select(Counter))
    counters = result.scalars().all()
    
    assert len(counters) == 1
    assert counters[0].id == 1