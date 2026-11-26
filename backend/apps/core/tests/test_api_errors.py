"""Error behaviour on real requests (review findings API-1, 2, 5, 6, 8, 9, QA-10).

Throwaway views are mounted with a test URLconf that also includes the real one.
"""

import pytest
from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import Client, override_settings
from django.urls import include, path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.tests.factories import UserFactory
from apps.core.exceptions import PROBLEM_CONTENT_TYPE


class ProtectedView(APIView):
    def get(self, request):
        return Response({"ok": True})

    def post(self, request):
        return Response({"ok": True})


class DjangoValidationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raise DjangoValidationError({"phone": ["Enter a valid Kenyan mobile number."]})


class EchoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(request.data)


def crashing_plain_view(request):
    raise RuntimeError("secret detail: db.internal")


urlpatterns = [
    path("api/v1/_test/protected", ProtectedView.as_view()),
    path("api/v1/_test/django-validation", DjangoValidationView.as_view()),
    path("api/v1/_test/echo", EchoView.as_view()),
    path("api/v1/_test/crash", crashing_plain_view),
    path("staff-test/crash", crashing_plain_view),
    path("", include("config.urls")),
]
handler400 = "apps.core.views.bad_request"
handler403 = "apps.core.views.permission_denied"
handler404 = "apps.core.views.not_found"
handler500 = "apps.core.views.server_error"

pytestmark = [pytest.mark.django_db, pytest.mark.urls(__name__)]


def assert_problem(response, status, code):
    assert response.status_code == status
    assert response["Content-Type"] == PROBLEM_CONTENT_TYPE
    body = response.json()
    assert body["status"] == status and body["code"] == code
    return body


def test_not_signed_in_is_401_with_a_challenge(client):
    response = client.get("/api/v1/_test/protected")
    assert_problem(response, 401, "not_authenticated")
    assert response["WWW-Authenticate"] == 'Session realm="api"'


def test_signed_in_user_passes(client):
    client.force_login(UserFactory())
    assert client.get("/api/v1/_test/protected").status_code == 200


def test_django_validation_error_in_a_view_is_422():
    body = assert_problem(Client().get("/api/v1/_test/django-validation"), 422, "validation_error")
    assert body["errors"][0]["field"] == "phone"


def test_malformed_json_is_400_without_parser_internals(client):
    response = client.post("/api/v1/_test/echo", "{", content_type="application/json")
    body = assert_problem(response, 400, "malformed_request")
    assert body["detail"] == "The request body is not valid JSON."


def test_form_encoded_body_is_415(client):
    response = client.post("/api/v1/_test/echo", {"a": "b"})
    assert_problem(response, 415, "unsupported_media_type")


def test_html_accept_header_still_gets_json_problem(client):
    response = client.get("/api/v1/_test/protected", headers={"Accept": "text/html"})
    assert response.status_code in (401, 406)
    assert response["Content-Type"] == PROBLEM_CONTENT_TYPE


def test_missing_csrf_token_has_its_own_code():
    strict = Client(enforce_csrf_checks=True)
    strict.force_login(UserFactory())
    response = strict.post("/api/v1/_test/protected", {}, content_type="application/json")
    body = assert_problem(response, 403, "csrf_failed")
    assert "CSRF Failed" not in body["detail"]


def test_csrf_failure_outside_drf_on_api_paths_is_json():
    strict = Client(enforce_csrf_checks=True)
    response = strict.post(
        "/_allauth/browser/v1/auth/code/request",
        {"phone": "+254712345678"},
        content_type="application/json",
    )
    assert_problem(response, 403, "csrf_failed")


def test_crash_outside_drf_on_api_path_is_json_500_without_details():
    response = Client(raise_request_exception=False).get("/api/v1/_test/crash")
    body = assert_problem(response, 500, "server_error")
    assert "db.internal" not in str(body)


def test_crash_outside_api_paths_is_django_html_500():
    response = Client(raise_request_exception=False).get("/staff-test/crash")
    assert response.status_code == 500
    assert response["Content-Type"].startswith("text/html")
    assert b"db.internal" not in response.content


@override_settings(ALLOWED_HOSTS=["testserver"])
def test_bad_host_on_api_path_is_json_400():
    response = Client().get("/api/v1/health", HTTP_HOST="evil.example")
    assert_problem(response, 400, "bad_request")


def test_health_does_no_cache_or_session_work(client, django_assert_num_queries):
    """API-2 / PERF-2: one query (SELECT 1); no throttle writes to the DB cache."""
    with django_assert_num_queries(1):
        assert client.get("/api/v1/health").status_code == 200


def test_health_is_not_rate_limited(client, monkeypatch):
    from rest_framework.throttling import SimpleRateThrottle

    monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", {"anon": "2/min", "user": "2/min"})
    assert client.get("/api/v1/_test/protected").status_code == 401  # rates patched
    assert [client.get("/api/v1/health").status_code for _ in range(5)] == [200] * 5
