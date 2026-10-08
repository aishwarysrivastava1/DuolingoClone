"""FastAPI dependencies: DB connection, clock, settings and current learner."""

import sqlite3
from collections.abc import Iterator
from datetime import timedelta
from typing import Annotated

from fastapi import Depends, Header, Request

from app.clock import Clock, current_clock
from app.config import Settings
from app.database import connect
from app.services.learner import find_user_id


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(settings: Annotated[Settings, Depends(get_settings)]) -> Iterator[sqlite3.Connection]:
    conn = connect(settings.database_path)
    try:
        yield conn
    finally:
        conn.close()


def get_clock(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    x_timezone: Annotated[str | None, Header()] = None,
) -> Clock:
    return current_clock(db, x_timezone)


def get_learner_id(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> int:
    """No real auth: every request acts as the seeded default learner."""
    return find_user_id(db, settings.default_username)


def get_heart_regen(settings: Annotated[Settings, Depends(get_settings)]) -> timedelta:
    return timedelta(minutes=settings.heart_regen_minutes)


Db = Annotated[sqlite3.Connection, Depends(get_db)]
CurrentClock = Annotated[Clock, Depends(get_clock)]
LearnerId = Annotated[int, Depends(get_learner_id)]
HeartRegen = Annotated[timedelta, Depends(get_heart_regen)]
