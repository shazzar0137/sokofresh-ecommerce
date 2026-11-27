"""Django admin site with one extra rule: staff must have signed in on the admin
login page with their password in this session.

Why (re-review finding RSEC-1): a customer who signed in with an SMS code and is
later made staff would otherwise keep a code-only session that opens the admin;
and allauth's own password-login API would bypass any protection added to the
admin login page later (MFA in Phase 5).

The admin login page also limits password attempts (Phase 3 integration review
BSEC-1): per IP address and per phone number, using allauth's rate-limit
counters in the shared database cache.
"""

from allauth.core import ratelimit
from django.contrib import admin
from django.contrib.admin.apps import AdminConfig
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.http import HttpRequest, HttpResponse
from django.urls import NoReverseMatch, reverse

from apps.core.phone import InvalidPhoneNumber, normalize_kenyan_mobile

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
        """Admin password login, refused with 429 after too many attempts.

        - The key is the phone number in the same normalised form the login
          uses (UserManager.get_by_natural_key), so typing one number in other
          spellings (+254…, 254…, spaces) shares one counter (re-review RR-1).
        - The attempt is recorded *before* the password is tested, under
          allauth's cache lock, so a burst of parallel guesses cannot all slip
          through a check-then-record gap (RR-2). A successful sign-in then
          clears the counters, so staff who type the password correctly are
          not held back by their own earlier typos.
        """
        if request.method != "POST":
            return super().login(request, extra_context)
        options = {"action": ADMIN_LOGIN_FAILED_ACTION, "key": _login_key(request)}
        if not ratelimit.consume(request, **options):
            return ratelimit.respond_429(request)
        response = super().login(request, extra_context)
        if response.status_code == 302 and request.user.is_authenticated:
            ratelimit.clear(request, **options)
        return response


def _login_key(request: HttpRequest) -> str:
    raw = request.POST.get("username", "")
    try:
        return normalize_kenyan_mobile(raw)
    except InvalidPhoneNumber:
        return raw.strip().lower()


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
