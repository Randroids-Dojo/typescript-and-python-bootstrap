import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from faker import Faker

from app.models.user_profile import UserProfile

fake = Faker()


@pytest.mark.asyncio
async def test_get_profile_not_authenticated(client: AsyncClient):
    """Test getting profile without authentication."""
    response = await client.get("/api/user/profile")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_get_profile_initial(
    authenticated_client: AsyncClient, test_db: AsyncSession
):
    """Test getting profile for a new user."""
    response = await authenticated_client.get("/api/user/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] is None
    assert data["display_name"] is None


@pytest.mark.asyncio
async def test_update_profile(authenticated_client: AsyncClient, test_db: AsyncSession):
    """Test updating user profile."""
    profile_data = {"bio": fake.text(max_nb_chars=200), "display_name": fake.name()}

    response = await authenticated_client.put("/api/user/profile", json=profile_data)
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] == profile_data["bio"]
    assert data["display_name"] == profile_data["display_name"]

    # Verify in database
    result = await test_db.execute(select(UserProfile))
    profile = result.scalar_one()
    assert profile.bio == profile_data["bio"]
    assert profile.display_name == profile_data["display_name"]


@pytest.mark.asyncio
async def test_update_profile_partial(authenticated_client: AsyncClient):
    """Test partial update of user profile."""
    # First set full profile
    initial_data = {"bio": "Initial bio", "display_name": "Initial Name"}
    response = await authenticated_client.put("/api/user/profile", json=initial_data)
    assert response.status_code == 200

    # Update only bio
    partial_update = {"bio": "Updated bio"}
    response = await authenticated_client.put("/api/user/profile", json=partial_update)
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] == partial_update["bio"]
    assert (
        data["display_name"] == initial_data["display_name"]
    )  # Should remain unchanged


@pytest.mark.asyncio
async def test_update_profile_empty_values(authenticated_client: AsyncClient):
    """Test updating profile with empty values."""
    # First set some values
    initial_data = {"bio": "Some bio", "display_name": "Some Name"}
    response = await authenticated_client.put("/api/user/profile", json=initial_data)
    assert response.status_code == 200

    # Clear the values
    empty_update = {"bio": "", "display_name": ""}
    response = await authenticated_client.put("/api/user/profile", json=empty_update)
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] == ""
    assert data["display_name"] == ""


@pytest.mark.asyncio
@pytest.mark.skip(reason="Requires auth service to be running")
async def test_profile_isolation(client: AsyncClient, test_user_data):
    """Test that profiles are isolated between users."""
    # Create and authenticate first user
    user1_data = test_user_data.copy()
    user1_data["username"] = "user1"
    user1_data["email"] = "user1@example.com"

    response = await client.post("/api/auth/signup", json=user1_data)
    assert response.status_code == 200

    login_response = await client.post(
        "/api/auth/login",
        data={"username": user1_data["username"], "password": user1_data["password"]},
    )
    token1 = login_response.json()["access_token"]

    # Update user1's profile
    profile1_data = {"bio": "User 1 bio", "display_name": "User One"}
    response = await client.put(
        "/api/user/profile",
        json=profile1_data,
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert response.status_code == 200

    # Create and authenticate second user
    user2_data = test_user_data.copy()
    user2_data["username"] = "user2"
    user2_data["email"] = "user2@example.com"

    response = await client.post("/api/auth/signup", json=user2_data)
    assert response.status_code == 200

    login_response = await client.post(
        "/api/auth/login",
        data={"username": user2_data["username"], "password": user2_data["password"]},
    )
    token2 = login_response.json()["access_token"]

    # Get user2's profile - should be empty
    response = await client.get(
        "/api/user/profile", headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] is None
    assert data["display_name"] is None

    # Verify user1's profile is still intact
    response = await client.get(
        "/api/user/profile", headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["bio"] == profile1_data["bio"]
    assert data["display_name"] == profile1_data["display_name"]
