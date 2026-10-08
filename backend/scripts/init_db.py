"""Check the database connection and create any missing tables.

Run from the backend/ directory:

    python scripts/init_db.py                 # verify connection, create missing tables, seed if empty
    python scripts/init_db.py --reset         # also wipe all data and re-seed (asks first)

Uses Turso when TURSO_DATABASE_URL is set (in the environment or backend/.env),
otherwise the local SQLite file.
"""

import argparse
import re
import statistics
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import load_settings  # noqa: E402
from app.database import SCHEMA_PATH, Connection, connect, describe_database, init_schema, is_seeded  # noqa: E402
from app.seed import seed_database  # noqa: E402

EXPECTED_TABLES = re.findall(r"CREATE TABLE IF NOT EXISTS (\w+)", SCHEMA_PATH.read_text(encoding="utf-8"))


def existing_tables(conn: Connection) -> set[str]:
    return {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}


def connection_hint(error: Exception) -> str:
    message = str(error)
    if "401" in message or "Unauthorized" in message:
        return "Check TURSO_AUTH_TOKEN (create one with: turso db tokens create <database>)."
    if "404" in message:
        return "Check TURSO_DATABASE_URL (see: turso db show <database> --url)."
    return "Check TURSO_DATABASE_URL, TURSO_AUTH_TOKEN and your network connection."


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify the database connection and create missing tables.")
    parser.add_argument("--reset", action="store_true", help="wipe all data and re-seed the demo course")
    parser.add_argument("--yes", action="store_true", help="don't ask before --reset")
    parser.add_argument("--timezone", help="IANA timezone used for 'today' when seeding (default: UTC)")
    args = parser.parse_args(argv)

    settings = load_settings()
    print(f"Database: {describe_database(settings)}")
    if settings.uses_turso and not settings.turso_auth_token:
        print("  ! TURSO_AUTH_TOKEN is not set; Turso Cloud databases require one.")

    conn = connect(settings)
    try:
        try:
            timings = []
            for _ in range(5):
                started = time.perf_counter()
                version = conn.execute("SELECT sqlite_version()").fetchone()[0]
                timings.append((time.perf_counter() - started) * 1000)
        except Exception as error:  # the libSQL client reports every failure as ValueError
            print(f"✗ Could not connect: {error}")
            print(f"  {connection_hint(error)}")
            return 1
        print(f"✓ Connected (SQLite {version}, median round trip {statistics.median(timings):.0f} ms)")

        before = existing_tables(conn)
        init_schema(conn)
        after = existing_tables(conn)
        missing = [table for table in EXPECTED_TABLES if table not in after]
        if missing:
            print(f"✗ Tables still missing after migration: {', '.join(missing)}")
            return 1
        created = [table for table in EXPECTED_TABLES if table not in before]
        detail = f"created {len(created)}: {', '.join(created)}" if created else "nothing to create"
        print(f"✓ Schema: all {len(EXPECTED_TABLES)} tables present ({detail})")

        if conn.execute("PRAGMA foreign_keys").fetchone()[0]:
            print("✓ Foreign keys are enforced")
        else:
            print("! Foreign keys are not enforced on this connection")

        if args.reset:
            if not args.yes and input("Wipe ALL data and re-seed? Type 'reset' to confirm: ").strip() != "reset":
                print("Reset cancelled.")
                return 1
            seed_database(conn, args.timezone)
            print("✓ Wiped and re-seeded the demo data")
        elif not is_seeded(conn):
            seed_database(conn, args.timezone)
            print("✓ Seeded the demo course, learner and leaderboard")

        counts = {
            table: conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            for table in ("courses", "exercises", "users", "lesson_sessions")
        }
        print(
            f"✓ Data: {counts['courses']} course, {counts['exercises']} exercises, "
            f"{counts['users']} learners, {counts['lesson_sessions']} lesson sessions"
        )
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
