"""One error format for the whole API: RFC 9457 "problem details".

Every error response has `Content-Type: application/problem+json` and a body
like:

    {
      "type": "about:blank",
      "title": "Validation failed",
      "status": 422,
      "detail": "One or more fields are invalid.",
      "code": "validation_error",
      "errors": [{"field": "phone", "code": "invalid", "message": "Enter a valid ..."}]
    }

`code` is a stable, machine-readable value the frontend can switch on. `errors`
lists field problems (empty when there are none).

Decision (ADR-0010 allowed either): a small custom handler instead of
drf-standardized-errors, because that package's default format is not RFC 9457
and adapting both its formatter and its OpenAPI output would be more code than
this module. Recorded in ADR-0014.
"""

import logging
from http import HTTPStatus
from typing import Any

from django.core.exceptions import PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.fields import get_error_detail
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("apps.core.exceptions")

PROBLEM_CONTENT_TYPE = "application/problem+json"

# Validation errors use 422 (the request was understood but its content is invalid).
# 400 stays for malformed requests (e.g. invalid JSON).
_CODE_BY_EXCEPTION: list[tuple[type[Exception], str]] = [
    (exceptions.ValidationError, "validation_error"),
    (exceptions.ParseError, "malformed_request"),
    (exceptions.NotAuthenticated, "not_authenticated"),
    (exceptions.AuthenticationFailed, "authentication_failed"),
    (exceptions.PermissionDenied, "permission_denied"),
    (exceptions.NotFound, "not_found"),
    (exceptions.MethodNotAllowed, "method_not_allowed"),
    (exceptions.NotAcceptable, "not_acceptable"),
    (exceptions.UnsupportedMediaType, "unsupported_media_type"),
    (exceptions.Throttled, "rate_limited"),
]

# Every `code` the API can return. The OpenAPI contract publishes this list as an
# enum, so a new code must be added here (and documented in API.md).
_TITLES = {
    "validation_error": "Validation failed",
    "malformed_request": "Malformed request",
    "not_authenticated": "Sign-in required",
    "authentication_failed": "Sign-in failed",
    "permission_denied": "Not allowed",
    "not_found": "Not found",
    "method_not_allowed": "Method not allowed",
    "not_acceptable": "Not acceptable",
    "unsupported_media_type": "Unsupported media type",
    "rate_limited": "Too many requests",
    "csrf_failed": "Security token missing or invalid",
    "bad_request": "Bad request",
    "service_unavailable": "Service unavailable",
    "error": "Request failed",
    "server_error": "Something went wrong",
}


def problem(
    status_code: int,
    code: str,
    detail: str,
    errors: list[dict[str, Any]] | None = None,
    title: str | None = None,
) -> dict[str, Any]:
    """Build a problem-details body."""
    return {
        "type": "about:blank",
        "title": title or _TITLES.get(code) or HTTPStatus(status_code).phrase,
        "status": status_code,
        "detail": detail,
        "code": code,
        "errors": errors or [],
    }


def problem_response(status_code: int, code: str, detail: str, **kwargs: Any) -> Response:
    response = Response(problem(status_code, code, detail, **kwargs), status=status_code)
    response.content_type = PROBLEM_CONTENT_TYPE
    return response


_NON_FIELD_KEYS = {"non_field_errors", "__all__"}


def _flatten_field_errors(data: Any, field: str | None = None) -> list[dict[str, Any]]:
    """Turn DRF's nested error structure into a flat list of field errors.

    {"address": {"landmark": ["Too long."]}} -> [{"field": "address.landmark", ...}]
    {"lines": [{}, {"quantity": [...]}]}    -> [{"field": "lines.1.quantity", ...}]
    Errors about the whole request get "field": null.
    """
    flat: list[dict[str, Any]] = []
    if isinstance(data, dict):
        for key, value in data.items():
            if key in _NON_FIELD_KEYS:
                child = field
            else:
                child = f"{field}.{key}" if field else str(key)
            flat.extend(_flatten_field_errors(value, child))
    elif isinstance(data, list):
        for index, item in enumerate(data):
            if isinstance(item, (dict, list)):
                child = f"{field}.{index}" if field else str(index)
                flat.extend(_flatten_field_errors(item, child))
            else:
                flat.extend(_flatten_field_errors(item, field))
    else:
        code = getattr(data, "code", None) or "invalid"
        flat.append({"field": field, "code": str(code), "message": str(data)})
    return flat


def _code_for(exc: Exception) -> str:
    for exc_type, code in _CODE_BY_EXCEPTION:
        if isinstance(exc, exc_type):
            return code
    return "error"


PROBLEM_CODES: tuple[str, ...] = tuple(_TITLES)


def problem_details_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """DRF exception handler (settings: REST_FRAMEWORK["EXCEPTION_HANDLER"])."""
    # Convert Django exceptions to DRF ones ourselves, with generic messages:
    # Django's own messages may describe internals (DRF would pass them on).
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()
    elif isinstance(exc, DjangoValidationError):
        # e.g. model.full_clean() inside a view: a field problem, not a crash.
        exc = exceptions.ValidationError(get_error_detail(exc))

    response = drf_exception_handler(exc, context)

    if response is None:
        # Unexpected error: log the details on the server, reveal nothing to the client.
        view = context.get("view")
        logger.exception("Unhandled API error in %s", type(view).__name__ if view else "unknown")
        return problem_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "server_error",
            "An unexpected error occurred. Please try again.",
        )

    code = _code_for(exc)
    errors: list[dict[str, Any]] = []
    if isinstance(exc, exceptions.ValidationError):
        response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        errors = _flatten_field_errors(exc.detail)
        detail = "One or more fields are invalid."
    elif isinstance(exc, exceptions.ParseError):
        # Do not echo the parser's internal message.
        detail = "The request body is not valid JSON."
    elif isinstance(exc, exceptions.PermissionDenied) and str(exc.detail).startswith("CSRF Failed"):
        code = "csrf_failed"
        logger.warning("CSRF check failed: %s", exc.detail)
        detail = "The security check failed. Reload the page and try again."
    else:
        raw = exc.detail if isinstance(exc, exceptions.APIException) else str(exc)
        detail = str(raw) if not isinstance(raw, (dict, list)) else "Request failed."

    response.data = problem(response.status_code, code, detail, errors)
    response.content_type = PROBLEM_CONTENT_TYPE
    return response
