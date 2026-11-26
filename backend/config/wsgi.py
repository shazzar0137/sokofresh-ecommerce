"""WSGI entry point. Servers must set DJANGO_SETTINGS_MODULE=config.settings.prod."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_wsgi_application()
