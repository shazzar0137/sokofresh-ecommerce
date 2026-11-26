"""Store settings, audit set-up, reports, admin customisation."""

from django.apps import AppConfig


class StoreConfig(AppConfig):
    name = "apps.store"
    label = "store"
    verbose_name = "Store"
    default_auto_field = "django.db.models.BigAutoField"
