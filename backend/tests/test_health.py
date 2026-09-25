from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code in (200, 503)
    body = response.json()
    assert body["service"] == "finlee-api"
    assert "status" in body
    assert "database" in body
    assert "environment" in body


def test_health_v1_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code in (200, 503)
    body = response.json()
    assert body["service"] == "finlee-api"
    assert "status" in body
    assert "database" in body
    assert "environment" in body
