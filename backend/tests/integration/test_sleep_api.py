import pytest

from sleep.models import SleepSession
from tests.conftest import PASSWORD

pytestmark = [pytest.mark.integration, pytest.mark.django_db]

NIGHT = {"start_time": "2026-10-01T23:00:00Z", "end_time": "2026-10-02T07:00:00Z"}


def test_full_flow_register_login_crud_logout(api_client):
    # Register and log in.
    api_client.post(
        "/api/auth/register/", {"email": "flow@example.com", "password": PASSWORD}, format="json"
    )
    token = api_client.post(
        "/api/auth/login/", {"email": "flow@example.com", "password": PASSWORD}, format="json"
    ).json()["token"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    # Create.
    response = api_client.post("/api/sleep/", {**NIGHT, "minutes_to_fall_asleep": 20}, format="json")
    assert response.status_code == 201, response.json()
    created = response.json()
    assert created["source"] == "manual"
    assert created["duration_minutes"] == 480
    session_id = created["id"]

    # List.
    response = api_client.get("/api/sleep/")
    assert response.status_code == 200
    assert [s["id"] for s in response.json()] == [session_id]

    # Edit with PUT and PATCH.
    response = api_client.put(
        f"/api/sleep/{session_id}/",
        {"start_time": "2026-10-01T22:30:00Z", "end_time": "2026-10-02T06:30:00Z"},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["start_time"] == "2026-10-01T22:30:00Z"

    response = api_client.patch(
        f"/api/sleep/{session_id}/", {"minutes_to_fall_asleep": 10}, format="json"
    )
    assert response.status_code == 200
    assert response.json()["minutes_to_fall_asleep"] == 10

    # Retrieve.
    assert api_client.get(f"/api/sleep/{session_id}/").json()["minutes_to_fall_asleep"] == 10

    # Delete.
    assert api_client.delete(f"/api/sleep/{session_id}/").status_code == 204
    assert not SleepSession.objects.filter(pk=session_id).exists()

    # Log out; the token stops working.
    assert api_client.post("/api/auth/logout/").status_code == 204
    assert api_client.get("/api/sleep/").status_code == 401


def test_wake_before_bed_returns_400_with_clear_error(auth_client):
    client, _ = auth_client()
    response = client.post(
        "/api/sleep/",
        {"start_time": "2026-10-02T07:00:00Z", "end_time": "2026-10-01T23:00:00Z"},
        format="json",
    )
    assert response.status_code == 400
    assert response.json() == {"end_time": ["Wake-up time must be after bedtime."]}
    assert SleepSession.objects.count() == 0


def test_patch_making_times_invalid_returns_400(auth_client):
    client, _ = auth_client()
    session_id = client.post("/api/sleep/", NIGHT, format="json").json()["id"]
    response = client.patch(
        f"/api/sleep/{session_id}/", {"end_time": "2026-10-01T22:00:00Z"}, format="json"
    )
    assert response.status_code == 400
    assert response.json()["end_time"] == ["Wake-up time must be after bedtime."]


def test_users_cannot_access_each_others_sessions(auth_client):
    alice, _ = auth_client("alice@example.com")
    bob, _ = auth_client("bob@example.com")
    alice_id = alice.post("/api/sleep/", NIGHT, format="json").json()["id"]
    bob.post("/api/sleep/", NIGHT, format="json")

    # Bob's list contains only his own session.
    bob_list = bob.get("/api/sleep/").json()
    assert len(bob_list) == 1
    assert bob_list[0]["id"] != alice_id

    # Bob cannot read, update or delete Alice's session.
    url = f"/api/sleep/{alice_id}/"
    assert bob.get(url).status_code == 404
    assert bob.put(url, NIGHT, format="json").status_code == 404
    assert bob.patch(url, {"minutes_to_fall_asleep": 1}, format="json").status_code == 404
    assert bob.delete(url).status_code == 404

    # Alice's session is unchanged.
    session = SleepSession.objects.get(pk=alice_id)
    assert session.minutes_to_fall_asleep is None


def test_client_cannot_set_user_or_source(auth_client, make_user):
    client, alice = auth_client("alice@example.com")
    other = make_user("other@example.com")
    response = client.post(
        "/api/sleep/", {**NIGHT, "user": other.pk, "source": "google"}, format="json"
    )
    assert response.status_code == 201
    session = SleepSession.objects.get(pk=response.json()["id"])
    assert session.user == alice
    assert session.source == "manual"


def test_list_is_newest_first(auth_client):
    client, _ = auth_client()
    client.post("/api/sleep/", NIGHT, format="json")
    client.post(
        "/api/sleep/",
        {"start_time": "2026-10-02T23:00:00Z", "end_time": "2026-10-03T07:00:00Z"},
        format="json",
    )
    starts = [s["start_time"] for s in client.get("/api/sleep/").json()]
    assert starts == ["2026-10-02T23:00:00Z", "2026-10-01T23:00:00Z"]


@pytest.mark.parametrize(
    "method,url",
    [("get", "/api/sleep/"), ("post", "/api/sleep/"), ("get", "/api/sleep/1/"), ("delete", "/api/sleep/1/")],
)
def test_unauthenticated_requests_get_401(api_client, method, url):
    assert getattr(api_client, method)(url).status_code == 401
