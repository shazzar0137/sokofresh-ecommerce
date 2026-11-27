"""RFC 9457 problem-details error format."""

import pytest
from django.http import Http404
from rest_framework import exceptions

from apps.core.exceptions import PROBLEM_CONTENT_TYPE, problem_details_exception_handler

REQUIRED_KEYS = {"type", "title", "status", "detail", "code", "errors"}


def handle(exc):
    response = problem_details_exception_handler(exc, {})
    assert response is not None
    assert response.content_type == PROBLEM_CONTENT_TYPE
    assert set(response.data) == REQUIRED_KEYS
    assert response.data["status"] == response.status_code
    return response


def test_validation_error_is_422_with_flat_field_errors():
    exc = exceptions.ValidationError(
        {
            "phone": ["Enter a valid Kenyan mobile number."],
            "address": {"landmark": ["Ensure this field has no more than 200 characters."]},
            "lines": [{}, {"quantity": ["Must be at least 1."]}],
            "non_field_errors": ["Prices changed."],
        }
    )
    response = handle(exc)
    assert response.status_code == 422
    assert response.data["code"] == "validation_error"
    fields = {e["field"]: e for e in response.data["errors"]}
    assert set(fields) == {"phone", "address.landmark", "lines.1.quantity", None}
    assert fields["phone"]["message"] == "Enter a valid Kenyan mobile number."
    assert fields[None]["message"] == "Prices changed."


@pytest.mark.parametrize(
    ("exc", "status", "code"),
    [
        (exceptions.NotAuthenticated(), 401, "not_authenticated"),
        (exceptions.PermissionDenied(), 403, "permission_denied"),
        (Http404(), 404, "not_found"),
        (exceptions.MethodNotAllowed("POST"), 405, "method_not_allowed"),
        (exceptions.ParseError(), 400, "malformed_request"),
    ],
)
def test_common_errors_map_to_stable_codes(exc, status, code):
    response = handle(exc)
    assert response.status_code == status
    assert response.data["code"] == code
    assert response.data["errors"] == []


def test_throttled_keeps_retry_after_header():
    response = handle(exceptions.Throttled(wait=30))
    assert response.status_code == 429
    assert response.data["code"] == "rate_limited"
    assert response["Retry-After"] == "30"


def test_unexpected_error_reveals_nothing(caplog):
    response = handle(RuntimeError("database password is hunter2"))
    assert response.status_code == 500
    assert response.data["code"] == "server_error"
    assert "hunter2" not in str(response.data)
    assert "Unhandled API error" in caplog.text


def test_unknown_api_url_returns_problem_json(client):
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    assert response["Content-Type"] == PROBLEM_CONTENT_TYPE
    assert response.json()["code"] == "not_found"


def test_wrong_method_returns_problem_json(client):
    response = client.post("/api/v1/health", {}, content_type="application/json")
    assert response.status_code == 405
    assert response["Content-Type"] == PROBLEM_CONTENT_TYPE
    assert response.json()["code"] == "method_not_allowed"
