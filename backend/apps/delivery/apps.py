"""Zones, slots, GeoService, delivery partner and rider assignment."""

from django.apps import AppConfig


class DeliveryConfig(AppConfig):
    name = "apps.delivery"
    label = "delivery"
    verbose_name = "Delivery"
    default_auto_field = "django.db.models.BigAutoField"
