"""Deterministically expands a skill's material into lessons.

Every lesson contains all five exercise types, ordered the way Duolingo
ramps difficulty: recognise words → match them → translate with a word
bank → fill a blank → pick a meaning → build and finally type a sentence.
"""

import re
from dataclasses import dataclass

from app.seed.content import Blank, Sentence, SkillContent, Word


@dataclass(frozen=True)
class OptionSpec:
    text: str
    match_text: str | None = None
    image: str | None = None
    is_correct: bool = False


@dataclass(frozen=True)
class ExerciseSpec:
    type: str
    prompt: str
    source_text: str | None = None
    translation: str | None = None
    audio_text: str | None = None
    options: tuple[OptionSpec, ...] = ()
    answers: tuple[str, ...] = ()  # first entry is the primary (displayed) answer


# Which slice of the skill material each lesson uses:
# (picture-choice word indexes, matching-pair word indexes, sentence A, sentence B)
LESSON_PLAN = (
    ((0, 1), (0, 1, 2, 3, 4), 0, 1),
    ((2, 3), (1, 2, 3, 4, 5), 2, 3),
    ((4, 5), (0, 2, 3, 4, 5), 4, 5),
)

_TOKEN = re.compile(r"[\w']+")
DISTRACTOR_TILES = 3


def tokenize(sentence: str) -> list[str]:
    return _TOKEN.findall(sentence)


def _distractor_tiles(answer: str, others: list[str]) -> list[str]:
    taken = {token.casefold() for token in tokenize(answer)}
    tiles: list[str] = []
    for other in others:
        for token in tokenize(other):
            if token.casefold() not in taken:
                taken.add(token.casefold())
                tiles.append(token)
            if len(tiles) == DISTRACTOR_TILES:
                return tiles
    return tiles


def _rotated(items: tuple, start: int) -> list:
    return list(items[start:] + items[:start])


def picture_choice(words: tuple[Word, ...], target: int) -> ExerciseSpec:
    choices = _rotated(words, target)[:3]
    return ExerciseSpec(
        type="multiple_choice",
        prompt=f"Which one of these is “{words[target].en}”?",
        options=tuple(
            OptionSpec(text=word.es, image=word.emoji, is_correct=word == words[target]) for word in choices
        ),
    )


def meaning_choice(sentences: tuple[Sentence, ...], target: int) -> ExerciseSpec:
    choices = _rotated(sentences, target)[:3]
    sentence = sentences[target]
    return ExerciseSpec(
        type="multiple_choice",
        prompt="Select the correct meaning",
        source_text=sentence.es,
        audio_text=sentence.es,
        options=tuple(OptionSpec(text=s.en, is_correct=s == sentence) for s in choices),
    )


def match_pairs(words: list[Word]) -> ExerciseSpec:
    return ExerciseSpec(
        type="match_pairs",
        prompt="Tap the matching pairs",
        options=tuple(OptionSpec(text=word.es, match_text=word.en) for word in words),
    )


def translate_to_english(sentences: tuple[Sentence, ...], target: int) -> ExerciseSpec:
    sentence = sentences[target]
    others = [s.en for s in _rotated(sentences, target)[1:]]
    tiles = tokenize(sentence.en) + _distractor_tiles(sentence.en, others)
    return ExerciseSpec(
        type="translate",
        prompt="Write this in English",
        source_text=sentence.es,
        audio_text=sentence.es,
        options=tuple(OptionSpec(text=tile) for tile in tiles),
        answers=(sentence.en, *sentence.en_alternatives),
    )


def translate_to_spanish(sentences: tuple[Sentence, ...], target: int) -> ExerciseSpec:
    sentence = sentences[target]
    others = [s.es for s in _rotated(sentences, target)[1:]]
    tiles = tokenize(sentence.es) + _distractor_tiles(sentence.es, others)
    return ExerciseSpec(
        type="translate",
        prompt="Write this in Spanish",
        source_text=sentence.en,
        options=tuple(OptionSpec(text=tile) for tile in tiles),
        answers=(sentence.es, *sentence.es_alternatives),
    )


def fill_blank(blank: Blank) -> ExerciseSpec:
    return ExerciseSpec(
        type="fill_blank",
        prompt="Fill in the blank",
        source_text=blank.es,
        translation=blank.en,
        options=(
            OptionSpec(text=blank.answer, is_correct=True),
            *(OptionSpec(text=word) for word in blank.distractors),
        ),
    )


def type_in_spanish(sentence: Sentence) -> ExerciseSpec:
    return ExerciseSpec(
        type="type_answer",
        prompt="Type this in Spanish",
        source_text=sentence.en,
        answers=(sentence.es, *sentence.es_alternatives),
    )


def build_lessons(skill: SkillContent) -> list[list[ExerciseSpec]]:
    lessons = []
    for index, (picture_targets, pair_words, sentence_a, sentence_b) in enumerate(LESSON_PLAN):
        lessons.append(
            [
                picture_choice(skill.words, picture_targets[0]),
                picture_choice(skill.words, picture_targets[1]),
                match_pairs([skill.words[i] for i in pair_words]),
                translate_to_english(skill.sentences, sentence_a),
                fill_blank(skill.blanks[index]),
                meaning_choice(skill.sentences, sentence_b),
                translate_to_spanish(skill.sentences, sentence_b),
                type_in_spanish(skill.sentences[sentence_a]),
            ]
        )
    return lessons
