import pytest
from httpx import AsyncClient
import asyncio

@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_user_flow(client: AsyncClient):
    """Test complete user flow: signup, login, profile operations, counter."""
    
    # 1. Health check
    response = await client.get("/health")
    assert response.status_code == 200
    
    # 2. Signup new user
    user_data = {
        "username": "integration_user",
        "email": "integration@example.com", 
        "password": "integration123"
    }
    response = await client.post("/auth/signup", json=user_data)
    assert response.status_code == 200
    signup_data = response.json()
    assert "user" in signup_data
    assert signup_data["user"]["username"] == user_data["username"]
    
    # 3. Login with new user
    login_data = {
        "username": user_data["username"],
        "password": user_data["password"]
    }
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    login_response = response.json()
    assert "access_token" in login_response
    token = login_response["access_token"]
    
    # Set auth header for subsequent requests
    client.headers["Authorization"] = f"Bearer {token}"
    
    # 4. Get user profile (should be empty initially)
    response = await client.get("/user/profile")
    assert response.status_code == 200
    profile = response.json()
    assert profile["bio"] is None
    assert profile["display_name"] is None
    
    # 5. Update user profile
    profile_update = {
        "bio": "Integration test user bio",
        "display_name": "Integration Test User"
    }
    response = await client.put("/user/profile", json=profile_update)
    assert response.status_code == 200
    updated_profile = response.json()
    assert updated_profile["bio"] == profile_update["bio"]
    assert updated_profile["display_name"] == profile_update["display_name"]
    
    # 6. Get global counter
    response = await client.get("/counter")
    assert response.status_code == 200
    counter_data = response.json()
    initial_count = counter_data["count"]
    
    # 7. Increment counter
    response = await client.post("/counter/increment")
    assert response.status_code == 200
    incremented_data = response.json()
    assert incremented_data["count"] == initial_count + 1
    
    # 8. Verify counter persisted
    response = await client.get("/counter")
    assert response.status_code == 200
    assert response.json()["count"] == initial_count + 1

@pytest.mark.integration
@pytest.mark.asyncio
async def test_authentication_required(client: AsyncClient):
    """Test that protected endpoints require authentication."""
    
    # These endpoints should return 401 without auth
    protected_endpoints = [
        ("/user/profile", "GET"),
        ("/user/profile", "PUT"),
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
async def test_concurrent_counter_increments(client: AsyncClient):
    """Test that concurrent counter increments work correctly."""
    
    # Get initial counter value
    response = await client.get("/counter")
    initial_count = response.json()["count"]
    
    # Perform concurrent increments
    num_increments = 10
    tasks = []
    for _ in range(num_increments):
        task = client.post("/counter/increment")
        tasks.append(task)
    
    # Wait for all increments to complete
    results = await asyncio.gather(*tasks)
    
    # All requests should succeed
    for result in results:
        assert result.status_code == 200
    
    # Final count should be initial + num_increments
    response = await client.get("/counter")
    final_count = response.json()["count"]
    assert final_count == initial_count + num_increments

@pytest.mark.integration
@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient):
    """Test that user data is properly isolated between users."""
    
    # Create first user
    user1_data = {
        "username": "user1_isolation",
        "email": "user1_isolation@example.com",
        "password": "password123"
    }
    response = await client.post("/auth/signup", json=user1_data)
    assert response.status_code == 200
    
    # Login as user1
    response = await client.post("/auth/login", data={
        "username": user1_data["username"],
        "password": user1_data["password"]
    })
    token1 = response.json()["access_token"]
    
    # Update user1's profile
    profile1_data = {"bio": "User 1 bio", "display_name": "User One"}
    response = await client.put(
        "/user/profile",
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
    response = await client.post("/auth/signup", json=user2_data)
    assert response.status_code == 200
    
    # Login as user2
    response = await client.post("/auth/login", data={
        "username": user2_data["username"],
        "password": user2_data["password"]
    })
    token2 = response.json()["access_token"]
    
    # Get user2's profile - should be empty
    response = await client.get(
        "/user/profile",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 200
    profile2 = response.json()
    assert profile2["bio"] is None
    assert profile2["display_name"] is None
    
    # Verify user1's profile is still intact
    response = await client.get(
        "/user/profile",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    profile1_check = response.json()
    assert profile1_check["bio"] == profile1_data["bio"]
    assert profile1_check["display_name"] == profile1_data["display_name"]