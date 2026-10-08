"""Unit tests for the pure gamification rules."""

from datetime import UTC, date, datetime, timedelta

from app import schemas
from app.services import hearts
from app.services.grading import grade, normalize
from app.services.streaks import record_activity, visible_streak

NOW = datetime(2026, 1, 10, 12, 0, tzinfo=UTC)
REGEN = timedelta(minutes=30)


class TestHearts:
    def test_full_hearts_have_no_timer(self):
        assert hearts.regenerate(hearts.Hearts(5, None), NOW, REGEN) == hearts.Hearts(5, None)

    def test_losing_first_heart_starts_timer(self):
        assert hearts.lose_one(hearts.Hearts(5, None), NOW) == hearts.Hearts(4, NOW)

    def test_losing_more_keeps_original_timer(self):
        started = NOW - timedelta(minutes=10)
        assert hearts.lose_one(hearts.Hearts(4, started), NOW) == hearts.Hearts(3, started)

    def test_regenerates_one_heart_per_interval_and_keeps_remainder(self):
        state = hearts.Hearts(2, NOW - timedelta(minutes=70))
        assert hearts.regenerate(state, NOW, REGEN) == hearts.Hearts(4, NOW - timedelta(minutes=10))

    def test_regeneration_caps_at_max_and_clears_timer(self):
        state = hearts.Hearts(1, NOW - timedelta(days=1))
        assert hearts.regenerate(state, NOW, REGEN) == hearts.Hearts(5, None)

    def test_next_heart_at(self):
        assert hearts.next_heart_at(hearts.Hearts(3, NOW), REGEN) == NOW + REGEN
        assert hearts.next_heart_at(hearts.Hearts(5, None), REGEN) is None

    def test_cannot_go_below_zero(self):
        assert hearts.lose_one(hearts.Hearts(0, NOW), NOW).count == 0


class TestStreaks:
    today = date(2026, 1, 10)

    def test_first_activity_starts_streak(self):
        update = record_activity(0, 0, None, self.today)
        assert (update.current, update.longest, update.extended) == (1, 1, True)

    def test_consecutive_day_extends(self):
        update = record_activity(4, 6, self.today - timedelta(days=1), self.today)
        assert (update.current, update.longest, update.extended) == (5, 6, True)

    def test_same_day_does_not_extend_twice(self):
        update = record_activity(5, 6, self.today, self.today)
        assert (update.current, update.extended) == (5, False)

    def test_missed_day_resets_to_one(self):
        update = record_activity(9, 9, self.today - timedelta(days=2), self.today)
        assert (update.current, update.longest) == (1, 9)

    def test_longest_tracks_new_record(self):
        assert record_activity(6, 6, self.today - timedelta(days=1), self.today).longest == 7

    def test_visible_streak_survives_until_end_of_next_day(self):
        assert visible_streak(4, self.today - timedelta(days=1), self.today) == 4
        assert visible_streak(4, self.today - timedelta(days=2), self.today) == 0
        assert visible_streak(0, None, self.today) == 0


class TestGrading:
    def exercise(self, kind, source=None):
        return {"type": kind, "source_text": source}

    def test_normalize_ignores_case_punctuation_and_spacing(self):
        assert normalize("  ¿Dónde   está el hospital? ") == "dónde está el hospital"
        assert normalize("I'm home.") == "im home"

    def test_type_answer_accepts_alternatives(self):
        answers = [{"text": "Yo bebo agua.", "is_primary": 1}, {"text": "Bebo agua.", "is_primary": 0}]
        result = grade(self.exercise("type_answer"), [], answers, schemas.TypeAnswer(type="type_answer", text="bebo agua"))
        assert result.correct and result.note is None and result.solution == "Yo bebo agua."

    def test_type_answer_tolerates_missing_accents_with_note(self):
        answers = [{"text": "Gracias, adiós.", "is_primary": 1}]
        result = grade(self.exercise("type_answer"), [], answers, schemas.TypeAnswer(type="type_answer", text="gracias adios"))
        assert result.correct and result.note

    def test_type_answer_rejects_wrong_text(self):
        answers = [{"text": "Hola, Ana.", "is_primary": 1}]
        result = grade(self.exercise("type_answer"), [], answers, schemas.TypeAnswer(type="type_answer", text="Adiós"))
        assert not result.correct

    def test_translate_checks_tile_order(self):
        options = [
            {"id": 1, "text": "I", "is_correct": 0},
            {"id": 2, "text": "drink", "is_correct": 0},
            {"id": 3, "text": "water", "is_correct": 0},
        ]
        answers = [{"text": "I drink water.", "is_primary": 1}]
        good = schemas.TranslateAnswer(type="translate", option_ids=[1, 2, 3])
        bad = schemas.TranslateAnswer(type="translate", option_ids=[3, 2, 1])
        dupes = schemas.TranslateAnswer(type="translate", option_ids=[1, 1, 3])
        assert grade(self.exercise("translate"), options, answers, good).correct
        assert not grade(self.exercise("translate"), options, answers, bad).correct
        assert not grade(self.exercise("translate"), options, answers, dupes).correct

    def test_fill_blank_solution_fills_the_gap(self):
        options = [{"id": 1, "text": "bebo", "is_correct": 1}, {"id": 2, "text": "come", "is_correct": 0}]
        result = grade(
            self.exercise("fill_blank", "Yo ___ agua."), options, [], schemas.FillBlankAnswer(type="fill_blank", option_id=2)
        )
        assert not result.correct and result.solution == "Yo bebo agua."

    def test_match_pairs_requires_every_pair(self):
        options = [
            {"id": 1, "text": "hola", "match_text": "hello"},
            {"id": 2, "text": "sí", "match_text": "yes"},
        ]
        full = schemas.MatchPairsAnswer(type="match_pairs", pairs=[(1, 1), (2, 2)])
        partial = schemas.MatchPairsAnswer(type="match_pairs", pairs=[(1, 1)])
        crossed = schemas.MatchPairsAnswer(type="match_pairs", pairs=[(1, 2), (2, 1)])
        assert grade(self.exercise("match_pairs"), options, [], full).correct
        assert not grade(self.exercise("match_pairs"), options, [], partial).correct
        assert not grade(self.exercise("match_pairs"), options, [], crossed).correct

    def test_skip_is_wrong_and_reveals_solution(self):
        options = [{"id": 1, "text": "el café", "is_correct": 1}]
        result = grade(self.exercise("multiple_choice"), options, [], schemas.SkipAnswer(type="skip"))
        assert not result.correct and result.solution == "el café"
