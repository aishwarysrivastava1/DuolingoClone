"""Learner state: stats read-model, hearts persistence, settings and refills."""

import sqlite3
from datetime import date, datetime, timedelta

from app import schemas
from app.clock import Clock
from app.errors import AppError
from app.rules import HEART_REFILL_COST_GEMS, MAX_HEARTS
from app.services import hearts as heart_rules
from app.services.streaks import visible_streak


def get_user(conn: sqlite3.Connection, user_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise AppError(404, "user_not_found", "Learner not found.")
    return row


def find_user_id(conn: sqlite3.Connection, username: str) -> int:
    row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if row is None:
        raise AppError(503, "not_seeded", "The default learner does not exist. Seed the database first.")
    return row["id"]


def parse_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


# --- Hearts ------------------------------------------------------------------


def stored_hearts(user: sqlite3.Row) -> heart_rules.Hearts:
    anchor = user["hearts_refill_from"]
    return heart_rules.Hearts(user["hearts"], datetime.fromisoformat(anchor) if anchor else None)


def current_hearts(user: sqlite3.Row, now: datetime, interval: timedelta) -> heart_rules.Hearts:
    return heart_rules.regenerate(stored_hearts(user), now, interval)


def save_hearts(conn: sqlite3.Connection, user_id: int, hearts: heart_rules.Hearts) -> None:
    conn.execute(
        "UPDATE users SET hearts = ?, hearts_refill_from = ? WHERE id = ?",
        (hearts.count, hearts.refill_from.isoformat() if hearts.refill_from else None, user_id),
    )


def hearts_out(hearts: heart_rules.Hearts, interval: timedelta) -> schemas.HeartsOut:
    return schemas.HeartsOut(
        count=hearts.count,
        max=MAX_HEARTS,
        next_heart_at=heart_rules.next_heart_at(hearts, interval),
        regen_minutes=int(interval.total_seconds() // 60),
        refill_cost_gems=HEART_REFILL_COST_GEMS,
    )


def refill_hearts(conn: sqlite3.Connection, user_id: int, clock: Clock, interval: timedelta) -> None:
    user = get_user(conn, user_id)
    hearts = current_hearts(user, clock.now, interval)
    if hearts.is_full:
        raise AppError(409, "hearts_full", "Your hearts are already full.")
    if user["gems"] < HEART_REFILL_COST_GEMS:
        raise AppError(409, "not_enough_gems", "You don't have enough gems to refill your hearts.")
    conn.execute("UPDATE users SET gems = gems - ? WHERE id = ?", (HEART_REFILL_COST_GEMS, user_id))
    save_hearts(conn, user_id, heart_rules.Hearts(MAX_HEARTS, None))


# --- Streak & daily goal -------------------------------------------------------


def xp_on(conn: sqlite3.Connection, user_id: int, day: date) -> int:
    row = conn.execute(
        "SELECT xp_earned FROM daily_activity WHERE user_id = ? AND activity_date = ?",
        (user_id, day.isoformat()),
    ).fetchone()
    return row["xp_earned"] if row else 0


def streak_week(conn: sqlite3.Connection, user_id: int, today: date) -> list[schemas.StreakDayOut]:
    """Monday → Sunday of the current week, flagging days with XP."""
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    active = {
        row["activity_date"]
        for row in conn.execute(
            "SELECT activity_date FROM daily_activity "
            "WHERE user_id = ? AND activity_date BETWEEN ? AND ? AND xp_earned > 0",
            (user_id, monday.isoformat(), sunday.isoformat()),
        )
    }
    days = (monday + timedelta(days=offset) for offset in range(7))
    return [schemas.StreakDayOut(date=day, active=day.isoformat() in active) for day in days]


# --- Read model ----------------------------------------------------------------


def course_out(conn: sqlite3.Connection, course_id: int) -> schemas.CourseOut:
    row = conn.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    return schemas.CourseOut(**dict(row))


def build_me(conn: sqlite3.Connection, user_id: int, clock: Clock, interval: timedelta) -> schemas.MeOut:
    user = get_user(conn, user_id)
    last_active_on = parse_date(user["last_active_on"])
    today_xp = xp_on(conn, user_id, clock.today)
    return schemas.MeOut(
        id=user["id"],
        username=user["username"],
        display_name=user["display_name"],
        avatar_color=user["avatar_color"],
        joined_on=date.fromisoformat(user["joined_on"]),
        today=clock.today,
        course=course_out(conn, user["course_id"]),
        total_xp=user["total_xp"],
        gems=user["gems"],
        hearts=hearts_out(current_hearts(user, clock.now, interval), interval),
        streak=schemas.StreakOut(
            count=visible_streak(user["current_streak"], last_active_on, clock.today),
            longest=user["longest_streak"],
            active_today=last_active_on == clock.today,
            week=streak_week(conn, user_id, clock.today),
        ),
        daily_goal=schemas.DailyGoalOut(
            goal_xp=user["daily_goal_xp"],
            today_xp=today_xp,
            completed=today_xp >= user["daily_goal_xp"],
        ),
        settings=schemas.SettingsOut(
            sound_enabled=bool(user["sound_enabled"]), daily_goal_xp=user["daily_goal_xp"]
        ),
    )


def update_settings(conn: sqlite3.Connection, user_id: int, update: schemas.SettingsUpdate) -> None:
    display_name = update.display_name.strip() if update.display_name is not None else None
    if display_name == "":
        raise AppError(422, "invalid_display_name", "Your name can't be blank.")
    columns = {
        "display_name": display_name,
        "daily_goal_xp": update.daily_goal_xp,
        "sound_enabled": None if update.sound_enabled is None else int(update.sound_enabled),
    }
    changes = {column: value for column, value in columns.items() if value is not None}
    if not changes:
        return
    assignments = ", ".join(f"{column} = :{column}" for column in changes)
    conn.execute(f"UPDATE users SET {assignments} WHERE id = :id", {**changes, "id": user_id})
