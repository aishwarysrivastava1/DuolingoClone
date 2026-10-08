"""Lesson sessions — the server half of the lesson player.

    start ──► answer* ──► complete
                 │
                 └──────► abandon

The server is authoritative: it deals the exercises, grades every answer,
spends hearts on mistakes and only awards XP once every exercise in the
session has been answered correctly at least once.
"""

import random
from datetime import datetime, timedelta

from app import schemas
from app.clock import Clock
from app.database import Connection, Row
from app.errors import AppError
from app.rules import (
    MAX_CROWN_LEVEL,
    PERFECT_LESSON_BONUS_XP,
    PRACTICE_SESSION_SIZE,
    PRACTICE_XP,
)
from app.services import achievements, learner
from app.services import hearts as heart_rules
from app.services.grading import grade
from app.services.path import CoursePath, SkillProgress, load_course_path
from app.services.streaks import record_activity

_UNSOLVED_QUERY = """
SELECT COUNT(*) FROM session_exercises se
WHERE se.session_id = ?
  AND NOT EXISTS (
      SELECT 1 FROM exercise_attempts a
      WHERE a.session_id = se.session_id AND a.exercise_id = se.exercise_id AND a.is_correct = 1
  )
"""


# --- helpers -------------------------------------------------------------------


def _get_session(conn: Connection, user_id: int, session_id: int) -> Row:
    row = conn.execute(
        "SELECT * FROM lesson_sessions WHERE id = ? AND user_id = ?", (session_id, user_id)
    ).fetchone()
    if row is None:
        raise AppError(404, "session_not_found", "Session not found.")
    return row


def _require_active(session: Row) -> None:
    if session["status"] != "active":
        raise AppError(409, "session_closed", "This session has already ended.")


def _placeholders(values: list[int]) -> str:
    return ", ".join("?" for _ in values)


def _exercises_out(conn: Connection, exercise_ids: list[int]) -> list[schemas.ExerciseOut]:
    """Client-safe exercise payloads in play order (no correctness flags)."""
    marks = _placeholders(exercise_ids)
    rows = {row["id"]: row for row in conn.execute(f"SELECT * FROM exercises WHERE id IN ({marks})", exercise_ids)}
    options: dict[int, list[schemas.OptionOut]] = {exercise_id: [] for exercise_id in exercise_ids}
    for option in conn.execute(
        f"SELECT * FROM exercise_options WHERE exercise_id IN ({marks}) ORDER BY position", exercise_ids
    ):
        is_pair = rows[option["exercise_id"]]["type"] == "match_pairs"
        options[option["exercise_id"]].append(
            schemas.OptionOut(
                id=option["id"],
                text=option["text"],
                image=option["image"],
                match_text=option["match_text"] if is_pair else None,
            )
        )
    payloads = []
    for exercise_id in exercise_ids:
        row = rows[exercise_id]
        shuffled = options[exercise_id][:]
        random.shuffle(shuffled)
        payloads.append(
            schemas.ExerciseOut(
                id=row["id"],
                type=row["type"],
                prompt=row["prompt"],
                source_text=row["source_text"],
                translation=row["translation"],
                audio_text=row["audio_text"],
                options=shuffled,
            )
        )
    return payloads


def _exercise_ids_for_lessons(conn: Connection, lesson_ids: list[int]) -> list[int]:
    query = f"SELECT id FROM exercises WHERE lesson_id IN ({_placeholders(lesson_ids)}) ORDER BY lesson_id, position"
    return [row["id"] for row in conn.execute(query, lesson_ids)]


def _find_skill(path: CoursePath, skill_id: int) -> SkillProgress:
    skill = path.find_skill(skill_id)
    if skill is None:
        raise AppError(404, "skill_not_found", "Skill not found.")
    return skill


# --- start ---------------------------------------------------------------------


