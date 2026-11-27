"""Rate limits cannot be dodged by spoofing headers or flooding the cache.

Review findings PERF-1 / DB-2 (cache eviction), ARCH-1 / SEC-3 / API-3
(X-Forwarded-For spoofing) and QA-5 (limit values untested).
"""

import pytest
from django.conf import settings
from django.core.cache import cache
from django.urls import include, path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.tests.factories import UserFactory
from apps.notifications import sms


class ThrottledView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"ok": True})


urlpatterns = [
    path("api/v1/_test/throttled", ThrottledView.as_view()),
    path("", include("config.urls")),
]

pytestmark = pytest.mark.django_db

CODE_REQUEST = "/_allauth/browser/v1/auth/code/request"


def test_tests_use_the_production_cache_backend():
    assert settings.CACHES["default"]["BACKEND"] == "django.core.cache.backends.db.DatabaseCache"


def test_cache_keeps_rate_limit_counters_under_a_flood_of_other_keys():
    cache.set("allauth:rl:request_login_code:key:+254712345678", [1], 600)
    cache.set_many({f"throttle_anon_10.0.{i // 256}.{i % 256}": [1] for i in range(2000)}, 60)
    assert cache.get("allauth:rl:request_login_code:key:+254712345678") == [1]


@pytest.fixture
def low_api_rates(monkeypatch):
    # DRF copies the rates onto the throttle class at import time, so patch there
    # (overriding settings would silently have no effect).
    from rest_framework.throttling import SimpleRateThrottle

    monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", {"anon": "3/min", "user": "3/min"})


@pytest.mark.urls(__name__)
def test_rates_are_enforced_without_spoofing(client, low_api_rates):
    statuses = [client.get("/api/v1/_test/throttled").status_code for _ in range(5)]
    assert statuses == [200, 200, 200, 429, 429]


@pytest.mark.urls(__name__)
def test_spoofed_forwarded_for_does_not_bypass_api_throttling(client, low_api_rates):
    statuses = [
        client.get("/api/v1/_test/throttled", headers={"X-Forwarded-For": f"1.2.3.{i}"}).status_code
        for i in range(6)
    ]
    assert statuses == [200, 200, 200, 429, 429, 429]


def test_flooding_does_not_reset_the_per_phone_code_limit(client):
    UserFactory(phone="+254712345678")
    body = {"phone": "+254712345678"}
    for _ in range(3):
        client.post(CODE_REQUEST, body, content_type="application/json")
    cache.set_many({f"throttle_anon_spoof_{i}": [1] for i in range(1000)}, 60)
    response = client.post(CODE_REQUEST, body, content_type="application/json")
    assert response.json()["errors"][0]["code"] == "too_many_login_attempts"
    assert len(sms.outbox) == 3


def test_configured_limits():
    """QA-5 / QA-11: the agreed values, so an accidental change is noticed."""
    assert settings.ACCOUNT_RATE_LIMITS["request_login_code"] == "30/m/ip,3/10m/key,10/d/key"
    assert settings.ACCOUNT_RATE_LIMITS["login"] == "30/m/ip"
    assert settings.ACCOUNT_RATE_LIMITS["change_phone"] == "1/m/user,3/d/user"
    assert settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] == {
        "anon": "120/min",
        "user": "240/min",
    }
    assert settings.REST_FRAMEWORK["NUM_PROXIES"] == settings.ALLAUTH_TRUSTED_PROXY_COUNT == 0
    assert (
        settings.ACCOUNT_LOGIN_BY_CODE_TIMEOUT == settings.ACCOUNT_PHONE_VERIFICATION_TIMEOUT == 300
    )
    assert settings.ACCOUNT_LOGIN_BY_CODE_MAX_ATTEMPTS == 3
    assert settings.SESSION_COOKIE_AGE == 14 * 24 * 3600
    assert settings.ACCOUNT_SIGNUP_OPEN is False
