"""Outbound HTTP rules: allow list, HTTPS only, timeouts, no redirects (respx mocks)."""

import httpx
import pytest
import respx

from apps.core.http import OutboundHostNotAllowed, outbound_client

ALLOWED = "https://sandbox.example-provider.test"


@respx.mock
def test_allowed_host_can_be_called_with_a_timeout():
    route = respx.get(f"{ALLOWED}/ping").mock(return_value=httpx.Response(200, json={"ok": True}))
    with outbound_client(ALLOWED) as client:
        assert client.timeout.read == 10.0
        response = client.get("/ping")
    assert route.called
    assert response.json() == {"ok": True}


def test_host_not_on_allow_list_is_refused():
    with pytest.raises(OutboundHostNotAllowed):
        outbound_client("https://attacker.example.com")


def test_plain_http_is_refused():
    with pytest.raises(OutboundHostNotAllowed):
        outbound_client("http://sandbox.example-provider.test")


@respx.mock
def test_absolute_url_to_other_host_is_refused_even_with_allowed_base():
    with outbound_client(ALLOWED) as client, pytest.raises(OutboundHostNotAllowed):
        client.get("https://169.254.169.254/latest/meta-data/")


@respx.mock
def test_redirects_are_not_followed():
    respx.get(f"{ALLOWED}/moved").mock(
        return_value=httpx.Response(302, headers={"Location": "https://elsewhere.example.com/"})
    )
    with outbound_client(ALLOWED) as client:
        response = client.get("/moved")
    assert response.status_code == 302


@respx.mock
def test_provider_headers_are_added_to_the_defaults():
    """ARCH-6: e.g. Africa's Talking's apiKey header."""
    route = respx.get(f"{ALLOWED}/ping").mock(return_value=httpx.Response(200))
    with outbound_client(ALLOWED, headers={"apiKey": "test-key"}) as client:
        client.get("/ping")
    sent = route.calls.last.request.headers
    assert sent["apiKey"] == "test-key"
    assert sent["User-Agent"].startswith("SokoFresh-backend")


@pytest.mark.parametrize(
    "override",
    [{"follow_redirects": True}, {"event_hooks": {}}, {"transport": None}, {"mounts": {}}],
)
def test_safety_options_cannot_be_overridden(override):
    with pytest.raises(TypeError):
        outbound_client(ALLOWED, **override)


@respx.mock
def test_host_matching_ignores_letter_case(settings):
    settings.OUTBOUND_HTTP_ALLOWED_HOSTS = ["Sandbox.Example-Provider.test"]
    respx.get(f"{ALLOWED}/ping").mock(return_value=httpx.Response(200))
    with outbound_client(ALLOWED) as client:
        assert client.get("/ping").status_code == 200


def test_only_port_443_unless_listed(settings):
    """SEC-10: an allowed host on another port is a different service."""
    with pytest.raises(OutboundHostNotAllowed):
        outbound_client("https://sandbox.example-provider.test:6379")
    settings.OUTBOUND_HTTP_ALLOWED_HOSTS = ["sandbox.example-provider.test:8443"]
    outbound_client("https://sandbox.example-provider.test:8443").close()
    with pytest.raises(OutboundHostNotAllowed):
        outbound_client(ALLOWED)


@pytest.mark.parametrize(
    "override", [{"verify": False}, {"proxy": "http://p"}, {"trust_env": True}]
)
def test_tls_and_proxy_settings_cannot_be_weakened(override):
    """RSEC-5 (minor): no turning off certificate checks or routing via a proxy."""
    with pytest.raises(TypeError):
        outbound_client(ALLOWED, **override)
