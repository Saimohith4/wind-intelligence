from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_health_explicit_data_state():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert "data_available" in r.json()

def test_invalid_range_rejected():
    r = client.get("/api/overview?start=2026-01-20&end=2026-01-01")
    assert r.status_code == 400
