"""Health check and JSON error pages."""

import logging

from django.db import DatabaseError, connection
from django.http import HttpRequest, HttpResponse, JsonResponse
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import PROBLEM_CONTENT_TYPE, problem

logger = logging.getLogger("apps.core.health")


class HealthView(APIView):
    """Liveness and database check for the hosting platform. Returns no business data."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    @extend_schema(
        operation_id="health_retrieve",
        summary="Service health",
        tags=["health"],
        responses={
            200: inline_serializer(
                name="Health",
                fields={
                    "status": serializers.ChoiceField(choices=["ok"]),
                    "database": serializers.ChoiceField(choices=["ok"]),
                },
            )
        },
    )
    def get(self, request: Request) -> Response:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            logger.exception("Health check: database unavailable")
            response = Response(
                problem(503, "service_unavailable", "The service is temporarily unavailable."),
                status=503,
            )
            response.content_type = PROBLEM_CONTENT_TYPE
            return response
        return Response({"status": "ok", "database": "ok"})


def _problem_json(status_code: int, code: str, detail: str) -> HttpResponse:
    return JsonResponse(
        problem(status_code, code, detail), status=status_code, content_type=PROBLEM_CONTENT_TYPE
    )


def not_found(request: HttpRequest, exception: Exception | None = None) -> HttpResponse:
    """404 for URLs that match no route (DEBUG=False only)."""
    return _problem_json(404, "not_found", "The requested resource was not found.")


def server_error(request: HttpRequest) -> HttpResponse:
    """500 for errors outside DRF views. Details are logged, never shown."""
    return _problem_json(500, "server_error", "An unexpected error occurred. Please try again.")
