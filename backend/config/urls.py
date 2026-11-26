"""Top-level URL configuration.

- /api/v1/      : SokoFresh REST API (ADR-0004)
- /_allauth/    : django-allauth headless sign-in API (ADR-0005)
- ADMIN_URL     : Django admin for staff, at a non-default path (ADR-0008)
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("config.api_v1")),
    path("_allauth/", include("allauth.headless.urls")),
    path(settings.ADMIN_URL, admin.site.urls),
]

# Unknown /api/ paths and server errors return RFC 9457 problem details as JSON.
handler404 = "apps.core.views.not_found"
handler500 = "apps.core.views.server_error"
