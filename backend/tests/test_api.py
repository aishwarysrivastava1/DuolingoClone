"""End-to-end API tests against a freshly seeded database."""

from tests.conftest import answer, correct_answer, play_perfect_session, start

SKIP = {"type": "skip"}


def test_me_returns_seeded_learner(client):
    me = client.get("/api/me").json()
    assert me["display_name"] == "Alex"
    assert me["hearts"]["count"] == 4 and me["hearts"]["next_heart_at"] is not None
    assert me["streak"] == {**me["streak"], "count": 4, "active_today": False}
    assert me["daily_goal"] == {"goal_xp": 20, "today_xp": 0, "completed": False}


def test_me_reports_the_simulated_server_time(client):
    before = client.get("/api/me").json()
    client.post("/api/dev/advance-day", json={"days": 2})
    after = client.get("/api/me").json()
    assert after["server_time"][:10] > before["server_time"][:10]
    assert after["today"] > before["today"]


def test_path_reports_completed_active_and_locked_skills(client):
    units = client.get("/api/path").json()["units"]
    skills = [skill for unit in units for skill in unit["skills"]]
    assert [s["state"] for s in skills[:4]] == ["completed", "completed", "active", "locked"]
    assert skills[0]["crown_level"] == 2
    assert (skills[2]["lessons_done"], skills[2]["lessons_total"]) == (1, 3)


def test_session_payload_hides_the_answer_key(client):
    session = start(client).json()
    assert len(session["exercises"]) == 8
    assert {e["type"] for e in session["exercises"]} == {
        "multiple_choice", "translate", "match_pairs", "fill_blank", "type_answer"
    }
    for exercise in session["exercises"]:
        for option in exercise["options"]:
            assert "is_correct" not in option


def test_locked_skill_cannot_be_started(client):
    response = start(client, skill_id=4)
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "skill_locked"


def test_perfect_lesson_awards_bonus_xp_streak_and_progress(client, db):
    summary = play_perfect_session(client, db, start(client).json())
    assert (summary["xp_earned"], summary["bonus_xp"], summary["accuracy"]) == (15, 5, 100)
    assert summary["streak"] == {**summary["streak"], "count": 5, "extended": True}
    assert summary["daily_goal"]["today_xp"] == 15 and not summary["daily_goal"]["completed"]
    assert (summary["skill"]["lessons_done"], summary["skill"]["leveled_up"]) == (2, False)

    me = client.get("/api/me").json()
    assert me["total_xp"] == 135 + 15 and me["streak"]["active_today"]


def test_wrong_answer_costs_a_heart_and_must_be_corrected(client, db):
    session = start(client).json()
    first = session["exercises"][0]
    result = answer(client, session["id"], first["id"], SKIP).json()
    assert not result["correct"] and result["solution"]
    assert result["hearts"]["count"] == 3

    for exercise in session["exercises"][1:]:
        answer(client, session["id"], exercise["id"], correct_answer(db, exercise))
    incomplete = client.post(f"/api/sessions/{session['id']}/complete")
    assert incomplete.status_code == 409
    assert incomplete.json()["error"]["code"] == "session_incomplete"

    answer(client, session["id"], first["id"], correct_answer(db, first))
    summary = client.post(f"/api/sessions/{session['id']}/complete").json()
    assert (summary["xp_earned"], summary["bonus_xp"], summary["accuracy"]) == (10, 0, 89)


def test_running_out_of_hearts_blocks_play_until_refill(client, db):
    session = start(client).json()
    exercise = session["exercises"][0]
    for expected in (3, 2, 1, 0):
        result = answer(client, session["id"], exercise["id"], SKIP).json()
        assert result["hearts"]["count"] == expected
    assert result["out_of_hearts"]

    blocked = answer(client, session["id"], exercise["id"], correct_answer(db, exercise))
    assert blocked.json()["error"]["code"] == "out_of_hearts"
    assert start(client).json()["error"]["code"] == "out_of_hearts"

    me = client.post("/api/me/hearts/refill").json()
    assert me["hearts"]["count"] == 5 and me["gems"] == 1000 - 350
    assert client.post("/api/me/hearts/refill").json()["error"]["code"] == "hearts_full"
    # The same session continues after a refill.
    assert answer(client, session["id"], exercise["id"], correct_answer(db, exercise)).json()["correct"]


def test_practice_works_without_hearts_and_restores_one(client, db):
    session = start(client).json()
    for _ in range(4):
        answer(client, session["id"], session["exercises"][0]["id"], SKIP)
    practice = start(client, mode="practice", skill_id=None)
    assert practice.status_code == 201
    practice = practice.json()
    assert practice["mode"] == "practice" and len(practice["exercises"]) == 8

    wrong = answer(client, practice["id"], practice["exercises"][0]["id"], SKIP).json()
    assert wrong["hearts"]["count"] == 0  # mistakes are free in practice
    summary = play_perfect_session(client, db, practice)
    assert summary["heart_restored"] and summary["hearts"]["count"] == 1
    assert summary["xp_earned"] == 5


