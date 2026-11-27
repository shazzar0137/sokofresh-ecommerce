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
    "DJANGO_TRUSTED_PROXY_COUNT": "1",
    "DJANGO_CSRF_TRUSTED_ORIGINS": "https://www.sokofresh.example",
    "DJANGO_ACCEPT_ADMIN_WITHOUT_MFA": "true",
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
    installed = [a for a in settings.INSTALLED_APPS if a.startswith("apps.") and a.count(".") == 1]
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
        ({"DJANGO_SECRET_KEY": "short"}, "DJANGO_SECRET_KEY must be"),
        ({"DJANGO_SECRET_KEY": "dev-only-" + "x" * 60}, "DJANGO_SECRET_KEY must be"),
        ({"DJANGO_SECRET_KEY": "a" * 60}, "DJANGO_SECRET_KEY must be"),
        ({"DJANGO_SECRET_KEY": "django-insecure-" + "abcdef123" * 6}, "DJANGO_SECRET_KEY must be"),
        ({"DJANGO_ALLOWED_HOSTS": ""}, "DJANGO_ALLOWED_HOSTS must list"),
        ({"DJANGO_ADMIN_URL": "admin/"}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": ""}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": "admin"}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": "/admin"}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": "Admin/"}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": "admin//"}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": "staff-admin/"}, "DJANGO_ADMIN_URL must be"),
        ({"DJANGO_ADMIN_URL": "staff-test-path"}, "DJANGO_ADMIN_URL must be"),
        (
            {"SMS_BACKEND": "apps.notifications.sms.ConsoleSmsBackend"},
            "Development SMS backends cannot be used in production",
        ),
        (
            {"SMS_BACKEND": "apps.notifications.sms.ConsoleSmsBackend "},
            "Development SMS backends cannot be used in production",
        ),
        (
            {"SMS_BACKEND": "apps.notifications.sms.LocMemSmsBackend"},
            "Development SMS backends cannot be used in production",
        ),
        ({"SMS_BACKEND": "apps.nowhere.Backend"}, "SMS_BACKEND cannot be imported"),
        (
            {"SMS_BACKEND": " apps.notifications.sms.ConsoleSmsBackend"},
            "Development SMS backends cannot be used in production",
        ),
        ({"DJANGO_SECRET_KEY": "Django-Insecure-" + "abcdef123" * 6}, "DJANGO_SECRET_KEY must be"),
        ({"DJANGO_TRUSTED_PROXY_COUNT": "-1"}, "DJANGO_TRUSTED_PROXY_COUNT must be 0 or more"),
        ({"DJANGO_CSRF_TRUSTED_ORIGINS": ""}, "DJANGO_CSRF_TRUSTED_ORIGINS must list"),
        (
            {"DJANGO_CSRF_TRUSTED_ORIGINS": "http://www.sokofresh.example"},
            "DJANGO_CSRF_TRUSTED_ORIGINS must list",
        ),
        (
            {"DJANGO_CSRF_TRUSTED_ORIGINS": "https://www.sokofresh.example/"},
            "DJANGO_CSRF_TRUSTED_ORIGINS must list",
        ),
        (
            {"DJANGO_CSRF_TRUSTED_ORIGINS": "https://*.sokofresh.example"},
            "DJANGO_CSRF_TRUSTED_ORIGINS must list",
        ),
        (
            {"DJANGO_CSRF_TRUSTED_ORIGINS": "https://www.sokofresh.example,http://evil.example"},
            "DJANGO_CSRF_TRUSTED_ORIGINS must list",
        ),
        # BSEC-6 / ARC-9: values the first regex accepted.
        *[
            ({"DJANGO_CSRF_TRUSTED_ORIGINS": bad}, "DJANGO_CSRF_TRUSTED_ORIGINS must list")
            for bad in (
                "https://.",
                "https://-",
                "https://localhost",
                "https://www.sokofresh.example:99999",
                "https://www.sokofresh.example:443",
                "https://www.sokofresh.example:0",
                "https://WWW.sokofresh.example",
                "https://user@www.sokofresh.example",
                "https://www.sokofresh.example?x=1",
                "https://www.sokofresh.example#x",
                "https://-www.sokofresh.example",
                "https://www..sokofresh.example",
                "https://www.sokofresh.example:",  # RR-3: empty port
                "https://www.sokofresh.example:08443",  # RR-3: padded port
                "https://10.0.0.1",  # IP address, not the storefront name
                "https://1.1",
            )
        ],
        # BSEC-4: no wildcard hosts.
        ({"DJANGO_ALLOWED_HOSTS": "*"}, "DJANGO_ALLOWED_HOSTS must list exact host names"),
        (
            {"DJANGO_ALLOWED_HOSTS": "api.sokofresh.example,.sokofresh.example"},
            "DJANGO_ALLOWED_HOSTS must list exact host names",
        ),
        ({"DJANGO_ALLOWED_HOSTS": " , "}, "DJANGO_ALLOWED_HOSTS must list"),
        (
            {"DJANGO_ALLOWED_HOSTS": "*.sokofresh.example"},
            "DJANGO_ALLOWED_HOSTS must list exact host names",
        ),
        # BSEC-1: no password-only admin unless the owner accepts it.
        ({"DJANGO_ACCEPT_ADMIN_WITHOUT_MFA": "false"}, "DJANGO_ACCEPT_ADMIN_WITHOUT_MFA"),
        ({"DJANGO_ACCEPT_ADMIN_WITHOUT_MFA": ""}, "DJANGO_ACCEPT_ADMIN_WITHOUT_MFA"),
    ],
)
def test_production_refuses_unsafe_configuration(override, message):
    result = run_manage("check", env_overrides={**PROD_ENV, **override})
    assert result.returncode != 0
    assert message in result.stderr


