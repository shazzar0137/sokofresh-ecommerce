"""Server basket for every visitor."""

from django.apps import AppConfig


class BasketConfig(AppConfig):
    name = "apps.basket"
    label = "basket"
    verbose_name = "Basket"
    default_auto_field = "django.db.models.BigAutoField"
