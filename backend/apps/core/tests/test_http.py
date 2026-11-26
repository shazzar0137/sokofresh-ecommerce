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
