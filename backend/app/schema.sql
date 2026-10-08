-- =====================================================================
-- Duolingo clone — SQLite schema
--
-- Two halves:
--   1. Course content   courses → units → skills → lessons → exercises
--                        (+ exercise_options, exercise_answers)
--   2. Learner state     users, lesson_progress, lesson_sessions,
--                        session_exercises, exercise_attempts,
--                        daily_activity, achievements, user_achievements
--
-- Foreign keys are enforced per connection (PRAGMA foreign_keys = ON).
-- Timestamps are ISO-8601 UTC strings; *_on / *_date columns are
-- learner-local ISO dates (YYYY-MM-DD).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Course content
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS courses (
    id                INTEGER PRIMARY KEY,
    code              TEXT    NOT NULL UNIQUE,      -- e.g. 'es-en'
    title             TEXT    NOT NULL,             -- e.g. 'Spanish'
    learning_language TEXT    NOT NULL,             -- BCP-47 code, drives TTS + flag
    from_language     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
    id          INTEGER PRIMARY KEY,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL CHECK (position > 0),
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    theme       TEXT    NOT NULL CHECK (theme IN ('green', 'purple', 'blue', 'red', 'orange')),
    UNIQUE (course_id, position)
);

CREATE TABLE IF NOT EXISTS skills (
    id       INTEGER PRIMARY KEY,
    unit_id  INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position > 0),
    title    TEXT    NOT NULL,
    icon     TEXT    NOT NULL,                       -- emoji
    UNIQUE (unit_id, position)
);

CREATE TABLE IF NOT EXISTS lessons (
    id        INTEGER PRIMARY KEY,
    skill_id  INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    position  INTEGER NOT NULL CHECK (position > 0),
    xp_reward INTEGER NOT NULL DEFAULT 10 CHECK (xp_reward > 0),
    UNIQUE (skill_id, position)
);

CREATE TABLE IF NOT EXISTS exercises (
    id          INTEGER PRIMARY KEY,
    lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL CHECK (position > 0),
    type        TEXT    NOT NULL CHECK (type IN (
                    'multiple_choice', 'translate', 'match_pairs', 'fill_blank', 'type_answer')),
    prompt      TEXT    NOT NULL,                    -- instruction, e.g. 'Write this in English'
    source_text TEXT,                                -- sentence to translate / sentence with '___'
    translation TEXT,                                -- meaning shown under a fill-in-the-blank
    audio_text  TEXT,                                -- learning-language text read aloud (TTS)
    UNIQUE (lesson_id, position)
);

-- One row per choice card, word-bank tile or matching pair.
CREATE TABLE IF NOT EXISTS exercise_options (
    id          INTEGER PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL CHECK (position > 0),
    text        TEXT    NOT NULL,                    -- card / tile text, or left side of a pair
    match_text  TEXT,                                -- right side of a pair (match_pairs only)
    image       TEXT,                                -- emoji illustration for picture cards
    is_correct  INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
    UNIQUE (exercise_id, position)
);

-- At most one correct choice per exercise (multiple_choice / fill_blank).
CREATE UNIQUE INDEX IF NOT EXISTS ux_exercise_options_correct
    ON exercise_options (exercise_id) WHERE is_correct = 1;

-- Accepted free-text answers for translate / type_answer exercises.
CREATE TABLE IF NOT EXISTS exercise_answers (
    id          INTEGER PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    is_primary  INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),  -- shown as the correction
    UNIQUE (exercise_id, text)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_exercise_answers_primary
    ON exercise_answers (exercise_id) WHERE is_primary = 1;

-- ---------------------------------------------------------------------
-- Learner state
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id                 INTEGER PRIMARY KEY,
    username           TEXT    NOT NULL UNIQUE,
    display_name       TEXT    NOT NULL,
    avatar_color       TEXT    NOT NULL,
    course_id          INTEGER NOT NULL REFERENCES courses(id),
    joined_on          TEXT    NOT NULL,
    total_xp           INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    gems               INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
    hearts             INTEGER NOT NULL DEFAULT 5 CHECK (hearts BETWEEN 0 AND 5),
    hearts_refill_from TEXT,                         -- regen timer anchor; NULL while hearts are full
    current_streak     INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak     INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= current_streak),
    last_active_on     TEXT,                         -- date of the last XP-earning session
    daily_goal_xp      INTEGER NOT NULL DEFAULT 20 CHECK (daily_goal_xp IN (10, 20, 30, 50)),
    sound_enabled      INTEGER NOT NULL DEFAULT 1 CHECK (sound_enabled IN (0, 1))
);

CREATE INDEX IF NOT EXISTS ix_users_course_xp ON users (course_id, total_xp DESC);

-- How many times each lesson was finished. Skill crowns, ring progress and
-- unlocking are all derived from this table (see services/path.py).
CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id         INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    times_completed   INTEGER NOT NULL DEFAULT 0 CHECK (times_completed >= 0),
    last_completed_at TEXT,
    PRIMARY KEY (user_id, lesson_id)
);

-- One play-through of a lesson (or a practice round).
CREATE TABLE IF NOT EXISTS lesson_sessions (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode       TEXT    NOT NULL CHECK (mode IN ('lesson', 'practice')),
    skill_id   INTEGER REFERENCES skills(id) ON DELETE CASCADE,   -- NULL = whole-course practice
    lesson_id  INTEGER REFERENCES lessons(id) ON DELETE CASCADE,  -- set only for mode = 'lesson'
    status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TEXT    NOT NULL,
    ended_at   TEXT,
    xp_earned  INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    CHECK ((mode = 'lesson') = (lesson_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS ix_lesson_sessions_user_status ON lesson_sessions (user_id, status);

-- The exercises dealt into a session, in play order.
CREATE TABLE IF NOT EXISTS session_exercises (
    session_id  INTEGER NOT NULL REFERENCES lesson_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL CHECK (position > 0),
    PRIMARY KEY (session_id, exercise_id),
    UNIQUE (session_id, position)
);

-- Every graded answer. The composite FK guarantees an attempt can only be
-- recorded for an exercise that belongs to the session.
CREATE TABLE IF NOT EXISTS exercise_attempts (
    id          INTEGER PRIMARY KEY,
    session_id  INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    answer      TEXT    NOT NULL,                    -- learner answer as display text ('' if skipped)
    is_correct  INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    created_at  TEXT    NOT NULL,
    FOREIGN KEY (session_id, exercise_id)
        REFERENCES session_exercises (session_id, exercise_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_exercise_attempts_session ON exercise_attempts (session_id, exercise_id);

-- Per-day XP ledger: daily goal, streak calendar and weekly leaderboard.
CREATE TABLE IF NOT EXISTS daily_activity (
    user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date      TEXT    NOT NULL,
    xp_earned          INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    sessions_completed INTEGER NOT NULL DEFAULT 0 CHECK (sessions_completed >= 0),
    PRIMARY KEY (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS ix_daily_activity_date ON daily_activity (activity_date);

CREATE TABLE IF NOT EXISTS achievements (
    id          INTEGER PRIMARY KEY,
    code        TEXT    NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    icon        TEXT    NOT NULL,                    -- emoji
    metric      TEXT    NOT NULL CHECK (metric IN (
                    'total_xp', 'longest_streak', 'lessons_completed', 'perfect_lessons', 'crowns')),
    threshold   INTEGER NOT NULL CHECK (threshold > 0),
    position    INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at    TEXT    NOT NULL,
    PRIMARY KEY (user_id, achievement_id)
);

-- Small key/value store for app-wide state (e.g. the simulated day offset).
CREATE TABLE IF NOT EXISTS app_state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
