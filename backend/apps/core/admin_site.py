"""Django admin site with one extra rule: staff must have signed in on the admin
login page with their password in this session.

Why (re-review finding RSEC-1): a customer who signed in with an SMS code and is
later made staff would otherwise keep a code-only session that opens the admin;
and allauth's own password-login API would bypass any protection added to the
admin login page later (MFA in Phase 5).

The admin login page also limits failed password attempts (Phase 3 integration
review BSEC-1): per IP address and per phone number, using allauth's rate-limit
counters in the shared database cache.
"""

from allauth.core import ratelimit
from django.contrib import admin
from django.contrib.admin.apps import AdminConfig
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.http import HttpRequest, HttpResponse
from django.urls import NoReverseMatch, reverse

ADMIN_LOGIN_SESSION_KEY = "sokofresh_admin_password_login"
# Rates live in ACCOUNT_RATE_LIMITS (config/settings/base.py) under this name.
ADMIN_LOGIN_FAILED_ACTION = "admin_login_failed"


class SokoFreshAdminSite(admin.AdminSite):
    site_header = "SokoFresh staff"
    site_title = "SokoFresh staff"

    def has_permission(self, request: HttpRequest) -> bool:
        return super().has_permission(request) and bool(
            request.session.get(ADMIN_LOGIN_SESSION_KEY)
        )

    def login(self, request: HttpRequest, extra_context=None) -> HttpResponse:
        """Admin password login, refused with 429 after too many failed attempts.

        Only failures are counted, so a staff member who types the password
        correctly is never slowed down. The check runs before the password is
        tested, so a blocked attacker learns nothing from further guesses.
        """
        if request.method != "POST":
            return super().login(request, extra_context)
        key = request.POST.get("username", "").strip().lower()
        options = {"action": ADMIN_LOGIN_FAILED_ACTION, "key": key}
        if not ratelimit.consume(request, dry_run=True, **options):
            return ratelimit.respond_429(request)
        response = super().login(request, extra_context)
        signed_in = response.status_code == 302 and request.user.is_authenticated
        if not signed_in:
            ratelimit.consume(request, **options)
        return response


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
