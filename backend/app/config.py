"""Runtime configuration, read from environment variables."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # Local SQLite file, used whenever Turso isn't configured (e.g. local development).
    database_path: Path = BACKEND_DIR / "data" / "duolingo.db"
    # Turso (libSQL) database, e.g. libsql://<db>-<org>.turso.io, and its auth token.
    turso_database_url: str | None = None
    turso_auth_token: str | None = None
    cors_origins: list[str] = field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    cors_origin_regex: str | None = None
    heart_regen_minutes: int = 30
    default_username: str = "learner"
    enable_dev_routes: bool = True

    @property
    def uses_turso(self) -> bool:
        return bool(self.turso_database_url)


def load_settings() -> Settings:
    # backend/.env (optional) fills in anything not already set in the real environment.
    load_dotenv(BACKEND_DIR / ".env", override=False)
    defaults = Settings()
    return Settings(
        database_path=Path(os.getenv("DATABASE_PATH", str(defaults.database_path))),
        turso_database_url=os.getenv("TURSO_DATABASE_URL", "").strip() or None,
        turso_auth_token=os.getenv("TURSO_AUTH_TOKEN", "").strip() or None,
        cors_origins=_split_csv(os.getenv("CORS_ORIGINS", ",".join(defaults.cors_origins))),
        cors_origin_regex=os.getenv("CORS_ORIGIN_REGEX") or None,
        heart_regen_minutes=int(os.getenv("HEART_REGEN_MINUTES", defaults.heart_regen_minutes)),
        default_username=os.getenv("DEFAULT_USERNAME", defaults.default_username),
        enable_dev_routes=os.getenv("ENABLE_DEV_ROUTES", "true").lower() in {"1", "true", "yes"},
    )
