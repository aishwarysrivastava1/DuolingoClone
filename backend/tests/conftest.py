import sqlite3
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.database import connect
from app.main import create_app
from app.seed.lessons import tokenize


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(database_path=tmp_path / "test.db", cors_origins=["http://localhost:3000"])


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    with TestClient(create_app(settings)) as test_client:
        yield test_client


@pytest.fixture
def db(client: TestClient, settings: Settings) -> Iterator[sqlite3.Connection]:
    conn = connect(settings.database_path)
    yield conn
    conn.close()


def correct_answer(db: sqlite3.Connection, exercise: dict) -> dict:
    """Build a correct answer payload by peeking at the answer key."""
    kind = exercise["type"]
    options = exercise["options"]
    if kind in ("multiple_choice", "fill_blank"):
        row = db.execute(
            "SELECT id FROM exercise_options WHERE exercise_id = ? AND is_correct = 1", (exercise["id"],)
        ).fetchone()
        return {"type": kind, "option_id": row["id"]}
    if kind == "match_pairs":
        return {"type": kind, "pairs": [[o["id"], o["id"]] for o in options]}
    primary = db.execute(
        "SELECT text FROM exercise_answers WHERE exercise_id = ? AND is_primary = 1", (exercise["id"],)
    ).fetchone()["text"]
    if kind == "type_answer":
        return {"type": kind, "text": primary}
    unused = list(options)
    option_ids = []
    for token in tokenize(primary):
        tile = next(o for o in unused if o["text"] == token)
        unused.remove(tile)
        option_ids.append(tile["id"])
    return {"type": kind, "option_ids": option_ids}


def answer(client: TestClient, session_id: int, exercise_id: int, payload: dict):
    return client.post(
        f"/api/sessions/{session_id}/answers", json={"exercise_id": exercise_id, "answer": payload}
    )


def play_perfect_session(client: TestClient, db: sqlite3.Connection, session: dict) -> dict:
    for exercise in session["exercises"]:
        result = answer(client, session["id"], exercise["id"], correct_answer(db, exercise))
        assert result.status_code == 200, result.text
        assert result.json()["correct"], exercise
    response = client.post(f"/api/sessions/{session['id']}/complete")
    assert response.status_code == 200, response.text
    return response.json()


def start(client: TestClient, mode: str = "lesson", skill_id: int | None = 3):
    return client.post("/api/sessions", json={"mode": mode, "skill_id": skill_id})
