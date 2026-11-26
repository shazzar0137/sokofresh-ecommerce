"""Settings shared by every environment.

Environment-specific files (dev.py, test.py, prod.py) import everything from here
and override only what differs. Secrets and anything that changes between
environments come from environment variables (django-environ, ADR-0010); nothing
secret is written in this file.
"""

from pathlib import Path

import environ
from django.utils.csp import CSP

# backend/ (the folder that holds manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Repository root (one level above backend/)
REPO_DIR = BASE_DIR.parent

env = environ.Env()

# A local backend/.env file is read only when present (development). Hosting
# platforms set real environment variables instead; .env is git-ignored.
ENV_FILE = BASE_DIR / ".env"
if ENV_FILE.is_file():
    environ.Env.read_env(ENV_FILE)

# --- Core -------------------------------------------------------------------

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = False
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party (ADR-0002, 0004, 0005, 0010)
    "rest_framework",
    "drf_spectacular",
    "allauth",
    "allauth.account",
    "allauth.headless",
    "django_tasks_db",
    # SokoFresh apps (ADR-0011 item 4: ten apps, one modular monolith)
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

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.csp.ContentSecurityPolicyMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- Database (ADR-0003: PostgreSQL; Neon in development) ---------------------

# Example: postgres://user:password@host:5432/dbname?sslmode=require
DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DATABASE_CONN_MAX_AGE", default=60)
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True
# Set when DATABASE_URL points at a transaction-mode pooler (Neon "-pooler" host):
# server-side cursors do not work through PgBouncer in transaction mode.
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = env.bool(
    "DATABASE_TRANSACTION_POOLER", default=False
)

# Shared cache (rate limits for allauth and DRF need one cache for all
# processes). Database cache: no Redis needed (ADR-0010). Create the table with
# `manage.py createcachetable` at deploy time.
# The table is created by migration core.0001. Django's default limit (300
# entries) let a burst of throttle keys evict the sign-in rate-limit counters
# (review findings PERF-1 / DB-2), so the limit is set far above expected use.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "sokofresh_cache",
        "OPTIONS": {"MAX_ENTRIES": 1_000_000, "CULL_FREQUENCY": 4},
    }
}

# Number of trusted reverse proxies in front of Django (Cloudflare, the host's
# load balancer). Rate limits read the client IP from X-Forwarded-For only past
# this many proxies; with 0 the header is ignored, so it cannot be spoofed.
TRUSTED_PROXY_COUNT = env.int("DJANGO_TRUSTED_PROXY_COUNT", default=0)
ALLAUTH_TRUSTED_PROXY_COUNT = TRUSTED_PROXY_COUNT

# --- Users, authentication and sessions (ADR-0005) ----------------------------

AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Staff passwords (customers sign in with phone + code and have no password).
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14  # 14 days
# The frontend reads the CSRF cookie and sends it back as a header (allauth
# headless browser flow), so this cookie cannot be HttpOnly.
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS: list[str] = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])
CSRF_FAILURE_VIEW = "apps.core.views.csrf_failure"

# django-allauth: phone number + one-time code, headless browser client only.
ACCOUNT_ADAPTER = "apps.accounts.adapter.AccountAdapter"
ACCOUNT_LOGIN_METHODS = {"phone"}
ACCOUNT_SIGNUP_FIELDS = ["phone*"]
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USER_MODEL_EMAIL_FIELD = None
ACCOUNT_LOGIN_BY_CODE_ENABLED = True
ACCOUNT_LOGIN_BY_CODE_TIMEOUT = 5 * 60
ACCOUNT_LOGIN_BY_CODE_MAX_ATTEMPTS = 3
ACCOUNT_LOGIN_BY_CODE_FORMAT = {"numeric": True, "length": 6, "dashed": False}
ACCOUNT_PHONE_VERIFICATION_ENABLED = True
ACCOUNT_PHONE_VERIFICATION_CODE_FORMAT = {"numeric": True, "length": 6, "dashed": False}
ACCOUNT_PHONE_VERIFICATION_TIMEOUT = 5 * 60  # same as login codes (the SMS text says so)
# Sign-up opens in Phase 5 (account creation at checkout, ADR-0011 item 5).
ACCOUNT_SIGNUP_OPEN = False
ACCOUNT_PREVENT_ENUMERATION = True
# Tighter than allauth's defaults for SMS codes (each code costs money and is a
# target for SMS-pumping fraud). The per-IP limit stays generous because many
# Kenyan mobile users share carrier IP addresses. Turnstile is added in Phase 5.
ACCOUNT_RATE_LIMITS = {
    "request_login_code": "30/m/ip,3/10m/key,10/d/key",
    "login": "30/m/ip",
    "change_phone": "1/m/user,3/d/user",
}
HEADLESS_ONLY = True
HEADLESS_CLIENTS = ("browser",)
HEADLESS_SERVE_SPECIFICATION = False

