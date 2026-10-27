from django.urls import reverse
from rest_framework.test import APIRequestFactory

from core.views import HealthView


def test_health_view_returns_ok():
    request = APIRequestFactory().get("/api/health/")
    response = HealthView.as_view()(request)
    assert response.status_code == 200
    assert response.data == {"status": "ok"}


def test_health_url_is_routed():
    assert reverse("health") == "/api/health/"
