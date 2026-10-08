"""Lesson / practice sessions — the lesson player's API."""

from fastapi import APIRouter, Response, status

from app import schemas
from app.database import transaction
from app.dependencies import CurrentClock, Db, HeartRegen, LearnerId
from app.services import sessions

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=schemas.SessionOut, status_code=status.HTTP_201_CREATED)
def start_session(
    request: schemas.SessionCreate, db: Db, user_id: LearnerId, clock: CurrentClock, regen: HeartRegen
) -> schemas.SessionOut:
    with transaction(db):
        return sessions.start_session(db, user_id, request, clock, regen)


@router.post("/{session_id}/answers", response_model=schemas.AnswerResultOut)
def submit_answer(
    session_id: int,
    submission: schemas.AnswerSubmit,
    db: Db,
    user_id: LearnerId,
    clock: CurrentClock,
    regen: HeartRegen,
) -> schemas.AnswerResultOut:
    with transaction(db):
        return sessions.submit_answer(db, user_id, session_id, submission, clock, regen)


@router.post("/{session_id}/complete", response_model=schemas.CompletionOut)
def complete_session(
    session_id: int, db: Db, user_id: LearnerId, clock: CurrentClock, regen: HeartRegen
) -> schemas.CompletionOut:
    with transaction(db):
        return sessions.complete_session(db, user_id, session_id, clock, regen)


@router.post("/{session_id}/abandon", status_code=status.HTTP_204_NO_CONTENT)
def abandon_session(session_id: int, db: Db, user_id: LearnerId, clock: CurrentClock) -> Response:
    with transaction(db):
        sessions.abandon_session(db, user_id, session_id, clock)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