# --- API (ADR-0004) --------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # Session cookie set by allauth; DRF enforces CSRF for authenticated
        # session requests.
        "apps.core.authentication.SessionAuthentication",
    ],
    # Deny by default: each public endpoint opts in with AllowAny.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.problem_details_exception_handler",
    # Must match TRUSTED_PROXY_COUNT (None would make DRF trust any X-Forwarded-For).
    "NUM_PROXIES": TRUSTED_PROXY_COUNT,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "120/min", "user": "240/min"},
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SokoFresh API",
    "DESCRIPTION": (
        "REST API for the SokoFresh storefront and rider screens. Generated from the "
        "Django code by drf-spectacular; do not edit the generated file by hand. "
        "Sign-in endpoints are provided by django-allauth headless under /_allauth/ "
        "and are documented by allauth, not in this file."
    ),
    "VERSION": "0.1.0",
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {"HealthStatusEnum": ["ok"]},
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
        "apps.core.openapi.add_problem_details_responses",
    ],
}

# --- Background tasks (Django 6 Tasks + django-tasks-db, ADR-0010) -------------

TASKS = {"default": {"BACKEND": "django_tasks_db.DatabaseBackend"}}

# --- Notifications ---------------------------------------------------------------

# Dotted path of the SMS backend. Production refuses development backends
# (see prod.py). The Africa's Talking backend arrives in Phase 5.
SMS_BACKEND = env("SMS_BACKEND", default="apps.notifications.sms.DisabledSmsBackend")

# --- Outbound HTTP (SSRF protection: only these hosts may be called) -----------

OUTBOUND_HTTP_ALLOWED_HOSTS: list[str] = env.list("OUTBOUND_HTTP_ALLOWED_HOSTS", default=[])
OUTBOUND_HTTP_TIMEOUT_SECONDS = env.float("OUTBOUND_HTTP_TIMEOUT_SECONDS", default=10.0)

# --- Security headers --------------------------------------------------------------

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# Content Security Policy for responses Django serves (API JSON and Django admin).
# The storefront's own CSP is set by Next.js (risk R-9).
SECURE_CSP = {
    "default-src": [CSP.SELF],
    "img-src": [CSP.SELF, "data:"],
    "object-src": [CSP.NONE],
    "base-uri": [CSP.SELF],
    "frame-ancestors": [CSP.NONE],
    "form-action": [CSP.SELF],
}

# Django admin lives at a non-default path (ADR-0008, proposal §7).
ADMIN_URL = env("DJANGO_ADMIN_URL", default="admin/")

# Interactive API docs (Swagger UI) are served only where a settings file enables them.
API_DOCS_ENABLED = False

# --- Internationalisation -------------------------------------------------------

LANGUAGE_CODE = "en"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

# --- Static files (Django admin) ------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Logging ---------------------------------------------------------------------

LOG_LEVEL = env("DJANGO_LOG_LEVEL", default="INFO")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        # Masks phone numbers and one-time codes before anything is written.
        "redact_personal_data": {"()": "apps.core.logging.RedactPersonalDataFilter"},
    },
    "formatters": {
        # Redacts the complete output, including tracebacks.
        "standard": {
            "()": "apps.core.logging.RedactingFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "filters": ["redact_personal_data"],
        },
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "apps": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
        # Outbound request URLs can carry tokens; log them only on problems.
        "httpx": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "httpcore": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
