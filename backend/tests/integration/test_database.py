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


def test_cache_table_migration_creates_the_table():
    """RQA-3 / DB-5: the migration itself (not test setup) creates the cache table."""
    import importlib

    from django.db import connection

    migration = importlib.import_module("apps.core.migrations.0001_create_cache_table")
    with connection.cursor() as cursor:
        cursor.execute("DROP TABLE sokofresh_cache")
    assert "sokofresh_cache" not in connection.introspection.table_names()
    with connection.schema_editor() as editor:
        migration.create_cache_table(None, editor)
    assert "sokofresh_cache" in connection.introspection.table_names()


def test_purge_expired_cache_command():
    """RQA-2: expired rows are removed; live ones are kept."""
    import datetime
    from io import StringIO

    from django.core.cache import cache
    from django.utils import timezone

    cache.set("live", 1, 600)
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO sokofresh_cache (cache_key, value, expires) VALUES (%s, %s, %s)",
            [":1:old", "x", timezone.now() - datetime.timedelta(hours=1)],
        )
    out = StringIO()
    call_command("purge_expired_cache", stdout=out)
    assert out.getvalue().splitlines() == [
        "default: 1 expired rows deleted",
        "Done: 1 expired rows deleted",
    ]
    with connection.cursor() as cursor:
        cursor.execute("SELECT cache_key FROM sokofresh_cache WHERE cache_key = ':1:old'")
        assert cursor.fetchall() == []
    assert cache.get("live") == 1
