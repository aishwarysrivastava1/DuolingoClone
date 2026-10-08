"""Leaderboard: weekly league (XP since Monday) or all-time XP."""

import sqlite3
from datetime import date, timedelta
from typing import Literal

from app import schemas

LEAGUE_NAME = "Bronze"
PROMOTION_CUTOFF = 5

_WEEKLY_QUERY = """
SELECT u.id, u.display_name, u.avatar_color, COALESCE(SUM(d.xp_earned), 0) AS xp
FROM users u
LEFT JOIN daily_activity d
       ON d.user_id = u.id AND d.activity_date BETWEEN :start AND :end
WHERE u.course_id = :course_id
GROUP BY u.id
ORDER BY xp DESC, u.display_name
"""

_ALL_TIME_QUERY = """
SELECT id, display_name, avatar_color, total_xp AS xp
FROM users
WHERE course_id = :course_id
ORDER BY xp DESC, display_name
"""


def get_leaderboard(
    conn: sqlite3.Connection, user_id: int, period: Literal["week", "all"], today: date
) -> schemas.LeaderboardOut:
    course_id = conn.execute("SELECT course_id FROM users WHERE id = ?", (user_id,)).fetchone()["course_id"]
    monday = today - timedelta(days=today.weekday())
    params = {"course_id": course_id, "start": monday.isoformat(), "end": today.isoformat()}
    rows = conn.execute(_WEEKLY_QUERY if period == "week" else _ALL_TIME_QUERY, params).fetchall()
    return schemas.LeaderboardOut(
        period=period,
        league=LEAGUE_NAME,
        days_left=7 - today.weekday(),
        promotion_cutoff=PROMOTION_CUTOFF,
        entries=[
            schemas.LeaderboardEntryOut(
                rank=rank,
                user_id=row["id"],
                display_name=row["display_name"],
                avatar_color=row["avatar_color"],
                xp=row["xp"],
                is_me=row["id"] == user_id,
            )
            for rank, row in enumerate(rows, start=1)
        ],
    )
