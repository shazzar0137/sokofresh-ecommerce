"""Categories, products, sources (farms/suppliers), images, meal kits."""

from django.apps import AppConfig


class CatalogueConfig(AppConfig):
    name = "apps.catalogue"
    label = "catalogue"
    verbose_name = "Catalogue"
    default_auto_field = "django.db.models.BigAutoField"
