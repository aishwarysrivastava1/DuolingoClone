"""Achievements: thresholds on learner metrics, unlocked after each session."""

import sqlite3
from datetime import datetime

from app import schemas
from app.services.path import CoursePath

_PERFECT_LESSONS_QUERY = """
SELECT COUNT(*) FROM lesson_sessions s
WHERE s.user_id = ? AND s.mode = 'lesson' AND s.status = 'completed'
  AND NOT EXISTS (
      SELECT 1 FROM exercise_attempts a WHERE a.session_id = s.id AND a.is_correct = 0
  )
"""


def compute_metrics(conn: sqlite3.Connection, user_id: int, path: CoursePath) -> dict[str, int]:
    user = conn.execute(
        "SELECT total_xp, longest_streak FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    lessons_completed = conn.execute(
        "SELECT COALESCE(SUM(times_completed), 0) FROM lesson_progress WHERE user_id = ?",
        (user_id,),
    ).fetchone()[0]
    return {
        "total_xp": user["total_xp"],
        "longest_streak": user["longest_streak"],
        "lessons_completed": lessons_completed,
        "perfect_lessons": conn.execute(_PERFECT_LESSONS_QUERY, (user_id,)).fetchone()[0],
        "crowns": path.total_crowns,
    }


def unlock_earned(
    conn: sqlite3.Connection, user_id: int, metrics: dict[str, int], now: datetime
) -> list[schemas.UnlockedAchievementOut]:
    """Persist every achievement whose threshold is now met; return the new ones."""
    pending = conn.execute(
        """
        SELECT a.* FROM achievements a
        WHERE NOT EXISTS (
            SELECT 1 FROM user_achievements ua
            WHERE ua.user_id = ? AND ua.achievement_id = a.id
        )
        ORDER BY a.position
        """,
        (user_id,),
    ).fetchall()
    earned = [row for row in pending if metrics[row["metric"]] >= row["threshold"]]
    conn.executemany(
        "INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)",
        [(user_id, row["id"], now.isoformat()) for row in earned],
    )
    return [
        schemas.UnlockedAchievementOut(
            code=row["code"], title=row["title"], description=row["description"], icon=row["icon"]
        )
        for row in earned
    ]


def list_achievements(
    conn: sqlite3.Connection, user_id: int, metrics: dict[str, int]
) -> list[schemas.AchievementOut]:
    rows = conn.execute(
        """
        SELECT a.*, ua.unlocked_at FROM achievements a
        LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
        ORDER BY a.position
        """,
        (user_id,),
    )
    return [
        schemas.AchievementOut(
            code=row["code"],
            title=row["title"],
            description=row["description"],
            icon=row["icon"],
            threshold=row["threshold"],
            progress=min(metrics[row["metric"]], row["threshold"]),
            unlocked_at=datetime.fromisoformat(row["unlocked_at"]) if row["unlocked_at"] else None,
        )
        for row in rows
    ]
