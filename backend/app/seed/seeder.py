"""Deterministic database seeding.

Writes the Spanish course, the achievement catalogue, a default learner with
some progress (2 skills crowned, a live 4-day streak, 4/5 hearts) and a
dozen rival learners for the leaderboard. Dates are relative to "today" so a
fresh seed always looks like an active learner.
"""

import sqlite3
from datetime import timedelta

from app.clock import Clock, current_clock
from app.database import transaction
from app.seed.content import SPANISH, CourseContent
from app.seed.lessons import build_lessons
from app.services import achievements
from app.services.path import load_course_path

# Children before parents so foreign keys never dangle mid-reset.
_TABLES_IN_DELETE_ORDER = (
    "user_achievements",
    "achievements",
    "exercise_attempts",
    "session_exercises",
    "lesson_sessions",
    "daily_activity",
    "lesson_progress",
    "users",
    "exercise_answers",
    "exercise_options",
    "exercises",
    "lessons",
    "skills",
    "units",
    "courses",
    "app_state",
)

ACHIEVEMENTS = (
    # code, title, description, icon, metric, threshold
    ("first_steps", "First Steps", "Complete your first lesson", "🐣", "lessons_completed", 1),
    ("wildfire", "Wildfire", "Reach a 3 day streak", "🔥", "longest_streak", 3),
    ("sage", "Sage", "Earn 100 XP", "🦉", "total_xp", 100),
    ("sharpshooter", "Sharpshooter", "Complete 3 lessons without a mistake", "🎯", "perfect_lessons", 3),
    ("royalty", "Royalty", "Earn 5 crowns", "👑", "crowns", 5),
    ("week_warrior", "Week Warrior", "Reach a 7 day streak", "📅", "longest_streak", 7),
    ("scholar", "Scholar", "Earn 500 XP", "📚", "total_xp", 500),
    ("bookworm", "Bookworm", "Complete 25 lessons", "🐛", "lessons_completed", 25),
    ("conqueror", "Conqueror", "Earn 15 crowns", "🏆", "crowns", 15),
)

LEARNER = {
    "username": "learner",
    "display_name": "Alex",
    "avatar_color": "#1CB0F6",
    "gems": 1000,
    "hearts": 4,
    "joined_days_ago": 12,
    "heart_lost_minutes_ago": 10,
}

# times_completed per lesson for the first skills of the course.
LEARNER_PROGRESS = ((2, 2, 2), (1, 1, 1), (1, 0, 0))

# days_ago → (xp, sessions). Days 1-4 form the live 4-day streak.
LEARNER_ACTIVITY = {1: (25, 2), 2: (30, 2), 3: (15, 1), 4: (15, 1), 8: (15, 1), 9: (25, 2), 10: (10, 1)}

RIVALS = (
    # display name, avatar colour, all-time XP, XP this week
    ("Sofía", "#FF4B4B", 2450, 310),
    ("Mateo", "#FF9600", 1980, 265),
    ("Lucía", "#CE82FF", 3120, 230),
    ("Diego", "#58CC02", 1210, 190),
    ("Valentina", "#2B70C9", 890, 160),
    ("Hugo", "#00CD9C", 640, 125),
    ("Camila", "#FFC800", 1530, 95),
    ("Leo", "#FF86D0", 420, 70),
    ("Isabella", "#A570FF", 760, 45),
    ("Daniel", "#E58600", 310, 30),
    ("Martina", "#1899D6", 180, 15),
    ("Pablo", "#777777", 95, 0),
)


def _insert_course(conn: sqlite3.Connection, course: CourseContent) -> int:
    course_id = conn.execute(
        "INSERT INTO courses (code, title, learning_language, from_language) VALUES (?, ?, ?, ?)",
        (course.code, course.title, course.learning_language, course.from_language),
    ).lastrowid
    for unit_position, unit in enumerate(course.units, start=1):
        unit_id = conn.execute(
            "INSERT INTO units (course_id, position, title, description, theme) VALUES (?, ?, ?, ?, ?)",
            (course_id, unit_position, unit.title, unit.description, unit.theme),
        ).lastrowid
        for skill_position, skill in enumerate(unit.skills, start=1):
            skill_id = conn.execute(
                "INSERT INTO skills (unit_id, position, title, icon) VALUES (?, ?, ?, ?)",
                (unit_id, skill_position, skill.title, skill.icon),
            ).lastrowid
            for lesson_position, exercises in enumerate(build_lessons(skill), start=1):
                lesson_id = conn.execute(
                    "INSERT INTO lessons (skill_id, position) VALUES (?, ?)", (skill_id, lesson_position)
                ).lastrowid
                for exercise_position, spec in enumerate(exercises, start=1):
                    exercise_id = conn.execute(
                        "INSERT INTO exercises (lesson_id, position, type, prompt, source_text, translation, audio_text) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (
                            lesson_id,
                            exercise_position,
                            spec.type,
                            spec.prompt,
                            spec.source_text,
                            spec.translation,
                            spec.audio_text,
                        ),
                    ).lastrowid
                    conn.executemany(
                        "INSERT INTO exercise_options (exercise_id, position, text, match_text, image, is_correct) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        [
                            (exercise_id, position, o.text, o.match_text, o.image, int(o.is_correct))
                            for position, o in enumerate(spec.options, start=1)
                        ],
                    )
                    conn.executemany(
                        "INSERT INTO exercise_answers (exercise_id, text, is_primary) VALUES (?, ?, ?)",
                        [(exercise_id, text, int(index == 0)) for index, text in enumerate(spec.answers)],
                    )
    return course_id


