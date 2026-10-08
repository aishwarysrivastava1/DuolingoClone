from typing import Literal

from fastapi import APIRouter

from app import schemas
from app.dependencies import CurrentClock, Db, LearnerId
from app.services.leaderboard import get_leaderboard

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=schemas.LeaderboardOut)
def leaderboard(
    db: Db, user_id: LearnerId, clock: CurrentClock, period: Literal["week", "all"] = "week"
) -> schemas.LeaderboardOut:
    return get_leaderboard(db, user_id, period, clock.today)
