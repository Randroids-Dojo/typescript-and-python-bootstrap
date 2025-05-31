import pytest
from httpx import AsyncClient
import asyncio

@pytest.mark.integration
@pytest.mark.asyncio
async def test_backend_api_flow(client: AsyncClient):
    """Test backend API functionality without auth service dependency."""
    
    # 1. Health check
    response = await client.get("/api/health")
    assert response.status_code == 200
    
    # Note: This test focuses on backend API functionality
    # Auth integration would require the auth service to be running
    
    # Mock authentication for testing backend endpoints
    test_user_id = "test-user-integration-123"
    client.headers["X-Test-User-ID"] = test_user_id
    
    # 4. Get user profile (should be empty initially)
    response = await client.get("/api/user/profile")
    assert response.status_code == 200
    profile = response.json()
    assert profile["bio"] is None
    assert profile["display_name"] is None
    
    # 5. Update user profile
    profile_update = {
        "bio": "Integration test user bio",
        "display_name": "Integration Test User"
    }
    response = await client.put("/api/user/profile", json=profile_update)
    assert response.status_code == 200
    updated_profile = response.json()
    assert updated_profile["bio"] == profile_update["bio"]
    assert updated_profile["display_name"] == profile_update["display_name"]
    
    # 6. Get global counter
    response = await client.get("/api/counter")
    assert response.status_code == 200
    counter_data = response.json()
    initial_count = counter_data["count"]
    
    # 7. Increment counter
    response = await client.post("/api/counter/increment")
    assert response.status_code == 200
    incremented_data = response.json()
    assert incremented_data["count"] == initial_count + 1
    
    # 8. Verify counter persisted
    response = await client.get("/api/counter")
    assert response.status_code == 200
    assert response.json()["count"] == initial_count + 1

@pytest.mark.integration
@pytest.mark.asyncio
async def test_authentication_required(client: AsyncClient):
    """Test that protected endpoints require authentication."""
    
    # These endpoints should return 401 without auth
    protected_endpoints = [
        ("/api/user/profile", "GET"),
        ("/api/user/profile", "PUT"),
    ]
    
    for endpoint, method in protected_endpoints:
        if method == "GET":
            response = await client.get(endpoint)
        elif method == "PUT":
            response = await client.put(endpoint, json={})
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"

@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.skip(reason="Concurrent database operations conflict with test transaction management")
async def test_concurrent_counter_increments(client: AsyncClient):
    """Test that concurrent counter increments work correctly."""
    
    # Add test authentication
    client.headers["X-Test-User-ID"] = "test-user-concurrent"
    
    # Get initial counter value
    response = await client.get("/api/counter")
    initial_count = response.json()["count"]
    
    # Perform concurrent increments
    num_increments = 10
    tasks = []
    for _ in range(num_increments):
        task = client.post("/api/counter/increment")
        tasks.append(task)
    
    # Wait for all increments to complete
    results = await asyncio.gather(*tasks)
    
    # All requests should succeed
    for result in results:
        assert result.status_code == 200
    
    # Final count should be initial + num_increments
    response = await client.get("/api/counter")
    final_count = response.json()["count"]
    assert final_count == initial_count + num_increments

@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.skip(reason="Requires auth service to be running")
async def test_user_isolation(client: AsyncClient):
    """Test that user data is properly isolated between users."""
    
    # Create first user
    user1_data = {
        "username": "user1_isolation",
        "email": "user1_isolation@example.com",
        "password": "password123"
    }
    response = await client.post("/api/auth/signup", json=user1_data)
    assert response.status_code == 200
    
    # Login as user1
    response = await client.post("/api/auth/login", data={
        "username": user1_data["username"],
        "password": user1_data["password"]
    })
    token1 = response.json()["access_token"]
    
    # Update user1's profile
    profile1_data = {"bio": "User 1 bio", "display_name": "User One"}
    response = await client.put(
        "/api/user/profile",
        json=profile1_data,
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    
    # Create second user
    user2_data = {
        "username": "user2_isolation",
        "email": "user2_isolation@example.com",
        "password": "password456"
    }
    response = await client.post("/api/auth/signup", json=user2_data)
    assert response.status_code == 200
    
    # Login as user2
    response = await client.post("/api/auth/login", data={
        "username": user2_data["username"],
        "password": user2_data["password"]
    })
    token2 = response.json()["access_token"]
    
    # Get user2's profile - should be empty
    response = await client.get(
        "/api/user/profile",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 200
    profile2 = response.json()
    assert profile2["bio"] is None
    assert profile2["display_name"] is None
    
    # Verify user1's profile is still intact
    response = await client.get(
        "/api/user/profile",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    profile1_check = response.json()
    assert profile1_check["bio"] == profile1_data["bio"]
    assert profile1_check["display_name"] == profile1_data["display_name"]