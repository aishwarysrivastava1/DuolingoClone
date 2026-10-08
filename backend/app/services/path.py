"""The learning path: units → skills, with crowns and unlock state.

Nothing here is stored. A skill's crown level, ring progress and lock state
are derived from how many times the learner finished each of its lessons:

* crown level      = min(times_completed over the skill's lessons), capped
* ring progress    = lessons already finished at the current crown level
* next lesson      = first lesson not yet finished at the current level
* unlocked         = first skill of the course, or previous skill has ≥ 1 crown
"""

import sqlite3
from collections.abc import Iterator
from dataclasses import dataclass, field

from app.rules import MAX_CROWN_LEVEL


@dataclass
class SkillProgress:
    id: int
    unit_id: int
    title: str
    icon: str
    lesson_ids: list[int] = field(default_factory=list)
    completions: list[int] = field(default_factory=list)
    unlocked: bool = False

    @property
    def crown_level(self) -> int:
        return min(min(self.completions, default=0), MAX_CROWN_LEVEL)

    @property
    def is_legendary(self) -> bool:
        return self.crown_level >= MAX_CROWN_LEVEL

    @property
    def lessons_total(self) -> int:
        return len(self.lesson_ids)

    @property
    def lessons_done(self) -> int:
        if self.is_legendary:
            return self.lessons_total
        return sum(1 for times in self.completions if times > self.crown_level)

    @property
    def next_lesson_index(self) -> int | None:
        if self.is_legendary:
            return None
        return next((i for i, times in enumerate(self.completions) if times <= self.crown_level), None)

    @property
    def next_lesson_id(self) -> int | None:
        index = self.next_lesson_index
        return None if index is None else self.lesson_ids[index]

    @property
    def state(self) -> str:
        if self.crown_level >= 1:
            return "completed"
        return "active" if self.unlocked else "locked"


@dataclass
class UnitProgress:
    id: int
    position: int
    title: str
    description: str
    theme: str
    skills: list[SkillProgress] = field(default_factory=list)

    @property
    def completed(self) -> bool:
        return all(skill.crown_level >= 1 for skill in self.skills)


@dataclass
class CoursePath:
    units: list[UnitProgress]

    def skills(self) -> Iterator[SkillProgress]:
        for unit in self.units:
            yield from unit.skills

    def find_skill(self, skill_id: int) -> SkillProgress | None:
        return next((skill for skill in self.skills() if skill.id == skill_id), None)

    def unit_of(self, skill: SkillProgress) -> UnitProgress:
        return next(unit for unit in self.units if unit.id == skill.unit_id)

    def completed_lesson_ids(self) -> list[int]:
        return [
            lesson_id
            for skill in self.skills()
            for lesson_id, times in zip(skill.lesson_ids, skill.completions)
            if times > 0
        ]

    @property
    def total_crowns(self) -> int:
        return sum(skill.crown_level for skill in self.skills())

    @property
    def skills_completed(self) -> int:
        return sum(1 for skill in self.skills() if skill.crown_level >= 1)


_PATH_QUERY = """
SELECT u.id AS unit_id, u.position AS unit_position, u.title AS unit_title,
       u.description AS unit_description, u.theme,
       s.id AS skill_id, s.title AS skill_title, s.icon,
       l.id AS lesson_id, COALESCE(lp.times_completed, 0) AS times_completed
FROM units u
JOIN skills s  ON s.unit_id = u.id
JOIN lessons l ON l.skill_id = s.id
LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = :user_id
WHERE u.course_id = :course_id
ORDER BY u.position, s.position, l.position
"""


def load_course_path(conn: sqlite3.Connection, user_id: int, course_id: int) -> CoursePath:
    units: dict[int, UnitProgress] = {}
    skills: dict[int, SkillProgress] = {}
    for row in conn.execute(_PATH_QUERY, {"user_id": user_id, "course_id": course_id}):
        unit = units.get(row["unit_id"])
        if unit is None:
            unit = units[row["unit_id"]] = UnitProgress(
                id=row["unit_id"],
                position=row["unit_position"],
                title=row["unit_title"],
                description=row["unit_description"],
                theme=row["theme"],
            )
        skill = skills.get(row["skill_id"])
        if skill is None:
            skill = skills[row["skill_id"]] = SkillProgress(
                id=row["skill_id"], unit_id=unit.id, title=row["skill_title"], icon=row["icon"]
            )
            unit.skills.append(skill)
        skill.lesson_ids.append(row["lesson_id"])
        skill.completions.append(row["times_completed"])

    previous_completed = True  # the very first skill is always open
    for skill in skills.values():
        skill.unlocked = previous_completed or skill.crown_level >= 1
        previous_completed = skill.crown_level >= 1

    return CoursePath(units=list(units.values()))
