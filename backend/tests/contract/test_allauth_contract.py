"""The allauth headless values the frontend relies on (review finding QA-4).

openapi.yaml covers /api/v1 only. The sign-in API under /_allauth/ is
allauth's, so these tests pin the parts the frontend hard-codes in
frontend/src/api/csrf.ts: the CSRF bootstrap path, the cookie name and the
header name. tests/end-to-end/real-stack-smoke.sh checks the same through the
real Next.js server.
"""

import re
from pathlib import Path

import pytest
from django.conf import settings
from django.urls import resolve

CSRF_TS = Path(__file__).resolve().parents[3] / "frontend" / "src" / "api" / "csrf.ts"


def _frontend_constant(name: str) -> str:
    match = re.search(rf'export const {name} = "([^"]+)";', CSRF_TS.read_text())
    assert match, f"{name} not found in {CSRF_TS}"
    return match.group(1)


def test_csrf_cookie_name_matches_the_frontend():
    assert settings.CSRF_COOKIE_NAME == _frontend_constant("CSRF_COOKIE_NAME")


def test_csrf_header_name_matches_the_frontend():
    header = _frontend_constant("CSRF_HEADER_NAME")
    assert settings.CSRF_HEADER_NAME == "HTTP_" + header.upper().replace("-", "_")


@pytest.mark.django_db
def test_csrf_bootstrap_path_exists_and_sets_the_cookie(client):
    path = _frontend_constant("CSRF_BOOTSTRAP_PATH")
    assert resolve(path).url_name == "config"
    response = client.get(path)
    assert response.status_code == 200
    assert settings.CSRF_COOKIE_NAME in response.cookies


@pytest.mark.parametrize(
    "path",
    [
        "/_allauth/browser/v1/auth/session",
        "/_allauth/browser/v1/auth/code/request",
        "/_allauth/browser/v1/auth/code/confirm",
    ],
)
def test_sign_in_paths_the_frontend_will_use_exist(path):
    assert resolve(path).func.__module__.startswith("allauth.headless")
