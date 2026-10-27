import pytest

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

NIGHT = {"start_time": "2026-10-01T23:00:00Z", "end_time": "2026-10-02T07:00:00Z"}


def test_cold_start_recommendation(auth_client):
    client, _ = auth_client()
    response = client.get("/api/recommendation/", {"wake": "07:00"})
    assert response.status_code == 200
    assert response.json() == {
        "wake": "07:00",
        "bedtime": "23:15",
        "previous_day": True,
        "cycles": 5,
        "cycle_length_minutes": 90,
        "minutes_to_fall_asleep": 15,
        "sleep_minutes": 450,
        "reason": "5 cycles of 90 min + 15 min to fall asleep",
        "mode": "population",
        "uses_population_averages": True,
        "nights_logged": 0,
        "message": (
            "Based on population averages (90-min cycles, 15 min to fall asleep). "
            "Log 7 more nights to unlock personal recommendations."
        ),
    }


def test_nights_logged_counts_only_own_sessions(auth_client):
    alice, _ = auth_client("alice@example.com")
    bob, _ = auth_client("bob@example.com")
    alice.post("/api/sleep/", NIGHT, format="json")
    alice.post("/api/sleep/", NIGHT, format="json")
    bob.post("/api/sleep/", NIGHT, format="json")

    data = alice.get("/api/recommendation/", {"wake": "07:00"}).json()
    assert data["nights_logged"] == 2
    assert "Log 5 more nights" in data["message"]
    assert bob.get("/api/recommendation/", {"wake": "07:00"}).json()["nights_logged"] == 1


def test_wake_after_midnight_wraps(auth_client):
    client, _ = auth_client()
    data = client.get("/api/recommendation/", {"wake": "01:00"}).json()
    assert data["bedtime"] == "17:15"
    assert data["previous_day"] is True


@pytest.mark.parametrize("wake", [None, "", "25:00", "7am", "07:60"])
def test_invalid_wake_returns_400(auth_client, wake):
    client, _ = auth_client()
    params = {} if wake is None else {"wake": wake}
    response = client.get("/api/recommendation/", params)
    assert response.status_code == 400
    assert "wake" in response.json()


def test_recommendation_requires_authentication(api_client):
    assert api_client.get("/api/recommendation/", {"wake": "07:00"}).status_code == 401
