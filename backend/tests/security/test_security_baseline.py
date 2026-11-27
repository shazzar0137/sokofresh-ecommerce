"""Security baseline checked on real responses (proposal §9)."""

import pytest
from django.test import Client

from apps.accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_api_responses_carry_security_headers(client):
    response = client.get("/api/v1/health")
    assert response["X-Frame-Options"] == "DENY"
    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["Referrer-Policy"] == "same-origin"
    csp = response["Content-Security-Policy"]
    assert "default-src 'self'" in csp and "frame-ancestors 'none'" in csp


def test_sign_in_requires_a_csrf_token():
    UserFactory(phone="+254712345678")
    strict = Client(enforce_csrf_checks=True)
    response = strict.post(
        "/_allauth/browser/v1/auth/code/request",
        {"phone": "+254712345678"},
        content_type="application/json",
    )
    assert response.status_code == 403


def test_sign_in_works_with_the_csrf_token():
    UserFactory(phone="+254712345678")
    strict = Client(enforce_csrf_checks=True)
    strict.get("/_allauth/browser/v1/config")  # sets the csrftoken cookie
    token = strict.cookies["csrftoken"].value
    response = strict.post(
        "/_allauth/browser/v1/auth/code/request",
        {"phone": "+254712345678"},
        content_type="application/json",
        headers={"X-CSRFToken": token},
    )
    assert response.status_code == 401  # pending code step, not a CSRF failure


def test_api_docs_are_not_served_outside_development(client):
    assert client.get("/api/v1/docs/").status_code == 404
    assert client.get("/api/v1/schema").status_code == 404


@pytest.mark.parametrize(
    "route",
    [
        "account/phone",
        "account/email",
        "account/password/change",
        "auth/email/verify",
        "auth/email/verify/resend",
        "auth/password/request",
        "auth/password/reset",
        "auth/login",  # BSEC-2: staff passwords only on the throttled admin login
        "auth/reauthenticate",
    ],
)
@pytest.mark.parametrize("method", ["get", "post"])
def test_unused_allauth_features_are_unavailable(client, route, method):
    """SEC-8 / RSEC-3: no SMS/email to arbitrary addresses, no password reset by email."""
    from apps.notifications import sms

    client.force_login(UserFactory())
    response = getattr(client, method)(
        f"/_allauth/browser/v1/{route}",
        {"email": "victim@example.com", "phone": "+254711000222"},
        content_type="application/json",
    )
    assert response.status_code == 404
    assert sms.outbox == []
    from allauth.account.models import EmailAddress

    assert not EmailAddress.objects.exists()


def test_slow_log_input_cannot_stall_a_request(client):
    """RSEC-4: a crafted Host header used to take seconds to log."""
    import time

    start = time.perf_counter()
    response = client.get("/api/v1/health", HTTP_HOST="code" + " " * 8000)
    assert response.status_code == 400
    assert time.perf_counter() - start < 1.0
