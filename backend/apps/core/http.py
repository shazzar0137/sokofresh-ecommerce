"""Outbound HTTP clients for third-party APIs (ADR-0010: httpx only).

Every call to an outside service (Africa's Talking, Daraja sandbox, Google,
later Pesapal) goes through `outbound_client()`, which:

- only allows host names listed in settings.OUTBOUND_HTTP_ALLOWED_HOSTS
  (case-insensitive), on port 443 unless an entry names another port
  ("host:8443"), protecting against server-side request forgery;
- requires HTTPS;
- always sets a timeout, so a slow provider cannot hang a request;
- never follows redirects.

Tests mock these calls with respx.
"""

import httpx
from django.conf import settings

DEFAULT_HEADERS = {"User-Agent": "SokoFresh-backend/0.1"}
_FORBIDDEN_KWARGS = {"follow_redirects", "event_hooks", "transport", "mounts", "base_url"}


class OutboundHostNotAllowed(Exception):
    """Raised when code tries to call a host that is not on the allow list."""


def _allowed() -> set[tuple[str, int]]:
    pairs = set()
    for entry in settings.OUTBOUND_HTTP_ALLOWED_HOSTS:
        host, _, port = entry.strip().lower().partition(":")
        pairs.add((host, int(port) if port else 443))
    return pairs


def _check_allowed(url: httpx.URL) -> None:
    if url.scheme != "https":
        raise OutboundHostNotAllowed(f"Only HTTPS is allowed (got {url.scheme!r}).")
    port = url.port or 443
    if (url.host.lower(), port) not in _allowed():
        raise OutboundHostNotAllowed(f"{url.host}:{port} is not in OUTBOUND_HTTP_ALLOWED_HOSTS.")


def _enforce_allow_list(request: httpx.Request) -> None:
    _check_allowed(request.url)


def outbound_client(
    base_url: str,
    *,
    timeout: float | None = None,
    headers: dict[str, str] | None = None,
    **kwargs,
) -> httpx.Client:
    """Create an httpx.Client for one provider. Use it as a context manager.

    `headers` are added to the defaults (e.g. a provider's API-key header).
    Redirect, hook, transport and base-URL overrides are refused, because they
    would weaken the rules above.
    """
    refused = _FORBIDDEN_KWARGS & kwargs.keys()
    if refused:
        raise TypeError(f"outbound_client() does not allow overriding: {sorted(refused)}")
    _check_allowed(httpx.URL(base_url))
    return httpx.Client(
        base_url=base_url,
        timeout=timeout if timeout is not None else settings.OUTBOUND_HTTP_TIMEOUT_SECONDS,
        follow_redirects=False,
        headers={**DEFAULT_HEADERS, **(headers or {})},
        event_hooks={"request": [_enforce_allow_list]},
        **kwargs,
    )
