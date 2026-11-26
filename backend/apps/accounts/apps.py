"""Custom user (phone sign-in), roles, addresses, deletion requests, allauth adapter."""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "apps.accounts"
    label = "accounts"
    verbose_name = "Accounts"
    default_auto_field = "django.db.models.BigAutoField"
