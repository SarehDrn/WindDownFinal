import pytest
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

PASSWORD = "sleepy-Owl-2024"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_user(db):
    def _make_user(email="alice@example.com", password=PASSWORD):
        return get_user_model().objects.create_user(username=email, email=email, password=password)

    return _make_user


@pytest.fixture
def auth_client(make_user):
    """Return (client, user) for a freshly created, token-authenticated user."""

    def _auth_client(email="alice@example.com"):
        user = make_user(email=email)
        token, _ = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        return client, user

    return _auth_client
