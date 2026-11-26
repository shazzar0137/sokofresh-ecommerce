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
def _clear_cache():
    """Rate-limit counters live in the cache; reset them between tests."""
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()
