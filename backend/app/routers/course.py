"""Course content as seen by the learner: the path and unit guidebooks."""

from fastapi import APIRouter

from app import schemas
from app.dependencies import Db, LearnerId
from app.rules import MAX_CROWN_LEVEL
from app.services import learner
from app.services.guidebook import get_guidebook
from app.services.path import load_course_path

router = APIRouter(tags=["course"])


@router.get("/path", response_model=schemas.PathOut)
def get_path(db: Db, user_id: LearnerId) -> schemas.PathOut:
    user = learner.get_user(db, user_id)
    path = load_course_path(db, user_id, user["course_id"])
    return schemas.PathOut(
        course=learner.course_out(db, user["course_id"]),
        units=[
            schemas.UnitOut(
                id=unit.id,
                position=unit.position,
                title=unit.title,
                description=unit.description,
                theme=unit.theme,
                completed=unit.completed,
                skills=[
                    schemas.SkillOut(
                        id=skill.id,
                        title=skill.title,
                        icon=skill.icon,
                        state=skill.state,
                        crown_level=skill.crown_level,
                        max_crown_level=MAX_CROWN_LEVEL,
                        lessons_done=skill.lessons_done,
                        lessons_total=skill.lessons_total,
                    )
                    for skill in unit.skills
                ],
            )
            for unit in path.units
        ],
    )


@router.get("/units/{unit_id}/guidebook", response_model=schemas.GuidebookOut)
def get_unit_guidebook(unit_id: int, db: Db, user_id: LearnerId) -> schemas.GuidebookOut:
    return get_guidebook(db, user_id, unit_id)
