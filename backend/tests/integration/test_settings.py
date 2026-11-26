"""Configuration: the right apps, safe defaults, and production refusing unsafe values."""

import os
import subprocess
import sys
from pathlib import Path

import pytest
from django.conf import settings

BACKEND_DIR = Path(__file__).resolve().parents[2]

TEN_APPS = [
    "apps.core",
    "apps.accounts",
    "apps.catalogue",
    "apps.inventory",
    "apps.basket",
    "apps.orders",
    "apps.payments",
    "apps.delivery",
    "apps.notifications",
    "apps.store",
]

# A complete, valid production configuration (fake values; nothing real).
PROD_ENV = {
    "DJANGO_SETTINGS_MODULE": "config.settings.prod",
    "DJANGO_SECRET_KEY": "x" * 20 + "prod-like-random-value-for-tests-only" + "y" * 20,
    "DJANGO_ALLOWED_HOSTS": "api.sokofresh.example",
    "DJANGO_ADMIN_URL": "staff-test-path/",
    "DATABASE_URL": "postgres://u:p@localhost:5432/unused",
}


def run_manage(*args: str, env_overrides: dict[str, str]) -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items() if not k.startswith(("DJANGO_", "SMS_"))}
    env.update(env_overrides)
    return subprocess.run(  # noqa: S603 - fixed arguments, test only
        [sys.executable, "manage.py", *args],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )


def test_the_ten_apps_are_installed_in_order():
    installed = [a for a in settings.INSTALLED_APPS if a.startswith("apps.")]
    assert installed == TEN_APPS


def test_core_security_defaults():
    assert settings.AUTH_USER_MODEL == "accounts.User"
    assert settings.DEBUG is False
    assert settings.SESSION_COOKIE_HTTPONLY is True
    assert settings.SESSION_COOKIE_SAMESITE == "Lax"
    assert settings.X_FRAME_OPTIONS == "DENY"
    assert settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] == [
        "rest_framework.permissions.IsAuthenticated"
    ]
    assert settings.HEADLESS_ONLY is True
    assert settings.ACCOUNT_LOGIN_METHODS == {"phone"}


def test_tests_use_postgresql():
    assert settings.DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql"


def test_production_settings_pass_the_deploy_checklist():
    result = run_manage("check", "--deploy", "--fail-level", "WARNING", env_overrides=PROD_ENV)
    assert result.returncode == 0, result.stdout + result.stderr


@pytest.mark.parametrize(
    ("override", "message"),
    [
        ({"DJANGO_SECRET_KEY": "short"}, "DJANGO_SECRET_KEY"),
        ({"DJANGO_SECRET_KEY": "dev-only-" + "x" * 60}, "DJANGO_SECRET_KEY"),
        ({"DJANGO_ALLOWED_HOSTS": ""}, "DJANGO_ALLOWED_HOSTS"),
        ({"DJANGO_ADMIN_URL": "admin/"}, "DJANGO_ADMIN_URL"),
        ({"SMS_BACKEND": "apps.notifications.sms.ConsoleSmsBackend"}, "SMS"),
    ],
)
def test_production_refuses_unsafe_configuration(override, message):
    result = run_manage("check", env_overrides={**PROD_ENV, **override})
    assert result.returncode != 0
    assert message in result.stderr


def test_production_refuses_to_start_without_a_secret_key():
    env = {k: v for k, v in PROD_ENV.items() if k != "DJANGO_SECRET_KEY"}
    result = run_manage("check", env_overrides=env)
    assert result.returncode != 0
    assert "DJANGO_SECRET_KEY" in result.stderr


def test_production_cookies_and_https():
    script = (
        "import django; django.setup(); from django.conf import settings as s; "
        "print(s.SESSION_COOKIE_SECURE, s.CSRF_COOKIE_SECURE, s.SECURE_SSL_REDIRECT, "
        "s.SECURE_HSTS_SECONDS > 0, s.DEBUG, s.API_DOCS_ENABLED)"
    )
    env = {k: v for k, v in os.environ.items() if not k.startswith(("DJANGO_", "SMS_"))}
    env.update(PROD_ENV)
    result = subprocess.run(  # noqa: S603
        [sys.executable, "-c", script],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.stdout.split() == ["True", "True", "True", "True", "False", "False"], (
        result.stderr
    )
