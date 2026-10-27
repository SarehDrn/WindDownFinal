from datetime import date, timedelta
from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from sleep.management.commands import load_demo
from sleep.models import SleepSession

pytestmark = [pytest.mark.integration, pytest.mark.django_db]


def run_load_demo(*args):
    out = StringIO()
    call_command("load_demo", *args, stdout=out)
    return out.getvalue()


def demo_sessions():
    return SleepSession.objects.filter(user__username=load_demo.DEMO_EMAIL)


def test_creates_demo_user_with_30_nights():
    output = run_load_demo()
    assert "Created demo user" in output
    user = get_user_model().objects.get(username=load_demo.DEMO_EMAIL)
    assert user.email == load_demo.DEMO_EMAIL
    assert user.check_password(load_demo.DEFAULT_DEMO_PASSWORD)
    sessions = demo_sessions()
    assert sessions.count() == 30
    assert sessions.values("external_id").distinct().count() == 30
    assert all(s.end_time > s.start_time for s in sessions)


def test_running_twice_does_not_duplicate():
    run_load_demo()
    first_ids = set(demo_sessions().values_list("id", flat=True))
    output = run_load_demo()
    assert "Updated demo user" in output
    assert get_user_model().objects.filter(username=load_demo.DEMO_EMAIL).count() == 1
    assert demo_sessions().count() == 30
    assert set(demo_sessions().values_list("id", flat=True)) == first_ids


def test_rerun_on_a_later_day_keeps_exactly_30_nights(monkeypatch):
    monkeypatch.setattr(load_demo.timezone, "localdate", lambda: date(2026, 10, 1))
    run_load_demo()
    monkeypatch.setattr(load_demo.timezone, "localdate", lambda: date(2026, 10, 6))
    run_load_demo()
    sessions = demo_sessions()
    assert sessions.count() == 30
    newest = sessions.order_by("-end_time").first()
    oldest = sessions.order_by("end_time").first()
    assert newest.end_time.date() == date(2026, 10, 6)
    assert oldest.end_time.date() == date(2026, 10, 6) - timedelta(days=29)


def test_does_not_touch_other_users(make_user):
    other = make_user("other@example.com")
    run_load_demo()
    assert not SleepSession.objects.filter(user=other).exists()


def test_demo_user_can_log_in_and_use_the_api(api_client):
    run_load_demo("--password", "custom-demo-pass")
    response = api_client.post(
        "/api/auth/login/",
        {"email": load_demo.DEMO_EMAIL, "password": "custom-demo-pass"},
        format="json",
    )
    assert response.status_code == 200
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {response.json()['token']}")
    assert len(api_client.get("/api/sleep/").json()) == 30
    rec = api_client.get("/api/recommendation/", {"wake": "07:00"}).json()
    assert rec["nights_logged"] == 30
    assert rec["uses_population_averages"] is True
