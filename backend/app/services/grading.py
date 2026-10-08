"""Answer checking for every exercise type.

Free-text answers are compared after normalisation (case, punctuation and
whitespace are ignored). Typed answers that only differ by accents are
accepted with a gentle note, the way Duolingo flags typos.
"""

import re
import unicodedata
from dataclasses import dataclass

from app import schemas
from app.database import Row

_PUNCTUATION = re.compile(r"[.,!?¿¡;:\"“”«»()\-]")
_APOSTROPHES = re.compile(r"['’`]")
_WHITESPACE = re.compile(r"\s+")


@dataclass(frozen=True)
class Grade:
    correct: bool
    solution: str  # the correction shown in the feedback bar
    submitted: str  # the learner's answer as display text
    note: str | None = None


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFC", text).casefold()
    text = _APOSTROPHES.sub("", text)
    text = _PUNCTUATION.sub(" ", text)
    return _WHITESPACE.sub(" ", text).strip()


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def solution_for(exercise: Row, options: list[Row], answers: list[Row]) -> str:
    kind = exercise["type"]
    if kind == "multiple_choice":
        return next(o["text"] for o in options if o["is_correct"])
    if kind == "fill_blank":
        correct = next(o["text"] for o in options if o["is_correct"])
        return exercise["source_text"].replace("___", correct)
    if kind == "match_pairs":
        return ", ".join(f"{o['text']} = {o['match_text']}" for o in options)
    primary = next((a for a in answers if a["is_primary"]), answers[0])
    return primary["text"]


def grade(exercise: Row, options: list[Row], answers: list[Row], answer: schemas.Answer) -> Grade:
    solution = solution_for(exercise, options, answers)
    by_id = {o["id"]: o for o in options}

    if isinstance(answer, schemas.SkipAnswer):
        return Grade(False, solution, submitted="")

    if isinstance(answer, (schemas.MultipleChoiceAnswer, schemas.FillBlankAnswer)):
        chosen = by_id.get(answer.option_id)
        return Grade(bool(chosen and chosen["is_correct"]), solution, chosen["text"] if chosen else "")

    if isinstance(answer, schemas.TranslateAnswer):
        if any(option_id not in by_id for option_id in answer.option_ids) or len(
            set(answer.option_ids)
        ) != len(answer.option_ids):
            return Grade(False, solution, submitted="")
        submitted = " ".join(by_id[option_id]["text"] for option_id in answer.option_ids)
        accepted = {normalize(a["text"]) for a in answers}
        return Grade(normalize(submitted) in accepted, solution, submitted)

    if isinstance(answer, schemas.TypeAnswer):
        submitted = answer.text.strip()
        typed = normalize(submitted)
        accepted_texts = [normalize(a["text"]) for a in answers]
        if typed in accepted_texts:
            return Grade(True, solution, submitted)
        if typed and strip_accents(typed) in {strip_accents(text) for text in accepted_texts}:
            return Grade(True, solution, submitted, note="Pay attention to the accents.")
        return Grade(False, solution, submitted)

    if isinstance(answer, schemas.MatchPairsAnswer):
        expected = {(o["id"], o["id"]) for o in options}
        matched = {tuple(pair) for pair in answer.pairs}
        submitted = ", ".join(
            f"{by_id[left]['text']} = {by_id[right]['match_text']}"
            for left, right in answer.pairs
            if left in by_id and right in by_id
        )
        return Grade(matched == expected and len(answer.pairs) == len(expected), solution, submitted)

    raise ValueError(f"Unsupported answer type: {answer!r}")
