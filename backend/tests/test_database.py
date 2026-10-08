"""The libSQL adapter must behave like sqlite3 for everything the services use.

These run against libSQL's embedded engine, so no server is needed; the full
API suite can also run against a libSQL server (see conftest.py).
"""

import sqlite3

import libsql
import pytest

from app.config import Settings, load_settings
from app.database import LibsqlConnection, _bind, connect, init_schema, is_seeded, transaction
from app.seed import seed_database


@pytest.fixture
def libsql_conn():
    conn = LibsqlConnection(libsql.connect(":memory:", isolation_level=None))
    conn.executescript("CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score INTEGER)")
    yield conn
    conn.close()


def test_named_parameters_become_positional():
    sql, values = _bind("SELECT :a, ':b is text', :b -- :c\nWHERE x = :a", {"a": 1, "b": 2, "unused": 3})
    assert sql == "SELECT ?, ':b is text', ? -- :c\nWHERE x = ?"
    assert values == (1, 2, 1)
    assert _bind("SELECT ?", [5]) == ("SELECT ?", (5,))
    with pytest.raises(ValueError, match=":missing"):
        _bind("SELECT :missing", {})


def test_rows_behave_like_sqlite_rows(libsql_conn):
    libsql_conn.execute("INSERT INTO t (name, score) VALUES (:name, :score)", {"name": "Ana", "score": 7})
    row = libsql_conn.execute("SELECT id, name, score AS Points FROM t").fetchone()
    assert (row["id"], row["name"], row[2], row["points"]) == (1, "Ana", 7, 7)
    assert dict(row) == {"id": 1, "name": "Ana", "Points": 7}
    assert list(row) == [1, "Ana", 7] and len(row) == 3
    assert libsql_conn.execute("SELECT * FROM t WHERE id = ?", (99,)).fetchone() is None
    assert [r["name"] for r in libsql_conn.execute("SELECT name FROM t")] == ["Ana"]


def test_executemany_batches_inserts_like_sqlite(libsql_conn):
    rows = [(f"user{i}", i) for i in range(700)]  # 1,400 parameters → split across statements
    libsql_conn.executemany("INSERT INTO t (name, score) VALUES (?, ?)", rows)
    stored = [tuple(r) for r in libsql_conn.execute("SELECT name, score FROM t ORDER BY id")]
    assert stored == rows

    # Statements that aren't plain INSERT … VALUES run row by row.
    libsql_conn.executemany(
        "INSERT INTO t (id, name, score) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET score = excluded.score",
        [(1, "user0", 100), (2, "user1", 200)],
    )
    assert libsql_conn.execute("SELECT score FROM t WHERE id = 2").fetchone()[0] == 200


def test_transaction_commits_and_rolls_back(libsql_conn):
    with transaction(libsql_conn):
        libsql_conn.execute("INSERT INTO t (name) VALUES ('kept')")
    with pytest.raises(RuntimeError):
        with transaction(libsql_conn):
            libsql_conn.execute("INSERT INTO t (name) VALUES ('discarded')")
            raise RuntimeError("boom")
    assert [r["name"] for r in libsql_conn.execute("SELECT name FROM t")] == ["kept"]


def test_failed_rollback_does_not_hide_the_original_error():
    class BrokenConnection:
        def execute(self, sql, params=()):
            if sql == "ROLLBACK":
                raise ValueError("server already aborted the transaction")

    with pytest.raises(KeyError, match="original"):
        with transaction(BrokenConnection()):
            raise KeyError("original")


def test_schema_and_seed_work_through_the_adapter():
    conn = LibsqlConnection(libsql.connect(":memory:", isolation_level=None))
    init_schema(conn)
    init_schema(conn)  # idempotent: only creates what's missing
    seed_database(conn)
    assert is_seeded(conn)
    counts = {
        table: conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in ("units", "skills", "lessons", "exercises", "exercise_options", "users")
    }
    assert counts == {"units": 3, "skills": 9, "lessons": 27, "exercises": 216, "exercise_options": 823, "users": 13}
    assert conn.execute("PRAGMA foreign_keys").fetchone()[0] == 1


def test_connect_falls_back_to_sqlite_without_turso_settings(tmp_path):
    local = connect(Settings(database_path=tmp_path / "local.db"))
    assert isinstance(local, sqlite3.Connection)
    local.close()
    remote = connect(Settings(turso_database_url="libsql://example.turso.io", turso_auth_token="token"))
    assert isinstance(remote, LibsqlConnection)  # connecting is lazy; nothing is sent yet


def test_settings_read_turso_environment(monkeypatch):
    monkeypatch.setenv("TURSO_DATABASE_URL", "libsql://db-org.turso.io")
    monkeypatch.setenv("TURSO_AUTH_TOKEN", "secret")
    settings = load_settings()
    assert settings.uses_turso and settings.turso_auth_token == "secret"

    monkeypatch.setenv("TURSO_DATABASE_URL", "  ")
    assert not load_settings().uses_turso
