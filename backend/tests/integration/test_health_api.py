import pytest
from rest_framework.test import APIClient

pytestmark = [pytest.mark.integration, pytest.mark.django_db]


def test_health_endpoint():
    response = APIClient().get("/api/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_schema_is_served():
    response = APIClient().get("/api/schema/")
    assert response.status_code == 200
    assert b"/api/health/" in response.content
