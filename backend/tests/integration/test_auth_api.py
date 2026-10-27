import pytest
from rest_framework.authtoken.models import Token

from tests.conftest import PASSWORD

pytestmark = [pytest.mark.integration, pytest.mark.django_db]


def test_register_login_logout_flow(api_client):
    response = api_client.post(
        "/api/auth/register/", {"email": "carol@example.com", "password": PASSWORD}, format="json"
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "carol@example.com"
    assert body["token"]
    assert "password" not in body

    response = api_client.post(
        "/api/auth/login/", {"email": "carol@example.com", "password": PASSWORD}, format="json"
    )
    assert response.status_code == 200
    token = response.json()["token"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    response = api_client.post("/api/auth/logout/")
    assert response.status_code == 204
    assert not Token.objects.filter(key=token).exists()

    # The old token no longer works.
    response = api_client.post("/api/auth/logout/")
    assert response.status_code == 401


def test_register_duplicate_email_returns_400(api_client, make_user):
    make_user(email="carol@example.com")
    response = api_client.post(
        "/api/auth/register/", {"email": "carol@example.com", "password": PASSWORD}, format="json"
    )
    assert response.status_code == 400
    assert "email" in response.json()


def test_login_with_wrong_password_returns_400(api_client, make_user):
    make_user(email="carol@example.com")
    response = api_client.post(
        "/api/auth/login/", {"email": "carol@example.com", "password": "nope-nope-1"}, format="json"
    )
    assert response.status_code == 400
    assert response.json() == {"non_field_errors": ["Invalid email or password."]}


def test_logout_requires_authentication(api_client):
    assert api_client.post("/api/auth/logout/").status_code == 401
