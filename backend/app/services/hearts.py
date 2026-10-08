"""Heart rules: lose one per mistake, regenerate one every N minutes.

Regeneration is evaluated lazily from `refill_from` (the moment the regen
timer started) instead of by a background job, so the stored row only
changes when hearts are actually spent or refilled.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.rules import MAX_HEARTS


@dataclass(frozen=True)
class Hearts:
    count: int
    refill_from: datetime | None  # None while hearts are full

    @property
    def is_full(self) -> bool:
        return self.count >= MAX_HEARTS


def regenerate(hearts: Hearts, now: datetime, interval: timedelta) -> Hearts:
    """Credit every full regen interval that elapsed since `refill_from`."""
    if hearts.is_full:
        return Hearts(MAX_HEARTS, None)
    anchor = hearts.refill_from or now
    earned = max(0, int((now - anchor) / interval))
    count = min(MAX_HEARTS, hearts.count + earned)
    if count >= MAX_HEARTS:
        return Hearts(MAX_HEARTS, None)
    return Hearts(count, anchor + earned * interval)


def lose_one(hearts: Hearts, now: datetime) -> Hearts:
    """Spend a heart; losing the first one starts the regen timer."""
    if hearts.count <= 0:
        return hearts
    return Hearts(hearts.count - 1, hearts.refill_from or now)


def gain(hearts: Hearts, amount: int) -> Hearts:
    count = min(MAX_HEARTS, hearts.count + amount)
    return Hearts(count, None if count >= MAX_HEARTS else hearts.refill_from)


def next_heart_at(hearts: Hearts, interval: timedelta) -> datetime | None:
    if hearts.is_full or hearts.refill_from is None:
        return None
    return hearts.refill_from + interval
