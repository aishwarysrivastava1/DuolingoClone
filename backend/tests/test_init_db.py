"""scripts/init_db.py: verify the connection, create missing tables, seed when empty."""

import importlib.util
import sqlite3
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "init_db.py"


@pytest.fixture
def init_db(monkeypatch, tmp_path):
    monkeypatch.delenv("TURSO_DATABASE_URL", raising=False)
    monkeypatch.delenv("TURSO_AUTH_TOKEN", raising=False)
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "fresh.db"))
    spec = importlib.util.spec_from_file_location("init_db", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, tmp_path / "fresh.db"


def test_creates_tables_and_seeds_an_empty_database(init_db, capsys):
    script, path = init_db
    assert script.main([]) == 0
    output = capsys.readouterr().out
    assert "✓ Connected" in output and "created 16" in output and "✓ Seeded" in output

    conn = sqlite3.connect(path)
    assert conn.execute("SELECT COUNT(*) FROM exercises").fetchone()[0] == 216
    conn.close()


def test_second_run_only_verifies(init_db, capsys):
    script, _ = init_db
    script.main([])
    capsys.readouterr()
    assert script.main([]) == 0
    output = capsys.readouterr().out
    assert "nothing to create" in output and "Seeded" not in output


def test_reset_requires_confirmation(init_db, capsys, monkeypatch):
    script, _ = init_db
    script.main([])
    monkeypatch.setattr("builtins.input", lambda prompt: "no")
    assert script.main(["--reset"]) == 1
    assert script.main(["--reset", "--yes"]) == 0
    assert "re-seeded" in capsys.readouterr().out


def test_reports_unreachable_turso(init_db, capsys, monkeypatch):
    script, _ = init_db
    monkeypatch.setenv("TURSO_DATABASE_URL", "http://127.0.0.1:9")
    monkeypatch.setenv("TURSO_AUTH_TOKEN", "token")
    assert script.main([]) == 1
    assert "✗ Could not connect" in capsys.readouterr().out
