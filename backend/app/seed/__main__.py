"""`python -m app.seed` — (re)create and seed the SQLite database."""

import argparse

from app.config import load_settings
from app.database import connect, init_schema
from app.seed.seeder import seed_database


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset and seed the Duolingo clone database.")
    parser.add_argument("--timezone", help="IANA timezone used for 'today' (default: UTC)")
    args = parser.parse_args()

    settings = load_settings()
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect(settings.database_path)
    try:
        init_schema(conn)
        seed_database(conn, args.timezone)
        counts = {
            table: conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            for table in ("units", "skills", "lessons", "exercises", "users")
        }
    finally:
        conn.close()
    print(f"Seeded {settings.database_path}: " + ", ".join(f"{n} {t}" for t, n in counts.items()))


if __name__ == "__main__":
    main()
