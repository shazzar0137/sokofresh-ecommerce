"""Settings for the automated test suite (pytest). Uses a real PostgreSQL database."""

import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-insecure-key-0123456789abcdef0123456789")
os.environ.setdefault(
    "DATABASE_URL", "postgres://sokofresh:sokofresh-local-dev@localhost:5432/sokofresh_dev"
)

from .base import *  # noqa: E402, F403

DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost"]

# Fast, insecure hashing is acceptable only for tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Each test process gets its own in-memory cache, so rate limits reset between tests.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# Messages are captured in memory (apps.notifications.sms.outbox).
SMS_BACKEND = "apps.notifications.sms.LocMemSmsBackend"

# Tasks run immediately inside the test.
TASKS = {"default": {"BACKEND": "django.tasks.backends.immediate.ImmediateBackend"}}

OUTBOUND_HTTP_ALLOWED_HOSTS = ["sandbox.example-provider.test"]

API_DOCS_ENABLED = False