def test_finishing_a_skill_awards_a_crown_and_unlocks_the_next(client, db):
    play_perfect_session(client, db, start(client).json())
    summary = play_perfect_session(client, db, start(client).json())
    assert summary["skill"]["leveled_up"] and summary["skill"]["crown_level"] == 1
    assert summary["unlocked_skill"] == {"id": 4, "title": "Family"}

    skills = [s for unit in client.get("/api/path").json()["units"] for s in unit["skills"]]
    assert skills[2]["state"] == "completed" and skills[3]["state"] == "active"
    assert client.get("/api/path").json()["units"][0]["completed"]


def test_session_cannot_be_completed_twice(client, db):
    session = start(client).json()
    play_perfect_session(client, db, session)
    again = client.post(f"/api/sessions/{session['id']}/complete")
    assert again.status_code == 409 and again.json()["error"]["code"] == "session_closed"


def test_starting_a_new_session_abandons_the_previous_one(client, db):
    first = start(client).json()
    start(client)
    response = answer(client, first["id"], first["exercises"][0]["id"], SKIP)
    assert response.json()["error"]["code"] == "session_closed"


def test_answer_type_must_match_exercise(client):
    session = start(client).json()
    exercise = next(e for e in session["exercises"] if e["type"] == "match_pairs")
    response = answer(client, session["id"], exercise["id"], {"type": "type_answer", "text": "hola"})
    assert response.status_code == 422


def test_streak_rules_over_simulated_days(client, db):
    play_perfect_session(client, db, start(client).json())
    assert client.get("/api/me").json()["streak"]["count"] == 5

    client.post("/api/dev/advance-day", json={"days": 1})
    me = client.get("/api/me").json()
    assert (me["streak"]["count"], me["streak"]["active_today"]) == (5, False)
    assert me["hearts"]["count"] == 5  # a day is plenty to regenerate
    assert me["daily_goal"]["today_xp"] == 0

    assert play_perfect_session(client, db, start(client).json())["streak"]["count"] == 6

    client.post("/api/dev/advance-day", json={"days": 2})
    assert client.get("/api/me").json()["streak"]["count"] == 0
    summary = play_perfect_session(client, db, start(client, skill_id=4).json())
    assert summary["streak"]["count"] == 1
    assert client.get("/api/me").json()["streak"]["longest"] == 6


def test_daily_goal_completion_is_reported_once(client, db):
    client.patch("/api/me/settings", json={"daily_goal_xp": 10})
    first = play_perfect_session(client, db, start(client).json())
    assert first["daily_goal"]["completed"] and first["daily_goal"]["just_completed"]
    second = play_perfect_session(client, db, start(client).json())
    assert second["daily_goal"]["completed"] and not second["daily_goal"]["just_completed"]


def test_achievements_unlock_from_lesson_metrics(client, db):
    profile = client.get("/api/me/profile").json()
    unlocked = {a["code"] for a in profile["achievements"] if a["unlocked_at"]}
    assert unlocked == {"first_steps", "wildfire", "sage"}

    for _ in range(2):
        play_perfect_session(client, db, start(client).json())
    summary = play_perfect_session(client, db, start(client, skill_id=4).json())
    assert "sharpshooter" in {a["code"] for a in summary["new_achievements"]}


def test_profile_stats(client):
    stats = client.get("/api/me/profile").json()["stats"]
    assert stats == {
        **stats,
        "total_xp": 135,
        "crowns": 3,
        "lessons_completed": 10,
        "skills_completed": 2,
        "skills_total": 9,
        "units_total": 3,
    }


def test_settings_validation_and_update(client):
    assert client.patch("/api/me/settings", json={"daily_goal_xp": 15}).status_code == 422
    assert client.patch("/api/me/settings", json={"display_name": "   "}).status_code == 422
    me = client.patch("/api/me/settings", json={"display_name": "Sam", "sound_enabled": False}).json()
    assert me["display_name"] == "Sam" and me["settings"]["sound_enabled"] is False


def test_leaderboard_ranks_learners(client, db):
    weekly = client.get("/api/leaderboard").json()
    assert weekly["period"] == "week" and len(weekly["entries"]) == 13
    xps = [entry["xp"] for entry in weekly["entries"]]
    assert xps == sorted(xps, reverse=True)
    all_time = client.get("/api/leaderboard?period=all").json()
    me_before = next(e for e in all_time["entries"] if e["is_me"])

    play_perfect_session(client, db, start(client).json())
    me_after = next(e for e in client.get("/api/leaderboard?period=all").json()["entries"] if e["is_me"])
    assert me_after["xp"] == me_before["xp"] + 15


def test_guidebook_lists_unit_vocabulary(client):
    guidebook = client.get("/api/units/1/guidebook").json()
    assert {"text": "hola", "translation": "hello"} in guidebook["words"]
    assert {"text": "Yo bebo agua.", "translation": "I drink water."} in guidebook["phrases"]
    assert client.get("/api/units/99/guidebook").status_code == 404


def test_reset_restores_the_seed(client, db):
    play_perfect_session(client, db, start(client).json())
    client.post("/api/dev/advance-day", json={"days": 3})
    assert client.post("/api/dev/reset").json()["day_offset"] == 0
    me = client.get("/api/me").json()
    assert (me["total_xp"], me["streak"]["count"]) == (135, 4)


def test_cors_allows_the_frontend_origin(client):
    response = client.options(
        "/api/me",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "x-timezone",
        },
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
