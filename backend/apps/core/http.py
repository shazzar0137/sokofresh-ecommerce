"""Outbound HTTP clients for third-party APIs (ADR-0010: httpx only).

Every call to an outside service (Africa's Talking, Daraja sandbox, Google,
later Pesapal) goes through `outbound_client()`, which:

- only allows hosts listed in settings.OUTBOUND_HTTP_ALLOWED_HOSTS (protection
  against server-side request forgery: a URL from user input or a bad config
  value cannot make the server call an unexpected host);
- requires HTTPS;
- always sets a timeout, so a slow provider cannot hang a request;
- never follows redirects to other hosts.

Tests mock these calls with respx.
"""

from urllib.parse import urlsplit

import httpx
from django.conf import settings


class OutboundHostNotAllowed(Exception):
    """Raised when code tries to call a host that is not on the allow list."""


def _check_allowed(url: httpx.URL) -> None:
    allowed = set(settings.OUTBOUND_HTTP_ALLOWED_HOSTS)
    if url.scheme != "https":
        raise OutboundHostNotAllowed(f"Only HTTPS is allowed (got {url.scheme!r}).")
    if url.host not in allowed:
        raise OutboundHostNotAllowed(f"Host {url.host!r} is not in OUTBOUND_HTTP_ALLOWED_HOSTS.")


def _enforce_allow_list(request: httpx.Request) -> None:
    _check_allowed(request.url)


def outbound_client(base_url: str, *, timeout: float | None = None, **kwargs) -> httpx.Client:
    """Create an httpx.Client for one provider. Use it as a context manager."""
    host = urlsplit(base_url).hostname
    _check_allowed(httpx.URL(base_url))
    if not host:
        raise OutboundHostNotAllowed("A base URL with a host name is required.")
    return httpx.Client(
        base_url=base_url,
        timeout=timeout if timeout is not None else settings.OUTBOUND_HTTP_TIMEOUT_SECONDS,
        follow_redirects=False,
        headers={"User-Agent": "SokoFresh-backend/0.1"},
        event_hooks={"request": [_enforce_allow_list]},
        **kwargs,
    )
