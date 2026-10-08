"""Regression tests for issues found in the codebase audit."""

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, load_settings
from app.main import create_app
from app.services.streaks import record_activity
from tests.conftest import play_perfect_session, start

EAST, WEST = "Pacific/Kiritimati", "Pacific/Pago_Pago"  # UTC+14 and UTC-11: always different dates


@pytest.mark.parametrize(
    "header",
    ["a" * 5000, "../../etc/passwd", "America", "Not/AZone"],
    ids=["very-long", "path-traversal", "directory", "unknown-zone"],
)
def test_bad_timezone_header_falls_back_to_utc(client, header):
    response = client.get("/api/me", headers={"X-Timezone": header})
    assert response.status_code == 200


def test_unhandled_errors_are_json_and_keep_cors_headers(tmp_path):
    app = create_app(Settings(database_path=tmp_path / "x.db", cors_origins=["http://localhost:3000"]))

    @app.get("/api/boom")
    def boom() -> None:
        raise RuntimeError("simulated database outage")

    with TestClient(app) as client:
        response = client.get("/api/boom", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "internal_error"
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_streak_survives_a_westward_timezone_change(client, db):
    client.headers["X-Timezone"] = EAST
    client.post("/api/dev/reset")  # seed "yesterday" relative to the eastern date
    assert play_perfect_session(client, db, start(client).json())["streak"]["count"] == 5

    client.headers["X-Timezone"] = WEST  # the same moment is an earlier calendar day here
    me = client.get("/api/me").json()
    assert (me["streak"]["count"], me["streak"]["active_today"]) == (5, True)
    summary = play_perfect_session(client, db, start(client).json())
    assert (summary["streak"]["count"], summary["streak"]["extended"]) == (5, False)


def test_record_activity_never_moves_the_last_active_day_backwards():
    from datetime import date

    update = record_activity(30, 30, date(2026, 10, 9), date(2026, 10, 8))
    assert (update.current, update.extended, update.active_on) == (30, False, date(2026, 10, 9))


def test_cors_origins_ignore_trailing_slashes(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", " https://duolingo-clone.vercel.app/ ,http://localhost:3000")
    assert load_settings().cors_origins == ["https://duolingo-clone.vercel.app", "http://localhost:3000"]


@pytest.mark.parametrize(("value", "message"), [("0", "at least 1"), ("-5", "at least 1"), ("soon", "whole number")])
def test_invalid_heart_regen_minutes_fail_at_startup(monkeypatch, value, message):
    monkeypatch.setenv("HEART_REGEN_MINUTES", value)
    with pytest.raises(ValueError, match=message):
        load_settings()


def test_settings_reject_zero_regen_interval():
    with pytest.raises(ValueError):
        Settings(heart_regen_minutes=0)
