"""Settings for the automated test suite (pytest). Uses a real PostgreSQL database."""

import os

from . import _env  # noqa: F401  (reads backend/.env first)

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-insecure-key-0123456789abcdef0123456789")
os.environ.setdefault(
    "DATABASE_URL", "postgres://sokofresh:sokofresh-local-dev@localhost:5432/sokofresh_dev"
)

from .base import *  # noqa: E402, F403

DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost"]

# Fast, insecure hashing is acceptable only for tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Tests use the same database cache as production (created by migration
# core.0001), so rate-limit behaviour is tested on the real backend. conftest.py
# clears it between tests.
# Messages are captured in memory (apps.notifications.sms.outbox).
SMS_BACKEND = "apps.notifications.sms.LocMemSmsBackend"

# Tasks run immediately inside the test.
TASKS = {"default": {"BACKEND": "django.tasks.backends.immediate.ImmediateBackend"}}

OUTBOUND_HTTP_ALLOWED_HOSTS = ["sandbox.example-provider.test"]

API_DOCS_ENABLED = False
