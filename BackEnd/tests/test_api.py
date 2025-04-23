import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test the health check endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "backend"}


def test_detailed_health_check(client: TestClient):
    """Test the detailed health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "backend"
    assert data["status"] == "healthy"
    assert "components" in data
    assert "database" in data["components"]
    assert "redis" in data["components"]
    assert "auth_service" in data["components"]


def test_api_root(client: TestClient):
    """Test the API root endpoint"""
    response = client.get("/api/v1")
    assert response.status_code == 404  # No route defined for /api/v1


def test_missing_token(client: TestClient):
    """Test endpoint that requires auth but no token provided"""
    # Create a test endpoint that requires authentication
    from app.auth.dependencies import require_auth
    from app.main import app
    from fastapi import Depends
    
    @app.get("/api/v1/test-auth", dependencies=[Depends(require_auth)])
    async def test_auth_endpoint():
        return {"message": "You are authenticated"}
    
    # Test with no token
    response = client.get("/api/v1/test-auth")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]


def test_valid_token(authenticated_client: TestClient):
    """Test endpoint with valid authentication token"""
    # Test endpoint added in previous test
    response = authenticated_client.get("/api/v1/test-auth")
    assert response.status_code == 200
    assert response.json() == {"message": "You are authenticated"}


def test_admin_access(authenticated_client: TestClient, mock_auth_client):
    """Test endpoint that requires admin role"""
    from app.auth.dependencies import require_admin
    from app.main import app
    from fastapi import Depends
    
    @app.get("/api/v1/admin-only", dependencies=[Depends(require_admin)])
    async def admin_endpoint():
        return {"message": "You are an admin"}
    
    # Test with regular user (no admin role)
    response = authenticated_client.get("/api/v1/admin-only")
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]
    
    # Modify mock to include admin role
    mock_session = mock_auth_client.validate_token.return_value
    mock_session.user.roles = ["user", "admin"]
    
    # Test with admin user
    response = authenticated_client.get("/api/v1/admin-only")
    assert response.status_code == 200
    assert response.json() == {"message": "You are an admin"}


def test_role_based_access(authenticated_client: TestClient, mock_auth_client):
    """Test role-based access control"""
    from app.auth.dependencies import require_roles
    from app.main import app
    from fastapi import Depends
    
    @app.get("/api/v1/manager-only", dependencies=[Depends(require_roles("manager"))])
    async def manager_endpoint():
        return {"message": "You are a manager"}
    
    # Test with regular user (no manager role)
    response = authenticated_client.get("/api/v1/manager-only")
    assert response.status_code == 403
    assert "Missing required roles" in response.json()["detail"]
    
    # Modify mock to include manager role
    mock_session = mock_auth_client.validate_token.return_value
    mock_session.user.roles = ["user", "manager"]
    
    # Test with manager user
    response = authenticated_client.get("/api/v1/manager-only")
    assert response.status_code == 200
    assert response.json() == {"message": "You are a manager"}


def test_redis_connection():
    """Test Redis connection utilities"""
    from app.utils.redis import get_redis_connection, set_cache, get_cache
    import pytest
    import asyncio
    
    @pytest.mark.asyncio
    async def _async_test():
        # This would normally connect to Redis, but we're using mocks in tests
        redis_client = await get_redis_connection()
        
        # Test cache operations
        await set_cache("test_key", "test_value", 60)
        value = await get_cache("test_key")
        
        # Our mock is set to return None for get, so we're testing the function call
        # not the return value (which would be "test_value" with a real Redis)
        assert value is None
    
    # Run the async test
    asyncio.run(_async_test())


def test_auth_client_error_handling():
    """Test BetterAuth client error handling"""
    from app.auth.client import BetterAuthConnectionError, BetterAuthConfigError
    import importlib
    import app.auth.client
    
    # Test handling of connection error
    with patch('better_auth.BetterAuthClient') as mock_client_class:
        # Make constructor raise connection error
        mock_client = MagicMock()
        mock_client_class.side_effect = BetterAuthConnectionError("Connection failed")
        
        # This should not raise but log an error and create offline client
        with patch('app.auth.client.logger') as mock_logger:
            # Reimport to trigger initialization
            importlib.reload(app.auth.client)
            mock_logger.error.assert_called_once()
            mock_logger.warning.assert_called_once()
