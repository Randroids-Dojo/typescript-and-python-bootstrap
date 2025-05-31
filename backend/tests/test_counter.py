import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.counter import GlobalCounter

@pytest.mark.asyncio
async def test_get_counter_initial(client: AsyncClient, test_db: AsyncSession):
    """Test getting the counter when it doesn't exist yet."""
    response = await client.get("/counter")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    
    # Verify in database
    result = await test_db.execute(select(GlobalCounter))
    counter = result.scalar_one()
    assert counter.count == 0

@pytest.mark.asyncio
async def test_increment_counter(client: AsyncClient, test_db: AsyncSession):
    """Test incrementing the counter."""
    # First get initial value
    response = await client.get("/counter")
    assert response.status_code == 200
    initial_count = response.json()["count"]
    
    # Increment
    response = await client.post("/counter/increment")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == initial_count + 1
    
    # Verify in database
    result = await test_db.execute(select(GlobalCounter))
    counter = result.scalar_one()
    assert counter.count == initial_count + 1

@pytest.mark.asyncio
async def test_multiple_increments(client: AsyncClient, test_db: AsyncSession):
    """Test multiple counter increments."""
    # Get initial value
    response = await client.get("/counter")
    initial_count = response.json()["count"]
    
    # Increment multiple times
    increments = 5
    for i in range(increments):
        response = await client.post("/counter/increment")
        assert response.status_code == 200
        assert response.json()["count"] == initial_count + i + 1
    
    # Verify final value
    response = await client.get("/counter")
    assert response.status_code == 200
    assert response.json()["count"] == initial_count + increments

@pytest.mark.asyncio
async def test_counter_persistence(client: AsyncClient, test_db: AsyncSession):
    """Test that counter value persists across requests."""
    # Increment counter
    response = await client.post("/counter/increment")
    assert response.status_code == 200
    count_after_increment = response.json()["count"]
    
    # Get counter value in a new request
    response = await client.get("/counter")
    assert response.status_code == 200
    assert response.json()["count"] == count_after_increment