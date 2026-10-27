import pytest

from accounts.serializers import LoginSerializer, RegisterSerializer
from tests.conftest import PASSWORD

pytestmark = pytest.mark.django_db


def test_register_normalizes_email_and_hashes_password():
    serializer = RegisterSerializer(data={"email": "  Bob@Example.COM ", "password": PASSWORD})
    assert serializer.is_valid(), serializer.errors
    user = serializer.save()
    assert user.email == "bob@example.com"
    assert user.username == "bob@example.com"
    assert user.password != PASSWORD
    assert user.check_password(PASSWORD)


def test_register_rejects_duplicate_email(make_user):
    make_user(email="bob@example.com")
    serializer = RegisterSerializer(data={"email": "BOB@example.com", "password": PASSWORD})
    assert not serializer.is_valid()
    assert "email" in serializer.errors


def test_register_rejects_invalid_email():
    serializer = RegisterSerializer(data={"email": "not-an-email", "password": PASSWORD})
    assert not serializer.is_valid()
    assert "email" in serializer.errors


@pytest.mark.parametrize("password", ["short", "12345678901", "password123"])
def test_register_rejects_weak_password(password):
    serializer = RegisterSerializer(data={"email": "bob@example.com", "password": password})
    assert not serializer.is_valid()
    assert "password" in serializer.errors


def test_login_accepts_correct_credentials_case_insensitive_email(make_user):
    user = make_user(email="bob@example.com")
    serializer = LoginSerializer(data={"email": "Bob@Example.com", "password": PASSWORD})
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["user"] == user


def test_login_rejects_wrong_password(make_user):
    make_user(email="bob@example.com")
    serializer = LoginSerializer(data={"email": "bob@example.com", "password": "wrong-pass-1"})
    assert not serializer.is_valid()
    assert serializer.errors["non_field_errors"] == ["Invalid email or password."]
