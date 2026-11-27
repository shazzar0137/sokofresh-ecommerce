"""CSRF through the Next.js same-origin rewrite (Phase 3 integration review INT-1).

Through the rewrite Django receives its own host in `Host`, the storefront in
`X-Forwarded-Host`, and the browser's `Origin` (the storefront). Over HTTPS,
Django's CSRF check compares `Origin` with the host or CSRF_TRUSTED_ORIGINS, so
production must trust the storefront origin explicitly. These tests reproduce
the headers measured from a real `next start` in front of Django.
"""

import pytest
from django.test import Client, override_settings

BACKEND_HOST = "backend.internal"
STOREFRONT = "https://www.sokofresh.example"
SESSION_URL = "/_allauth/browser/v1/auth/session"
CODE_REQUEST_URL = "/_allauth/browser/v1/auth/code/request"
REWRITE_HEADERS = {
    "HTTP_HOST": BACKEND_HOST,
    "HTTP_X_FORWARDED_HOST": "www.sokofresh.example",
    "HTTP_X_FORWARDED_PROTO": "https",
    "HTTP_ORIGIN": STOREFRONT,
    "HTTP_REFERER": f"{STOREFRONT}/sign-in",
}


def _code_request(client: Client):
    client.get(SESSION_URL, **REWRITE_HEADERS)
    token = client.cookies["csrftoken"].value
    response = client.post(
        CODE_REQUEST_URL,
        data={"phone": "+254712345678"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=token,
        **REWRITE_HEADERS,
    )
    return response


@pytest.mark.django_db
@override_settings(
    ALLOWED_HOSTS=[BACKEND_HOST],
    SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
    CSRF_TRUSTED_ORIGINS=[STOREFRONT],
)
def test_sign_in_post_through_the_rewrite_passes_csrf_when_the_storefront_is_trusted():
    response = _code_request(Client(enforce_csrf_checks=True))
    assert response.status_code != 403, response.content
    assert response.status_code == 401  # allauth: code sent, login_by_code flow pending


@pytest.mark.django_db
@override_settings(
    ALLOWED_HOSTS=[BACKEND_HOST],
    SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
    CSRF_TRUSTED_ORIGINS=[],
)
def test_sign_in_post_through_the_rewrite_fails_csrf_without_the_trusted_storefront():
    response = _code_request(Client(enforce_csrf_checks=True))
    assert response.status_code == 403
    assert response.json()["code"] == "csrf_failed"


@pytest.mark.django_db
@override_settings(
    ALLOWED_HOSTS=[BACKEND_HOST],
    SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
    CSRF_TRUSTED_ORIGINS=[STOREFRONT],
)
def test_a_foreign_origin_is_still_refused():
    client = Client(enforce_csrf_checks=True)
    client.get(SESSION_URL, **REWRITE_HEADERS)
    token = client.cookies["csrftoken"].value
    response = client.post(
        CODE_REQUEST_URL,
        data={"phone": "+254712345678"},
        content_type="application/json",
        HTTP_X_CSRFTOKEN=token,
        **{
            **REWRITE_HEADERS,
            "HTTP_ORIGIN": "https://evil.example",
            "HTTP_REFERER": "https://evil.example/",
        },
    )
    assert response.status_code == 403
