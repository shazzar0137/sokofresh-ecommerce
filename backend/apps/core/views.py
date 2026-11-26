"""Health check and JSON error pages."""

import logging

from django.db import DatabaseError, connection
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views import defaults
from django.views.csrf import csrf_failure as django_csrf_failure
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import PROBLEM_CONTENT_TYPE, problem, problem_response

logger = logging.getLogger("apps.core.health")

# Paths whose errors are JSON (API clients). Everything else, such as Django
# admin, keeps Django's normal HTML error pages (review finding ARCH-8).
JSON_ERROR_PREFIXES = ("/api/", "/_allauth/")


class HealthView(APIView):
    """Liveness and database check for the hosting platform. Returns no business data."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    # Not rate limited: throttles use the database cache, which would turn a
    # database outage into a 500 instead of this view's 503 (finding API-2), and
    # would add cache writes to every probe (PERF-2).
    throttle_classes: list = []

    @extend_schema(
        operation_id="health_retrieve",
        summary="Service health",
        tags=["health"],
        responses={
            200: OpenApiResponse(
                description="The service and its database are reachable.",
                response=inline_serializer(
                    name="Health",
                    fields={
                        "status": serializers.ChoiceField(choices=["ok"]),
                        "database": serializers.ChoiceField(choices=["ok"]),
                    },
                ),
            ),
        },
    )
    def get(self, request: Request) -> Response:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            logger.exception("Health check: database unavailable")
            return problem_response(
                503, "service_unavailable", "The service is temporarily unavailable."
            )
        return Response({"status": "ok", "database": "ok"})


def _wants_json(request: HttpRequest) -> bool:
    return request.path.startswith(JSON_ERROR_PREFIXES)


def _problem_json(status_code: int, code: str, detail: str) -> HttpResponse:
    return JsonResponse(
        problem(status_code, code, detail), status=status_code, content_type=PROBLEM_CONTENT_TYPE
    )


def bad_request(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    """400 raised outside DRF (e.g. a bad Host header)."""
    if _wants_json(request):
        return _problem_json(400, "bad_request", "The request could not be processed.")
    return defaults.bad_request(request, exception)


def permission_denied(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    if _wants_json(request):
        return _problem_json(403, "permission_denied", "You are not allowed to do this.")
    return defaults.permission_denied(request, exception)


def not_found(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    """404 for URLs that match no route (DEBUG=False only)."""
    if _wants_json(request):
        return _problem_json(404, "not_found", "The requested resource was not found.")
    return defaults.page_not_found(request, exception)


def server_error(request: HttpRequest) -> HttpResponse:
    """500 for errors outside DRF views. Details are logged, never shown."""
    if _wants_json(request):
        return _problem_json(500, "server_error", "An unexpected error occurred. Please try again.")
    return defaults.server_error(request)


def csrf_failure(request: HttpRequest, reason: str = "") -> HttpResponse:
    """CSRF failures outside DRF (e.g. allauth sign-in) on API paths are JSON."""
    if _wants_json(request):
        return _problem_json(403, "csrf_failed", "Send the CSRF token in the X-CSRFToken header.")
    return django_csrf_failure(request, reason)
