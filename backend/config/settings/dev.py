"""Local development settings. Never used on a server."""

import os

# Development-only defaults, so a new developer can run the project with only a
# DATABASE_URL. These values are not secrets and are never valid in production.
os.environ.setdefault(
    "DJANGO_SECRET_KEY", "dev-only-insecure-key-not-for-production-use-0123456789abcdef"
)

from .base import *  # noqa: E402, F403
from .base import REST_FRAMEWORK, env  # noqa: E402

DEBUG = True
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Next.js dev server proxies /api and /_allauth to Django (same origin, ADR-0011).
CSRF_TRUSTED_ORIGINS = env.list(
    "DJANGO_CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000", "http://127.0.0.1:3000"]
)

# Codes are printed to the console with the phone number masked. No SMS is sent.
SMS_BACKEND = env("SMS_BACKEND", default="apps.notifications.sms.ConsoleSmsBackend")

# Browsable API is convenient while developing.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

# Interactive API docs at /api/v1/docs/ (development only).
API_DOCS_ENABLED = True

# Swagger UI loads its files from jsdelivr; allow that host in development only.
# (Its start-up script is served by Django itself: SpectacularSwaggerSplitView.)
from .base import SECURE_CSP  # noqa: E402

_SWAGGER_CDN = "https://cdn.jsdelivr.net"
SECURE_CSP = {
    **SECURE_CSP,
    "script-src": ["'self'", _SWAGGER_CDN],
    "style-src": ["'self'", _SWAGGER_CDN],
    "img-src": ["'self'", "data:", _SWAGGER_CDN],
}
