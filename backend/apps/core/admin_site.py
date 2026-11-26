"""Django admin site with one extra rule: staff must have signed in on the admin
login page with their password in this session.

Why (re-review finding RSEC-1): a customer who signed in with an SMS code and is
later made staff would otherwise keep a code-only session that opens the admin;
and allauth's own password-login API would bypass any protection added to the
admin login page later (MFA in Phase 5).
"""

from django.contrib import admin
from django.contrib.admin.apps import AdminConfig
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.http import HttpRequest
from django.urls import NoReverseMatch, reverse

ADMIN_LOGIN_SESSION_KEY = "sokofresh_admin_password_login"


class SokoFreshAdminSite(admin.AdminSite):
    site_header = "SokoFresh staff"
    site_title = "SokoFresh staff"

    def has_permission(self, request: HttpRequest) -> bool:
        return super().has_permission(request) and bool(
            request.session.get(ADMIN_LOGIN_SESSION_KEY)
        )


class SokoFreshAdminConfig(AdminConfig):
    default_site = "apps.core.admin_site.SokoFreshAdminSite"


@receiver(user_logged_in, dispatch_uid="sokofresh_mark_admin_login")
def mark_admin_password_login(sender, request: HttpRequest | None, user, **kwargs) -> None:
    """Remember in the session whether this sign-in happened on the admin login page."""
    if request is None or not hasattr(request, "session"):
        return
    try:
        admin_login = reverse("admin:login")
    except NoReverseMatch:
        admin_login = None
    if admin_login and request.path == admin_login:
        request.session[ADMIN_LOGIN_SESSION_KEY] = True
    else:
        request.session.pop(ADMIN_LOGIN_SESSION_KEY, None)
