"""The app's notion of "now".

Real time plus a simulated day offset (stored in `app_state`) so streak and
heart-regeneration rules can be exercised without waiting for real days.
"""

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.database import Connection

DAY_OFFSET_KEY = "day_offset"


@dataclass(frozen=True)
class Clock:
    now: datetime  # timezone-aware UTC
    today: date  # the learner's local calendar date

    @classmethod
    def at(cls, now: datetime, tz: ZoneInfo | None = None) -> "Clock":
        return cls(now=now, today=now.astimezone(tz or UTC).date())


# IANA names are short ("America/Argentina/ComodRivadavia" is among the longest).
_MAX_TIMEZONE_LENGTH = 64


def resolve_timezone(name: str | None) -> ZoneInfo | None:
    """The learner's timezone from the X-Timezone header; None (UTC) if missing or invalid.

    The header is client-controlled, so any lookup failure falls back to UTC
    (ZoneInfo raises OSError, not just ZoneInfoNotFoundError, for odd inputs).
    """
    if not name or len(name) > _MAX_TIMEZONE_LENGTH:
        return None
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError, OSError):
        return None


def get_day_offset(conn: Connection) -> int:
    row = conn.execute("SELECT value FROM app_state WHERE key = ?", (DAY_OFFSET_KEY,)).fetchone()
    return int(row["value"]) if row else 0


def set_day_offset(conn: Connection, days: int) -> None:
    conn.execute(
        "INSERT INTO app_state (key, value) VALUES (?, ?) "
        "ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        (DAY_OFFSET_KEY, str(days)),
    )


def current_clock(conn: Connection, timezone_name: str | None = None) -> Clock:
    now = datetime.now(UTC) + timedelta(days=get_day_offset(conn))
    return Clock.at(now, resolve_timezone(timezone_name))
