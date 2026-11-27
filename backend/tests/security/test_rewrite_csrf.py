"""CSRF through the Next.js same-origin rewrite (Phase 3 integration review INT-1).

Through the rewrite Django receives its own host in `Host`, the storefront in
`X-Forwarded-Host`, and the browser's `Origin` (the storefront). Over HTTPS,
Django's CSRF check compares `Origin` with the host or CSRF_TRUSTED_ORIGINS, so
production must trust the storefront origin explicitly. These tests reproduce
the headers measured from a real `next start` in front of Django.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest
from django.test import Client, override_settings

from tests.integration.test_settings import PROD_ENV

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


# ARC-2 / QA-12: the tests above set CSRF_TRUSTED_ORIGINS themselves, so they
# pass even if prod.py forgets it. This one loads the real production settings
# in a fresh process and runs Django's own CSRF and host checks on a request
# shaped exactly like one arriving through the Next.js rewrite.
_PROD_CSRF_SCRIPT = r"""
import json
import django
django.setup()
from django.middleware.csrf import CsrfViewMiddleware, _get_new_csrf_string, _mask_cipher_secret
from django.test import RequestFactory

secret = _get_new_csrf_string()
results = {}
for name, origin in [("storefront", "https://www.sokofresh.example"),
                     ("foreign", "https://evil.example")]:
    request = RequestFactory().post(
        "/_allauth/browser/v1/auth/code/request",
        data="{}",
        content_type="application/json",
        HTTP_HOST="api.sokofresh.example",
        HTTP_X_FORWARDED_HOST="www.sokofresh.example",
        HTTP_X_FORWARDED_PROTO="https",
        HTTP_ORIGIN=origin,
        HTTP_REFERER=origin + "/sign-in",
        HTTP_X_CSRFTOKEN=_mask_cipher_secret(secret),
    )
    request.COOKIES["csrftoken"] = secret
    middleware = CsrfViewMiddleware(lambda r: None)
    response = middleware.process_view(request, lambda r: None, (), {})
    results[name] = {
        "secure": request.is_secure(),
        "host": request.get_host(),
        "csrf": "passed" if response is None else response.status_code,
    }
print(json.dumps(results))
"""


def test_real_production_settings_accept_the_storefront_through_the_rewrite():
    env = {k: v for k, v in os.environ.items() if not k.startswith(("DJANGO_", "SMS_"))}
    env.update(PROD_ENV)
    result = subprocess.run(  # noqa: S603 - fixed script, test only
        [sys.executable, "-c", _PROD_CSRF_SCRIPT],
        cwd=Path(__file__).resolve().parents[2],
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, result.stderr
    results = json.loads(result.stdout)
    assert results["storefront"] == {
        "secure": True,
        "host": "api.sokofresh.example",
        "csrf": "passed",
    }
    assert results["foreign"]["csrf"] == 403
