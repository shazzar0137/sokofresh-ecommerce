"""Production (and staging) settings.

Every value that differs per deployment comes from the host's environment
variables. Missing or unsafe values stop the application from starting, so a
misconfigured server fails safely instead of running insecurely.
"""

import re

from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from .base import *  # noqa: F403
from .base import ADMIN_URL, SECRET_KEY, SMS_BACKEND, env

DEBUG = False

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list the site's host names.")

# Same rules as Django's security.W009 check, enforced at start-up.
if (
    len(SECRET_KEY) < 50
    or len(set(SECRET_KEY)) < 5
    or SECRET_KEY.startswith(("dev-only", "test-only", "django-insecure"))
):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be a long, random production value.")

# A short, lower-case path segment ending in "/", not containing "admin".
if not re.fullmatch(r"[a-z0-9][a-z0-9-]{5,}/", ADMIN_URL) or "admin" in ADMIN_URL:
    raise ImproperlyConfigured(
        "DJANGO_ADMIN_URL must be a non-default path like 'staff-x7k2/' "
        "(lower-case letters, digits and dashes, ending in '/', without 'admin')."
    )

try:
    _sms_backend = import_string(SMS_BACKEND.strip())
except ImportError as exc:
    raise ImproperlyConfigured(f"SMS_BACKEND cannot be imported: {SMS_BACKEND!r}") from exc
if getattr(_sms_backend, "dev_only", True):
    raise ImproperlyConfigured("Development SMS backends cannot be used in production.")

# Required: how many proxies (Cloudflare, host load balancer) sit in front of
# Django. Wrong values either let clients spoof their IP or make all users share
# one IP for rate limits, so there is no default.
TRUSTED_PROXY_COUNT = env.int("DJANGO_TRUSTED_PROXY_COUNT")
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
