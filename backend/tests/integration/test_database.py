"""Database connectivity, migrations and the background-task table."""

import pytest
from django.core.management import call_command
from django.db import connection
from django.tasks import task
from django.test import override_settings

pytestmark = pytest.mark.django_db


def test_connected_to_postgresql_16_or_newer():
    assert connection.vendor == "postgresql"
    assert connection.pg_version >= 160000


def test_time_zone_is_utc_in_the_database_and_nairobi_for_display():
    from django.conf import settings

    with connection.cursor() as cursor:
        cursor.execute("SHOW TIME ZONE")
        assert cursor.fetchone()[0] == "UTC"
    assert settings.TIME_ZONE == "Africa/Nairobi" and settings.USE_TZ


def test_models_and_migrations_are_in_sync():
    # Fails if a model was changed without creating a migration.
    call_command("makemigrations", "--check", "--dry-run", verbosity=0)


@task()
def add(a: int, b: int) -> int:
    return a + b


@override_settings(TASKS={"default": {"BACKEND": "django_tasks_db.DatabaseBackend"}})
def test_tasks_are_queued_in_the_database():
    from django_tasks_db.models import DBTaskResult

    result = add.enqueue(2, 3)
    stored = DBTaskResult.objects.get(id=result.id)
    assert stored.status == "READY"
    assert stored.args_kwargs == {"args": [2, 3], "kwargs": {}}
