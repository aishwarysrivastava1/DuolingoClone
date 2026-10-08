"""The current learner: stats, settings, profile and heart refills."""

from fastapi import APIRouter

from app import schemas
from app.database import transaction
from app.dependencies import CurrentClock, Db, HeartRegen, LearnerId
from app.services import achievements, learner
from app.services.path import load_course_path

router = APIRouter(prefix="/me", tags=["learner"])


@router.get("", response_model=schemas.MeOut)
def get_me(db: Db, user_id: LearnerId, clock: CurrentClock, regen: HeartRegen) -> schemas.MeOut:
    return learner.build_me(db, user_id, clock, regen)


@router.patch("/settings", response_model=schemas.MeOut)
def update_settings(
    update: schemas.SettingsUpdate, db: Db, user_id: LearnerId, clock: CurrentClock, regen: HeartRegen
) -> schemas.MeOut:
    with transaction(db):
        learner.update_settings(db, user_id, update)
    return learner.build_me(db, user_id, clock, regen)


@router.post("/hearts/refill", response_model=schemas.MeOut)
def refill_hearts(db: Db, user_id: LearnerId, clock: CurrentClock, regen: HeartRegen) -> schemas.MeOut:
    """Spend gems to restore all hearts (the mocked in-app purchase)."""
    with transaction(db):
        learner.refill_hearts(db, user_id, clock, regen)
    return learner.build_me(db, user_id, clock, regen)


@router.get("/profile", response_model=schemas.ProfileOut)
def get_profile(db: Db, user_id: LearnerId, clock: CurrentClock, regen: HeartRegen) -> schemas.ProfileOut:
    me = learner.build_me(db, user_id, clock, regen)
    path = load_course_path(db, user_id, me.course.id)
    metrics = achievements.compute_metrics(db, user_id, path)
    skills = list(path.skills())
    return schemas.ProfileOut(
        me=me,
        stats=schemas.ProfileStatsOut(
            streak=me.streak.count,
            longest_streak=metrics["longest_streak"],
            total_xp=metrics["total_xp"],
            crowns=metrics["crowns"],
            lessons_completed=metrics["lessons_completed"],
            skills_completed=path.skills_completed,
            skills_total=len(skills),
            units_completed=sum(1 for unit in path.units if unit.completed),
            units_total=len(path.units),
        ),
        achievements=achievements.list_achievements(db, user_id, metrics),
    )
