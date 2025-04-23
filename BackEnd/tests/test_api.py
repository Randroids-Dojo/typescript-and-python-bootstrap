from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    """Test the health check endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "backend"}


def test_api_root(client: TestClient):
    """Test the API root endpoint"""
    response = client.get("/api/v1")
    assert response.status_code == 404  # No route defined for /api/v1
