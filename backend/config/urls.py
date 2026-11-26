"""Top-level URL configuration.

- /api/v1/      : SokoFresh REST API (ADR-0004)
- /_allauth/    : django-allauth headless sign-in API (ADR-0005)
- ADMIN_URL     : Django admin for staff, at a non-default path (ADR-0008)
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from apps.core.views import not_found

DISABLED_ALLAUTH_ROUTES = (
    "account/phone",
    "account/email",
    "account/password/change",
    "auth/email/verify",
    "auth/email/verify/resend",
    "auth/password/request",
    "auth/password/reset",
)

urlpatterns = [
    path("api/v1/", include("config.api_v1")),
    # allauth features SokoFresh does not offer yet are shadowed (404), so they
    # cannot be used to send SMS/email to arbitrary addresses or reset staff
    # passwords (findings SEC-8, RSEC-3). Revisit when each is designed.
    *[path(f"_allauth/browser/v1/{route}", not_found) for route in DISABLED_ALLAUTH_ROUTES],
    path("_allauth/", include("allauth.headless.urls")),
    path(settings.ADMIN_URL, admin.site.urls),
]

# Errors on /api/ and /_allauth/ paths return RFC 9457 problem details as JSON;
# other paths (Django admin) keep Django's HTML pages. Used when DEBUG=False.
handler400 = "apps.core.views.bad_request"
handler403 = "apps.core.views.permission_denied"
handler404 = "apps.core.views.not_found"
handler500 = "apps.core.views.server_error"
