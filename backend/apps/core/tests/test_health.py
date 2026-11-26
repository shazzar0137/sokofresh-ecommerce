"""GET /api/v1/health: used by the hosting platform and CI smoke checks."""

import pytest
from django.db import OperationalError

pytestmark = pytest.mark.django_db


def test_health_is_public_and_checks_the_database(api_client):
    response = api_client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
    assert "sessionid" not in response.cookies


def test_health_reports_503_when_database_is_down(api_client, monkeypatch):
    from apps.core import views

    def broken_cursor(*args, **kwargs):
        raise OperationalError("connection refused to db.internal:5432")

    monkeypatch.setattr(views.connection, "cursor", broken_cursor)
    response = api_client.get("/api/v1/health")
    assert response.status_code == 503
    body = response.json()
    assert body["code"] == "service_unavailable"
    assert "db.internal" not in str(body)
