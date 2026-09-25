from fastapi.testclient import TestClient


def start_match(client: TestClient, headers: dict[str, str]) -> int:
    response = client.post("/matches", json={}, headers=headers)
    assert response.status_code == 201
    return response.json()["id"]


def test_new_player_starts_at_level_one(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/matches", json={}, headers=auth_headers)

    assert response.json()["level"] == {
        "number": 1,
        "board_size": 7,
        "tick_ms": 400,
        "min_score_to_advance": 30,
    }
    assert response.json()["duration_seconds"] == 120


def test_locked_level(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/matches", json={"level": 4}, headers=auth_headers)

    assert response.status_code == 422


def test_question_does_not_expose_answer(client: TestClient, auth_headers: dict[str, str]) -> None:
    match_id = start_match(client, auth_headers)

    question = client.get(f"/matches/{match_id}/next-question", headers=auth_headers).json()

    assert set(question) == {"id", "statement", "category"}


def test_answer_returns_feedback(client: TestClient, auth_headers: dict[str, str]) -> None:
    match_id = start_match(client, auth_headers)
    question = client.get(f"/matches/{match_id}/next-question", headers=auth_headers).json()

    response = client.post(
        f"/matches/{match_id}/answers",
        json={"question_id": question["id"], "answer": True},
        headers=auth_headers,
    )

    body = response.json()
    assert response.status_code == 200
    assert body["is_correct"] == (body["correct_answer"] is True)
    assert body["explanation"]
    assert body["score"] == (10 if body["is_correct"] else 0)


def test_same_question_cannot_be_answered_twice(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    match_id = start_match(client, auth_headers)
    question = client.get(f"/matches/{match_id}/next-question", headers=auth_headers).json()
    payload = {"question_id": question["id"], "answer": True}

    client.post(f"/matches/{match_id}/answers", json=payload, headers=auth_headers)
    response = client.post(f"/matches/{match_id}/answers", json=payload, headers=auth_headers)

    assert response.status_code == 422


def test_finish_updates_progress(client: TestClient, auth_headers: dict[str, str]) -> None:
    match_id = start_match(client, auth_headers)

    result = client.post(f"/matches/{match_id}/finish", headers=auth_headers).json()
    progress = client.get("/progress/me", headers=auth_headers).json()

    assert result["match"]["status"] == "finished"
    assert result["advanced"] is False
    assert progress["matches_played"] == 1
    assert progress["current_level"] == 1


def test_admin_routes_are_restricted(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert client.get("/admin/questions", headers=auth_headers).status_code == 403
