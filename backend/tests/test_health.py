"""The keep-alive health check must be fast, dependency-free and always reachable."""

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_health_returns_ok(client):
    for path in ("/health", "/api/health"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_health_accepts_head_requests_from_uptime_monitors(client):
    response = client.head("/health")
    assert response.status_code == 200
    assert response.content == b""


def test_health_does_not_touch_the_database(tmp_path):
    database_path = tmp_path / "missing-dir" / "never-created.db"
    # No `with` block: the lifespan (schema + seeding) never runs.
    client = TestClient(create_app(Settings(database_path=database_path)))
    assert client.get("/health").json() == {"status": "ok"}
    assert not database_path.parent.exists()


def test_health_is_not_blocked_by_cors(client):
    foreign = client.get("/health", headers={"Origin": "https://uptime-monitor.example"})
    assert foreign.status_code == 200
    assert "access-control-allow-origin" not in foreign.headers

    frontend = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert frontend.status_code == 200
    assert frontend.headers["access-control-allow-origin"] == "http://localhost:3000"
