"""Pydantic request/response models — the API contract with the frontend."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

ExerciseType = Literal["multiple_choice", "translate", "match_pairs", "fill_blank", "type_answer"]
SkillState = Literal["locked", "active", "completed"]
SessionMode = Literal["lesson", "practice"]
DailyGoal = Literal[10, 20, 30, 50]


# --- Learner -----------------------------------------------------------------


class CourseOut(BaseModel):
    id: int
    code: str
    title: str
    learning_language: str
    from_language: str


class HeartsOut(BaseModel):
    count: int
    max: int
    next_heart_at: datetime | None
    regen_minutes: int
    refill_cost_gems: int


class StreakDayOut(BaseModel):
    date: date
    active: bool


class StreakOut(BaseModel):
    count: int
    longest: int
    active_today: bool
    week: list[StreakDayOut]


class DailyGoalOut(BaseModel):
    goal_xp: int
    today_xp: int
    completed: bool


class SettingsOut(BaseModel):
    sound_enabled: bool
    daily_goal_xp: int


class MeOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    joined_on: date
    today: date
    server_time: datetime  # lets the client correct countdowns for the simulated clock
    course: CourseOut
    total_xp: int
    gems: int
    hearts: HeartsOut
    streak: StreakOut
    daily_goal: DailyGoalOut
    settings: SettingsOut


class SettingsUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=30)
    daily_goal_xp: DailyGoal | None = None
    sound_enabled: bool | None = None


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    threshold: int
    progress: int
    unlocked_at: datetime | None


class ProfileStatsOut(BaseModel):
    streak: int
    longest_streak: int
    total_xp: int
    crowns: int
    lessons_completed: int
    skills_completed: int
    skills_total: int
    units_completed: int
    units_total: int


class ProfileOut(BaseModel):
    me: MeOut
    stats: ProfileStatsOut
    achievements: list[AchievementOut]


# --- Course path -------------------------------------------------------------


class SkillOut(BaseModel):
    id: int
    title: str
    icon: str
    state: SkillState
    crown_level: int
    max_crown_level: int
    lessons_done: int
    lessons_total: int


class UnitOut(BaseModel):
    id: int
    position: int
    title: str
    description: str
    theme: str
    completed: bool
    skills: list[SkillOut]


class PathOut(BaseModel):
    course: CourseOut
    units: list[UnitOut]


class GuidebookEntryOut(BaseModel):
    text: str
    translation: str


class GuidebookOut(BaseModel):
    unit_id: int
    position: int
    title: str
    description: str
    words: list[GuidebookEntryOut]
    phrases: list[GuidebookEntryOut]


# --- Sessions ----------------------------------------------------------------


class SessionCreate(BaseModel):
    mode: SessionMode
    skill_id: int | None = None

    @model_validator(mode="after")
    def lesson_needs_skill(self) -> "SessionCreate":
        if self.mode == "lesson" and self.skill_id is None:
            raise ValueError("skill_id is required for lesson sessions")
        return self


class OptionOut(BaseModel):
    id: int
    text: str
    image: str | None = None
    match_text: str | None = None


class ExerciseOut(BaseModel):
    id: int
    type: ExerciseType
    prompt: str
    source_text: str | None
    translation: str | None
    audio_text: str | None
    options: list[OptionOut]


class SessionSkillOut(BaseModel):
    id: int
    title: str
    theme: str
    crown_level: int


class SessionOut(BaseModel):
    id: int
    mode: SessionMode
    skill: SessionSkillOut | None
    lesson_number: int | None
    lessons_total: int | None
    learning_language: str
    hearts: HeartsOut
    exercises: list[ExerciseOut]


class MultipleChoiceAnswer(BaseModel):
    type: Literal["multiple_choice"]
    option_id: int


class FillBlankAnswer(BaseModel):
    type: Literal["fill_blank"]
    option_id: int


class TranslateAnswer(BaseModel):
    type: Literal["translate"]
    option_ids: list[int] = Field(min_length=1, max_length=30)


class MatchPairsAnswer(BaseModel):
    type: Literal["match_pairs"]
    pairs: list[tuple[int, int]] = Field(min_length=1, max_length=10)


class TypeAnswer(BaseModel):
    type: Literal["type_answer"]
    text: str = Field(max_length=300)


class SkipAnswer(BaseModel):
    type: Literal["skip"]


Answer = Annotated[
    MultipleChoiceAnswer | FillBlankAnswer | TranslateAnswer | MatchPairsAnswer | TypeAnswer | SkipAnswer,
    Field(discriminator="type"),
]


class AnswerSubmit(BaseModel):
    exercise_id: int
    answer: Answer


class AnswerResultOut(BaseModel):
    correct: bool
    solution: str
    note: str | None
    hearts: HeartsOut
    out_of_hearts: bool


class StreakResultOut(BaseModel):
    count: int
    extended: bool
    week: list[StreakDayOut]


class DailyGoalResultOut(DailyGoalOut):
    just_completed: bool


class SkillResultOut(BaseModel):
    id: int
    title: str
    crown_level: int
    max_crown_level: int
    lessons_done: int
    lessons_total: int
    leveled_up: bool


class UnlockedSkillOut(BaseModel):
    id: int
    title: str


class UnlockedAchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str


class CompletionOut(BaseModel):
    session_id: int
    mode: SessionMode
    xp_earned: int
    bonus_xp: int
    accuracy: int
    duration_seconds: int
    total_xp: int
    hearts: HeartsOut
    heart_restored: bool
    streak: StreakResultOut
    daily_goal: DailyGoalResultOut
    skill: SkillResultOut | None
    unlocked_skill: UnlockedSkillOut | None
    new_achievements: list[UnlockedAchievementOut]


# --- Leaderboard -------------------------------------------------------------


class LeaderboardEntryOut(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_color: str
    xp: int
    is_me: bool


class LeaderboardOut(BaseModel):
    period: Literal["week", "all"]
    league: str
    days_left: int
    promotion_cutoff: int
    entries: list[LeaderboardEntryOut]


# --- Dev tools ---------------------------------------------------------------


class ClockOut(BaseModel):
    day_offset: int
    today: date


class AdvanceDay(BaseModel):
    days: int = Field(default=1, ge=1, le=30)