def start_session(
    conn: Connection,
    user_id: int,
    request: schemas.SessionCreate,
    clock: Clock,
    regen: timedelta,
) -> schemas.SessionOut:
    user = learner.get_user(conn, user_id)
    path = load_course_path(conn, user_id, user["course_id"])
    skill = _find_skill(path, request.skill_id) if request.skill_id is not None else None
    if skill is not None and skill.state == "locked":
        raise AppError(403, "skill_locked", "Complete the levels above to unlock this one.")
    hearts = learner.current_hearts(user, clock.now, regen)

    lesson_id: int | None = None
    if request.mode == "lesson":
        if skill is None:
            raise AppError(422, "skill_required", "Choose a skill to start a lesson.")
        lesson_id = skill.next_lesson_id
        if lesson_id is None:
            raise AppError(409, "skill_legendary", "This skill is legendary! Practice it instead.")
        if hearts.count == 0:
            raise AppError(409, "out_of_hearts", "You ran out of hearts. Refill or practice to earn more.")
        exercise_ids = _exercise_ids_for_lessons(conn, [lesson_id])
    else:
        lesson_ids = (
            [lid for lid, times in zip(skill.lesson_ids, skill.completions) if times > 0]
            if skill is not None
            else path.completed_lesson_ids()
        )
        if not lesson_ids:
            raise AppError(409, "nothing_to_practice", "Finish a lesson first, then come back to practice.")
        pool = _exercise_ids_for_lessons(conn, lesson_ids)
        exercise_ids = random.sample(pool, min(PRACTICE_SESSION_SIZE, len(pool)))

    # One active session per learner: starting a new one closes any stale one.
    conn.execute(
        "UPDATE lesson_sessions SET status = 'abandoned', ended_at = ? WHERE user_id = ? AND status = 'active'",
        (clock.now.isoformat(), user_id),
    )
    session_id = conn.execute(
        "INSERT INTO lesson_sessions (user_id, mode, skill_id, lesson_id, started_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, request.mode, request.skill_id, lesson_id, clock.now.isoformat()),
    ).lastrowid
    conn.executemany(
        "INSERT INTO session_exercises (session_id, exercise_id, position) VALUES (?, ?, ?)",
        [(session_id, exercise_id, index) for index, exercise_id in enumerate(exercise_ids, start=1)],
    )

    return schemas.SessionOut(
        id=session_id,
        mode=request.mode,
        skill=(
            schemas.SessionSkillOut(
                id=skill.id, title=skill.title, theme=path.unit_of(skill).theme, crown_level=skill.crown_level
            )
            if skill is not None
            else None
        ),
        lesson_number=skill.next_lesson_index + 1 if lesson_id is not None and skill is not None else None,
        lessons_total=skill.lessons_total if lesson_id is not None and skill is not None else None,
        learning_language=learner.course_out(conn, user["course_id"]).learning_language,
        hearts=learner.hearts_out(hearts, regen),
        exercises=_exercises_out(conn, exercise_ids),
    )


# --- answer --------------------------------------------------------------------


def submit_answer(
    conn: Connection,
    user_id: int,
    session_id: int,
    submission: schemas.AnswerSubmit,
    clock: Clock,
    regen: timedelta,
) -> schemas.AnswerResultOut:
    session = _get_session(conn, user_id, session_id)
    _require_active(session)
    exercise = conn.execute(
        "SELECT e.* FROM session_exercises se JOIN exercises e ON e.id = se.exercise_id "
        "WHERE se.session_id = ? AND se.exercise_id = ?",
        (session_id, submission.exercise_id),
    ).fetchone()
    if exercise is None:
        raise AppError(404, "exercise_not_in_session", "That exercise isn't part of this session.")
    if submission.answer.type not in (exercise["type"], "skip"):
        raise AppError(422, "answer_type_mismatch", f"Expected a {exercise['type']} answer.")

    user = learner.get_user(conn, user_id)
    stored = learner.stored_hearts(user)
    hearts = heart_rules.regenerate(stored, clock.now, regen)
    uses_hearts = session["mode"] == "lesson"
    if uses_hearts and hearts.count == 0:
        raise AppError(409, "out_of_hearts", "You ran out of hearts. Refill or practice to earn more.")

    options = conn.execute(
        "SELECT * FROM exercise_options WHERE exercise_id = ? ORDER BY position", (exercise["id"],)
    ).fetchall()
    answers = conn.execute(
        "SELECT * FROM exercise_answers WHERE exercise_id = ? ORDER BY is_primary DESC, id", (exercise["id"],)
    ).fetchall()
    result = grade(exercise, options, answers, submission.answer)

    conn.execute(
        "INSERT INTO exercise_attempts (session_id, exercise_id, answer, is_correct, created_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (session_id, exercise["id"], result.submitted, int(result.correct), clock.now.isoformat()),
    )
    if uses_hearts and not result.correct:
        hearts = heart_rules.lose_one(hearts, clock.now)
    if hearts != stored:
        learner.save_hearts(conn, user_id, hearts)

    return schemas.AnswerResultOut(
        correct=result.correct,
        solution=result.solution,
        note=result.note,
        hearts=learner.hearts_out(hearts, regen),
        out_of_hearts=uses_hearts and hearts.count == 0,
    )


# --- complete ------------------------------------------------------------------


