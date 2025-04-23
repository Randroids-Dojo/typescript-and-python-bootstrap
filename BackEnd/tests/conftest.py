import os
import pytest
import asyncio
from typing import Generator, Dict, Any
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from redis.asyncio import Redis

from app.db.base import Base
from app.main import app
from app.db.session import get_db
from app.auth.client import auth_client
from app.utils.redis import get_redis_connection, close_redis_connection

# Test database URL - use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine with SQLite-specific settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator:
    """
    Create a fresh database for each test and populate with test data
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new session for each test
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Drop all tables after the test is complete
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db, mock_auth_client, mock_redis) -> Generator:
    """
    Create a test client with database and dependency overrides
    """
    # Override the get_db dependency to use the test database
    def override_get_db():
        try:
            yield db
        finally:
            pass

    # Setup dependency overrides
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
        
    # Reset all dependency overrides after test
    app.dependency_overrides = {}


@pytest.fixture
def mock_auth_client() -> Generator:
    """
    Mock the BetterAuth client to avoid actual service calls during tests
    """
    original_client = auth_client
    
    # Create a mock client with the expected attributes and methods
    mock_client = Mock()
    mock_client.validate_token.return_value = _create_mock_session()
    mock_client.health_check.return_value = True
    mock_client.close = Mock(return_value=None)
    
    # Apply the mock
    with patch('app.auth.client.auth_client', mock_client):
        with patch('app.middleware.auth.auth_client', mock_client):
            yield mock_client


@pytest.fixture
def mock_redis() -> Generator:
    """
    Mock Redis for tests
    """
    # Create mock redis client
    mock_redis_client = Mock(spec=Redis)
    
    # Setup methods needed in tests
    mock_redis_client.get.return_value = asyncio.Future()
    mock_redis_client.get.return_value.set_result(None)
    
    mock_redis_client.set.return_value = asyncio.Future()
    mock_redis_client.set.return_value.set_result(True)
    
    mock_redis_client.delete.return_value = asyncio.Future()
    mock_redis_client.delete.return_value.set_result(1)
    
    mock_redis_client.ping.return_value = asyncio.Future()
    mock_redis_client.ping.return_value.set_result(True)
    
    # Apply mocks to both the global instance and the function
    with patch('app.utils.redis._redis_client', mock_redis_client):
        with patch('app.utils.redis.get_redis_connection', return_value=mock_redis_client):
            yield mock_redis_client


@pytest.fixture
def auth_token() -> str:
    """
    Generate a test JWT token
    """
    return "test.jwt.token"


@pytest.fixture
def authenticated_client(client, auth_token) -> TestClient:
    """
    Client with authentication token pre-set
    """
    client.cookies.set("access_token", auth_token)
    return client


def _create_mock_session() -> Dict[str, Any]:
    """
    Create a mock session object that mimics BetterAuth session
    """
    user = {
        "id": "test-user-id",
        "email": "test@example.com",
        "username": "testuser",
        "roles": ["user"],
        "permissions": ["read:items", "create:items"],
        "metadata": {
            "first_name": "Test",
            "last_name": "User"
        }
    }
    
    return type('obj', (object,), {
        'user': type('User', (object,), user),
        'token': "test.jwt.token",
        'expires_at': 9999999999,
        'mfa_verified': False
    })
