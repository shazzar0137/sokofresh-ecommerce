"""Create the database cache table (rate-limit counters) as part of `migrate`.

Previously a manual `createcachetable` step; forgetting it made every
rate-limited sign-in request fail (review finding DB-5).
"""

from django.core.management import call_command
from django.db import migrations


def create_cache_table(apps, schema_editor):
    call_command("createcachetable", database=schema_editor.connection.alias, verbosity=0)


class Migration(migrations.Migration):
    dependencies: list = []

    operations = [migrations.RunPython(create_cache_table, migrations.RunPython.noop)]
