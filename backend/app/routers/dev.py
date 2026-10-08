"""Demo tooling: simulate the passage of days and reset the dataset.

Enabled by default so reviewers can test streak logic; disable with
ENABLE_DEV_ROUTES=false.
"""

from typing import Annotated

from fastapi import APIRouter, Header

from app import schemas
from app.clock import current_clock, get_day_offset, set_day_offset
from app.database import transaction
from app.dependencies import CurrentClock, Db
from app.seed import seed_database

router = APIRouter(prefix="/dev", tags=["dev"])


@router.get("/clock", response_model=schemas.ClockOut)
def get_clock(db: Db, clock: CurrentClock) -> schemas.ClockOut:
    return schemas.ClockOut(day_offset=get_day_offset(db), today=clock.today)


@router.post("/advance-day", response_model=schemas.ClockOut)
def advance_day(
    body: schemas.AdvanceDay, db: Db, x_timezone: Annotated[str | None, Header()] = None
) -> schemas.ClockOut:
    with transaction(db):
        offset = get_day_offset(db) + body.days
        set_day_offset(db, offset)
    return schemas.ClockOut(day_offset=offset, today=current_clock(db, x_timezone).today)


@router.post("/reset", response_model=schemas.ClockOut)
def reset(db: Db, x_timezone: Annotated[str | None, Header()] = None) -> schemas.ClockOut:
    seed_database(db, x_timezone)
    return schemas.ClockOut(day_offset=0, today=current_clock(db, x_timezone).today)
