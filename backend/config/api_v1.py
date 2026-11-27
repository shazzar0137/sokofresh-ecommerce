"""Routes for /api/v1/. Each app adds its own routes here as it is built."""

from django.conf import settings
from django.urls import path

from apps.core.views import HealthView

app_name = "api_v1"

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
]

if settings.API_DOCS_ENABLED:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerSplitView

    urlpatterns += [
        path("schema", SpectacularAPIView.as_view(), name="schema"),
        path("docs/", SpectacularSwaggerSplitView.as_view(url_name="api_v1:schema"), name="docs"),
    ]
