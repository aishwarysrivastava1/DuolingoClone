"""Daily streak rules.

A streak survives as long as the learner earns XP on consecutive calendar
days. The stored counter is only rewritten when activity is recorded; reads
use `visible_streak` so a missed day shows as 0 without a write.
"""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class StreakUpdate:
    current: int
    longest: int
    extended: bool  # True when this activity was the first of the day


def visible_streak(stored: int, last_active_on: date | None, today: date) -> int:
    if last_active_on is None:
        return 0
    return stored if (today - last_active_on).days <= 1 else 0


def record_activity(stored: int, longest: int, last_active_on: date | None, today: date) -> StreakUpdate:
    if last_active_on == today:
        return StreakUpdate(stored, longest, extended=False)
    continues = last_active_on is not None and (today - last_active_on).days == 1
    current = stored + 1 if continues else 1
    return StreakUpdate(current, max(longest, current), extended=True)
