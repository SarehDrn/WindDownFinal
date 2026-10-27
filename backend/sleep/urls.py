from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SleepSessionViewSet

router = DefaultRouter(trailing_slash=True)
router.include_root_view = False
router.register("sleep", SleepSessionViewSet, basename="sleep")

urlpatterns = [
    path("", include(router.urls)),
]
