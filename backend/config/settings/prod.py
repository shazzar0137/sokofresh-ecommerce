"""Production (and staging) settings.

Every value that differs per deployment comes from the host's environment
variables. Missing or unsafe values stop the application from starting, so a
misconfigured server fails safely instead of running insecurely.
"""

import re
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from .base import *  # noqa: F403
from .base import ADMIN_URL, SECRET_KEY, SMS_BACKEND, env

DEBUG = False

ALLOWED_HOSTS = [host.strip() for host in env.list("DJANGO_ALLOWED_HOSTS") if host.strip()]
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list the site's host names.")
# "*" accepts any Host header and ".example.com" any sub-domain; production
# lists exact host names only (finding BSEC-4).
if any(host == "*" or host.startswith(".") for host in ALLOWED_HOSTS):
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS must list exact host names (no '*', no leading '.')."
    )


def _is_exact_https_origin(value: str) -> bool:
    """True for 'https://host' or 'https://host:port' and nothing looser.

    Findings BSEC-6 / ARC-9: a regex alone accepted 'https://.', port 99999 and
    ':443' (browsers never send the default port, so it would never match).
    """
    if value != value.strip().lower():
        return False
    try:
        parts = urlsplit(value)
        port = parts.port
    except ValueError:  # malformed, or port outside 0-65535
        return False
    host = parts.hostname or ""
    labels = host.split(".")
    return (
        parts.scheme == "https"
        and value == f"https://{parts.netloc}"  # no path, query, fragment or trailing "/"
        and "@" not in parts.netloc
        and len(labels) >= 2
        and all(re.fullmatch(r"[a-z0-9]([a-z0-9-]*[a-z0-9])?", label) for label in labels)
        and port not in (0, 443)
    )


# The browser reaches Django through the Next.js rewrite (ADR-0011 item 3), so
# Django sees its own host name but the browser's Origin (the storefront). The
# storefront origin must be trusted explicitly, or every sign-in POST fails the
# CSRF origin check (Phase 3 integration review INT-1, contract point F-8).
CSRF_TRUSTED_ORIGINS = [o.strip() for o in env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])]
if not CSRF_TRUSTED_ORIGINS or not all(map(_is_exact_https_origin, CSRF_TRUSTED_ORIGINS)):
    raise ImproperlyConfigured(
        "DJANGO_CSRF_TRUSTED_ORIGINS must list the storefront origin(s), for example "
        "'https://www.sokofresh.co.ke' (https, lower case, no path, no wildcard, "
        "no ':443')."
    )

# D-031 requires MFA for the two admin users. Admin MFA arrives in Phase 5
# (KI-007); until then the admin login has only a password and an attempt limit.
# Production refuses to start unless the owner has explicitly accepted that
# risk for this deployment (finding BSEC-1). Remove this switch with Phase 5.
if not env.bool("DJANGO_ACCEPT_ADMIN_WITHOUT_MFA", default=False):
    raise ImproperlyConfigured(
        "Admin two-step sign-in (MFA, D-031) is not built yet (Phase 5). Set "
        "DJANGO_ACCEPT_ADMIN_WITHOUT_MFA=true only if the owner accepts password-only "
        "admin sign-in for this deployment (see KI-007)."
    )

# Same rules as Django's security.W009 check, enforced at start-up.
if (
    len(SECRET_KEY) < 50
    or len(set(SECRET_KEY)) < 5
    or SECRET_KEY.lower().startswith(("dev-only", "test-only", "django-insecure"))
):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be a long, random production value.")

# A short, lower-case path segment ending in "/", not containing "admin".
if not re.fullmatch(r"[a-z0-9][a-z0-9-]{5,}/", ADMIN_URL) or "admin" in ADMIN_URL:
    raise ImproperlyConfigured(
        "DJANGO_ADMIN_URL must be a non-default path like 'staff-x7k2/' "
        "(lower-case letters, digits and dashes, ending in '/', without 'admin')."
    )

try:
    _sms_backend = import_string(SMS_BACKEND)
except ImportError as exc:
    raise ImproperlyConfigured(f"SMS_BACKEND cannot be imported: {SMS_BACKEND!r}") from exc
if getattr(_sms_backend, "dev_only", True):
    raise ImproperlyConfigured("Development SMS backends cannot be used in production.")

# Required: how many proxies (Cloudflare, host load balancer) sit in front of
# Django. Wrong values either let clients spoof their IP or make all users share
# one IP for rate limits, so there is no default.
TRUSTED_PROXY_COUNT = env.int("DJANGO_TRUSTED_PROXY_COUNT")
if TRUSTED_PROXY_COUNT < 0:
    raise ImproperlyConfigured("DJANGO_TRUSTED_PROXY_COUNT must be 0 or more.")
ALLAUTH_TRUSTED_PROXY_COUNT = TRUSTED_PROXY_COUNT
REST_FRAMEWORK = {**REST_FRAMEWORK, "NUM_PROXIES": TRUSTED_PROXY_COUNT}  # noqa: F405

# HTTPS everywhere (TLS terminates at Cloudflare / the host's proxy). The proxy
# must overwrite X-Forwarded-Proto, and the app must not be reachable directly.
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
if env.bool("DJANGO_BEHIND_TLS_PROXY", default=True):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Start with one hour; raise to a year (31536000) once HTTPS is confirmed stable.
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=3600)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False)
SECURE_HSTS_PRELOAD = False

# Deliberate, documented choices (backend/documentation/security/SECURITY.md):
# - W005: subdomains are not yet all HTTPS-only by decision; enable with
#   DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS once the domain plan is final.
# - W021: HSTS preload is a long-term commitment; not submitted before launch.
SILENCED_SYSTEM_CHECKS = ["security.W005", "security.W021"]

API_DOCS_ENABLED = False