def test_production_requires_the_trusted_proxy_count():
    env = {k: v for k, v in PROD_ENV.items() if k != "DJANGO_TRUSTED_PROXY_COUNT"}
    result = run_manage("check", env_overrides=env)
    assert result.returncode != 0
    assert "DJANGO_TRUSTED_PROXY_COUNT" in result.stderr


def test_production_requires_the_storefront_csrf_origin():
    env = {k: v for k, v in PROD_ENV.items() if k != "DJANGO_CSRF_TRUSTED_ORIGINS"}
    result = run_manage("check", env_overrides=env)
    assert result.returncode != 0
    assert "DJANGO_CSRF_TRUSTED_ORIGINS" in result.stderr


@pytest.mark.parametrize(
    "origins",
    [
        "https://www.sokofresh.example:8443",
        " https://www.sokofresh.example , https://sokofresh.example ",
        "https://shop-1.sokofresh.co.ke",
    ],
)
def test_production_accepts_valid_storefront_origins(origins):
    result = run_manage("check", env_overrides={**PROD_ENV, "DJANGO_CSRF_TRUSTED_ORIGINS": origins})
    assert result.returncode == 0, result.stderr


def test_production_requires_the_admin_mfa_risk_acceptance():
    env = {k: v for k, v in PROD_ENV.items() if k != "DJANGO_ACCEPT_ADMIN_WITHOUT_MFA"}
    result = run_manage("check", env_overrides=env)
    assert result.returncode != 0
    assert "MFA, D-031" in result.stderr


def test_production_refuses_to_start_without_a_secret_key():
    env = {k: v for k, v in PROD_ENV.items() if k != "DJANGO_SECRET_KEY"}
    result = run_manage("check", env_overrides=env)
    assert result.returncode != 0
    assert "DJANGO_SECRET_KEY" in result.stderr


def test_production_cookies_and_https():
    script = (
        "import django; django.setup(); from django.conf import settings as s; "
        "print(s.SESSION_COOKIE_SECURE, s.CSRF_COOKIE_SECURE, s.SECURE_SSL_REDIRECT, "
        "s.SECURE_HSTS_SECONDS > 0, s.DEBUG, s.API_DOCS_ENABLED, "
        "s.SECURE_PROXY_SSL_HEADER == ('HTTP_X_FORWARDED_PROTO', 'https'), "
        "s.REST_FRAMEWORK['NUM_PROXIES'] == s.ALLAUTH_TRUSTED_PROXY_COUNT == 1)"
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
    assert result.stdout.split() == [
        "True",
        "True",
        "True",
        "True",
        "False",
        "False",
        "True",
        "True",
    ], result.stderr


def test_env_file_values_win_over_development_defaults(tmp_path, monkeypatch):
    """ARCH-4: backend/.env is read before dev/test defaults are applied."""
    from config.settings._env import load_env_file

    env_file = tmp_path / ".env"
    env_file.write_text("SOKOFRESH_TEST_ONLY_VAR=from-env-file\nPATH_UNCHANGED=x\n")
    monkeypatch.delenv("SOKOFRESH_TEST_ONLY_VAR", raising=False)
    monkeypatch.setenv("PATH_UNCHANGED", "real-environment")
    load_env_file(env_file)
    assert os.environ["SOKOFRESH_TEST_ONLY_VAR"] == "from-env-file"
    assert os.environ["PATH_UNCHANGED"] == "real-environment"  # real env still wins
    monkeypatch.delenv("SOKOFRESH_TEST_ONLY_VAR")


def test_dev_and_test_settings_read_env_file_before_defaults():
    """RQA-3 / ARCH-4: the _env import comes before any os.environ.setdefault."""
    for name in ("dev.py", "test.py"):
        source = (BACKEND_DIR / "config" / "settings" / name).read_text()
        assert source.index("from . import _env") < source.index("os.environ.setdefault")
    base = (BACKEND_DIR / "config" / "settings" / "base.py").read_text()
    assert "read_env" not in base  # production never reads a .env file