def complete_session(
    conn: Connection, user_id: int, session_id: int, clock: Clock, regen: timedelta
) -> schemas.CompletionOut:
    session = _get_session(conn, user_id, session_id)
    _require_active(session)
    if conn.execute(_UNSOLVED_QUERY, (session_id,)).fetchone()[0]:
        raise AppError(409, "session_incomplete", "Answer every exercise correctly before finishing.")

    attempts, correct = conn.execute(
        "SELECT COUNT(*), COALESCE(SUM(is_correct), 0) FROM exercise_attempts WHERE session_id = ?",
        (session_id,),
    ).fetchone()
    mistakes = attempts - correct
    accuracy = round(100 * correct / attempts) if attempts else 100

    user = learner.get_user(conn, user_id)
    path_before = load_course_path(conn, user_id, user["course_id"])

    is_lesson = session["mode"] == "lesson"
    if is_lesson:
        base_xp = conn.execute(
            "SELECT xp_reward FROM lessons WHERE id = ?", (session["lesson_id"],)
        ).fetchone()["xp_reward"]
        bonus_xp = PERFECT_LESSON_BONUS_XP if mistakes == 0 else 0
        conn.execute(
            """
            INSERT INTO lesson_progress (user_id, lesson_id, times_completed, last_completed_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT (user_id, lesson_id) DO UPDATE SET
                times_completed = times_completed + 1,
                last_completed_at = excluded.last_completed_at
            """,
            (user_id, session["lesson_id"], clock.now.isoformat()),
        )
    else:
        base_xp, bonus_xp = PRACTICE_XP, 0
    xp_earned = base_xp + bonus_xp
    path_after = load_course_path(conn, user_id, user["course_id"])

    streak = record_activity(
        user["current_streak"], user["longest_streak"], learner.parse_date(user["last_active_on"]), clock.today
    )
    conn.execute(
        "UPDATE users SET total_xp = total_xp + ?, current_streak = ?, longest_streak = ?, last_active_on = ? "
        "WHERE id = ?",
        (xp_earned, streak.current, streak.longest, streak.active_on.isoformat(), user_id),
    )

    hearts_before = learner.current_hearts(user, clock.now, regen)
    hearts_after = hearts_before if is_lesson else heart_rules.gain(hearts_before, 1)
    learner.save_hearts(conn, user_id, hearts_after)

    today_xp_before = learner.xp_on(conn, user_id, clock.today)
    conn.execute(
        """
        INSERT INTO daily_activity (user_id, activity_date, xp_earned, sessions_completed)
        VALUES (?, ?, ?, 1)
        ON CONFLICT (user_id, activity_date) DO UPDATE SET
            xp_earned = xp_earned + excluded.xp_earned,
            sessions_completed = sessions_completed + 1
        """,
        (user_id, clock.today.isoformat(), xp_earned),
    )
    today_xp = today_xp_before + xp_earned
    goal = user["daily_goal_xp"]

    conn.execute(
        "UPDATE lesson_sessions SET status = 'completed', ended_at = ?, xp_earned = ? WHERE id = ?",
        (clock.now.isoformat(), xp_earned, session_id),
    )

    metrics = achievements.compute_metrics(conn, user_id, path_after)
    new_achievements = achievements.unlock_earned(conn, user_id, metrics, clock.now)

    skill_result = None
    if session["skill_id"] is not None:
        before = _find_skill(path_before, session["skill_id"])
        after = _find_skill(path_after, session["skill_id"])
        skill_result = schemas.SkillResultOut(
            id=after.id,
            title=after.title,
            crown_level=after.crown_level,
            max_crown_level=MAX_CROWN_LEVEL,
            lessons_done=after.lessons_done,
            lessons_total=after.lessons_total,
            leveled_up=after.crown_level > before.crown_level,
        )
    newly_unlocked = next(
        (s for s in path_after.skills() if s.unlocked and not _find_skill(path_before, s.id).unlocked),
        None,
    )

    started_at = datetime.fromisoformat(session["started_at"])
    return schemas.CompletionOut(
        session_id=session_id,
        mode=session["mode"],
        xp_earned=xp_earned,
        bonus_xp=bonus_xp,
        accuracy=accuracy,
        duration_seconds=max(0, int((clock.now - started_at).total_seconds())),
        total_xp=user["total_xp"] + xp_earned,
        hearts=learner.hearts_out(hearts_after, regen),
        heart_restored=hearts_after.count > hearts_before.count,
        streak=schemas.StreakResultOut(
            count=streak.current,
            extended=streak.extended,
            week=learner.streak_week(conn, user_id, clock.today),
        ),
        daily_goal=schemas.DailyGoalResultOut(
            goal_xp=goal,
            today_xp=today_xp,
            completed=today_xp >= goal,
            just_completed=today_xp_before < goal <= today_xp,
        ),
        skill=skill_result,
        unlocked_skill=(
            schemas.UnlockedSkillOut(id=newly_unlocked.id, title=newly_unlocked.title)
            if newly_unlocked
            else None
        ),
        new_achievements=new_achievements,
    )


# --- abandon -------------------------------------------------------------------


def abandon_session(conn: Connection, user_id: int, session_id: int, clock: Clock) -> None:
    """Close a session the learner quit. Hearts already lost stay lost."""
    _get_session(conn, user_id, session_id)
    conn.execute(
        "UPDATE lesson_sessions SET status = 'abandoned', ended_at = ? WHERE id = ? AND status = 'active'",
        (clock.now.isoformat(), session_id),
    )
