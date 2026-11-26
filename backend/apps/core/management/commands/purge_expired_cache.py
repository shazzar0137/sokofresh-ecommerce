"""Delete expired rows from the database cache table.

Django's database cache removes expired rows only when the table is over its
size limit, so without this job expired rate-limit rows pile up (re-review
finding RQA-2). Run it from host cron, e.g. hourly (ADR-0011 item 9):

    uv run python manage.py purge_expired_cache
"""

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connections, router
from django.utils import timezone


class Command(BaseCommand):
    help = "Delete expired rows from every database cache table."

    def handle(self, *args, **options) -> None:
        total = 0
        for alias, config in settings.CACHES.items():
            if config["BACKEND"] != "django.core.cache.backends.db.DatabaseCache":
                continue
            table = config["LOCATION"]
            db = router.db_for_write(None) or "default"
            connection = connections[db]
            quoted = connection.ops.quote_name(table)
            with connection.cursor() as cursor:
                # Table name comes from settings and is quoted; the time is a parameter.
                sql = f"DELETE FROM {quoted} WHERE expires < %s"  # noqa: S608
                cursor.execute(sql, [timezone.now()])
                deleted = cursor.rowcount
            total += deleted
            self.stdout.write(f"{alias}: {deleted} expired rows deleted")
        self.stdout.write(self.style.SUCCESS(f"Done: {total} expired rows deleted"))