def _insert_achievements(conn: sqlite3.Connection) -> None:
    conn.executemany(
        "INSERT INTO achievements (code, title, description, icon, metric, threshold, position) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        [(*row, position) for position, row in enumerate(ACHIEVEMENTS, start=1)],
    )


def _insert_learner(conn: sqlite3.Connection, course_id: int, clock: Clock) -> int:
    today = clock.today
    streak_days = [days for days in sorted(LEARNER_ACTIVITY) if days <= 4]
    user_id = conn.execute(
        """
        INSERT INTO users (username, display_name, avatar_color, course_id, joined_on, total_xp, gems,
                           hearts, hearts_refill_from, current_streak, longest_streak, last_active_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            LEARNER["username"],
            LEARNER["display_name"],
            LEARNER["avatar_color"],
            course_id,
            (today - timedelta(days=LEARNER["joined_days_ago"])).isoformat(),
            sum(xp for xp, _ in LEARNER_ACTIVITY.values()),
            LEARNER["gems"],
            LEARNER["hearts"],
            (clock.now - timedelta(minutes=LEARNER["heart_lost_minutes_ago"])).isoformat(),
            len(streak_days),
            len(streak_days),
            (today - timedelta(days=1)).isoformat(),
        ),
    ).lastrowid
    conn.executemany(
        "INSERT INTO daily_activity (user_id, activity_date, xp_earned, sessions_completed) VALUES (?, ?, ?, ?)",
        [
            (user_id, (today - timedelta(days=days)).isoformat(), xp, sessions)
            for days, (xp, sessions) in LEARNER_ACTIVITY.items()
        ],
    )

    skills = conn.execute(
        """
        SELECT s.id FROM skills s JOIN units u ON u.id = s.unit_id
        WHERE u.course_id = ? ORDER BY u.position, s.position
        """,
        (course_id,),
    ).fetchall()
    progress_rows = []
    for skill, completions in zip(skills, LEARNER_PROGRESS):
        lessons = conn.execute(
            "SELECT id FROM lessons WHERE skill_id = ? ORDER BY position", (skill["id"],)
        ).fetchall()
        progress_rows += [
            (user_id, lesson["id"], times, clock.now.isoformat())
            for lesson, times in zip(lessons, completions)
            if times > 0
        ]
    conn.executemany(
        "INSERT INTO lesson_progress (user_id, lesson_id, times_completed, last_completed_at) VALUES (?, ?, ?, ?)",
        progress_rows,
    )

    path = load_course_path(conn, user_id, course_id)
    achievements.unlock_earned(conn, user_id, achievements.compute_metrics(conn, user_id, path), clock.now)
    return user_id


def _insert_rivals(conn: sqlite3.Connection, course_id: int, clock: Clock) -> None:
    today = clock.today
    days_this_week = today.weekday() + 1
    for display_name, color, total_xp, weekly_xp in RIVALS:
        active = weekly_xp > 0
        user_id = conn.execute(
            """
            INSERT INTO users (username, display_name, avatar_color, course_id, joined_on, total_xp,
                               current_streak, longest_streak, last_active_on)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                display_name.lower().replace("í", "i"),
                display_name,
                color,
                course_id,
                (today - timedelta(days=60)).isoformat(),
                total_xp,
                days_this_week if active else 0,
                max(days_this_week, 10) if active else 10,
                today.isoformat() if active else (today - timedelta(days=9)).isoformat(),
            ),
        ).lastrowid
        if not active:
            continue
        # Spread this week's XP evenly from Monday to today (remainder lands today).
        share, remainder = divmod(weekly_xp, days_this_week)
        conn.executemany(
            "INSERT INTO daily_activity (user_id, activity_date, xp_earned, sessions_completed) VALUES (?, ?, ?, ?)",
            [
                (
                    user_id,
                    (today - timedelta(days=days_ago)).isoformat(),
                    share + (remainder if days_ago == 0 else 0),
                    1,
                )
                for days_ago in range(days_this_week)
            ],
        )


def seed_database(conn: sqlite3.Connection, timezone_name: str | None = None) -> None:
    """Wipe all data and write a fresh, deterministic dataset."""
    with transaction(conn):
        for table in _TABLES_IN_DELETE_ORDER:
            conn.execute(f"DELETE FROM {table}")
        clock = current_clock(conn, timezone_name)  # day offset is back to 0 here
        course_id = _insert_course(conn, SPANISH)
        _insert_achievements(conn)
        _insert_learner(conn, course_id, clock)
        _insert_rivals(conn, course_id, clock)
