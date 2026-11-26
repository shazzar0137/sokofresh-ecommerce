"""Production (and staging) settings.

Every value that differs per deployment comes from the host's environment
variables. Missing required values stop the application from starting, so a
misconfigured server fails safely instead of running insecurely.
"""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import ADMIN_URL, SECRET_KEY, SMS_BACKEND, env

DEBUG = False

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list the site's host names.")

if len(SECRET_KEY) < 50 or SECRET_KEY.startswith(("dev-only", "test-only")):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be a long, random production value.")

if ADMIN_URL in ("admin/", "/admin/"):
    raise ImproperlyConfigured("DJANGO_ADMIN_URL must be a non-default path (e.g. 'staff-x7k2/').")

_DEV_SMS_BACKENDS = (
    "apps.notifications.sms.ConsoleSmsBackend",
    "apps.notifications.sms.LocMemSmsBackend",
)
if SMS_BACKEND in _DEV_SMS_BACKENDS:
    raise ImproperlyConfigured("Development SMS backends cannot be used in production.")

# HTTPS everywhere (TLS terminates at Cloudflare / the host's proxy).
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
