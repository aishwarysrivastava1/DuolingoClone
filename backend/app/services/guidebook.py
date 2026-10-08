"""Unit guidebook: key words and phrases taught in a unit."""


from app import schemas
from app.database import Connection
from app.errors import AppError

_WORDS_QUERY = """
SELECT o.text, o.match_text AS translation
FROM exercise_options o
JOIN exercises e ON e.id = o.exercise_id
JOIN lessons l   ON l.id = e.lesson_id
JOIN skills s    ON s.id = l.skill_id
WHERE s.unit_id = ? AND e.type = 'match_pairs'
GROUP BY o.text, o.match_text
ORDER BY MIN(s.position), MIN(o.id)
"""

# Learning-language sentences are the ones with audio (es → en exercises).
_PHRASES_QUERY = """
SELECT e.source_text AS text, a.text AS translation
FROM exercises e
JOIN exercise_answers a ON a.exercise_id = e.id AND a.is_primary = 1
JOIN lessons l ON l.id = e.lesson_id
JOIN skills s  ON s.id = l.skill_id
WHERE s.unit_id = ? AND e.type = 'translate' AND e.audio_text IS NOT NULL
GROUP BY e.source_text, a.text
ORDER BY MIN(s.position), MIN(l.position)
"""


def get_guidebook(conn: Connection, user_id: int, unit_id: int) -> schemas.GuidebookOut:
    unit = conn.execute(
        "SELECT un.* FROM units un JOIN users u ON u.course_id = un.course_id WHERE un.id = ? AND u.id = ?",
        (unit_id, user_id),
    ).fetchone()
    if unit is None:
        raise AppError(404, "unit_not_found", "Unit not found.")
    return schemas.GuidebookOut(
        unit_id=unit["id"],
        position=unit["position"],
        title=unit["title"],
        description=unit["description"],
        words=[schemas.GuidebookEntryOut(**dict(row)) for row in conn.execute(_WORDS_QUERY, (unit_id,))],
        phrases=[schemas.GuidebookEntryOut(**dict(row)) for row in conn.execute(_PHRASES_QUERY, (unit_id,))],
    )
