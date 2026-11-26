"""Shared pytest fixtures for the whole backend."""

import json
from pathlib import Path

import pytest

REPO_DIR = Path(__file__).resolve().parent.parent
SHARED_FIXTURES = REPO_DIR / "shared" / "test-fixtures"


@pytest.fixture(scope="session")
def phone_numbers() -> dict:
    """The shared phone-number list in shared/test-fixtures/ (ADR-0011 item 11)."""
    return json.loads((SHARED_FIXTURES / "phone-numbers.json").read_text(encoding="utf-8"))


@pytest.fixture(autouse=True)
def _clear_sms_outbox():
    """Each test starts with an empty in-memory SMS outbox."""
    from apps.notifications import sms

    sms.outbox.clear()
    yield
    sms.outbox.clear()


@pytest.fixture(autouse=True)
def _clear_cache(request):
    """Rate-limit counters live in the (database) cache; reset them between tests.

    Only for tests that use the test database: otherwise no test database exists
    and clearing would hit the real DATABASE_URL (re-review finding RQA-1).
    """
    uses_db = request.node.get_closest_marker("django_db") or {
        "db",
        "transactional_db",
        "django_db_reset_sequences",
    } & set(request.fixturenames)
    if not uses_db:
        yield
        return
    from django.core.cache import cache

    request.getfixturevalue("db")
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()
