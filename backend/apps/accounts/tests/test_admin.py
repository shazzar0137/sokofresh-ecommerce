"""Django admin works with the custom user model (ADR-0008)."""

import pytest
from django.conf import settings

from apps.accounts.models import User

pytestmark = pytest.mark.django_db

ADMIN = "/" + settings.ADMIN_URL


@pytest.fixture
def admin_client(client):
    """Signed in the way staff really sign in: the admin login page with a password."""
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    response = client.post(
        f"{ADMIN}login/", {"username": "0712345678", "password": "a-long-staff-password-1"}
    )
    assert response.status_code == 302
    return client


def test_user_list_and_add_pages_load(admin_client):
    assert admin_client.get(f"{ADMIN}accounts/user/").status_code == 200
    assert admin_client.get(f"{ADMIN}accounts/user/add/").status_code == 200


def test_staff_can_add_a_customer_without_a_password(admin_client):
    response = admin_client.post(
        f"{ADMIN}accounts/user/add/",
        {"phone": "0722 000 001", "usable_password": "false"},
    )
    assert response.status_code == 302, response.content[:500]
    user = User.objects.get(phone="+254722000001")
    assert not user.has_usable_password()


def test_customers_cannot_open_admin(client):
    customer = User.objects.create_user("0712345679")
    client.force_login(customer)
    response = client.get(f"{ADMIN}accounts/user/")
    assert response.status_code == 302  # redirected to the admin login


@pytest.mark.parametrize("phone", ["12345", "+447911123456", "0202222222"])
def test_invalid_phone_shows_a_form_error_not_a_crash(admin_client, phone):
    """DB-1: previously HTTP 500."""
    response = admin_client.post(
        f"{ADMIN}accounts/user/add/", {"phone": phone, "usable_password": "false"}
    )
    assert response.status_code == 200
    assert response.context["adminform"].form.errors["phone"]
    assert not User.objects.filter(phone__contains=phone[-5:]).exclude(is_superuser=True).exists()


def test_admin_404_pages_stay_html(admin_client):
    """ARCH-8: JSON error pages are only for API paths."""
    response = admin_client.get(f"{ADMIN}no-such-page/")
    assert response.status_code == 404
    assert response["Content-Type"].startswith("text/html")


def test_admin_needs_a_password_sign_in_on_the_admin_page(client):
    """RSEC-1: a session from any other sign-in (e.g. SMS code) does not open admin."""
    staff = User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    client.force_login(staff)  # like a code or API sign-in
    assert client.get(f"{ADMIN}accounts/user/").status_code == 302


def test_customer_promoted_to_staff_keeps_no_admin_access(client):
    """RSEC-1: promotion does not upgrade an existing SMS-code session."""
    import re

    from apps.notifications import sms

    customer = User.objects.create_user("0712345678")
    base = "/_allauth/browser/v1"
    client.post(
        f"{base}/auth/code/request", {"phone": "+254712345678"}, content_type="application/json"
    )
    code = re.search(r"\b(\d{6})\b", sms.outbox[-1].body).group(1)
    assert (
        client.post(
            f"{base}/auth/code/confirm", {"code": code}, content_type="application/json"
        ).status_code
        == 200
    )
    customer.is_staff = customer.is_superuser = True
    customer.save()
    assert client.get(f"{ADMIN}accounts/user/").status_code == 302


def test_headless_password_login_does_not_open_admin(client):
    """RSEC-1 (related): allauth's API login must not bypass the admin login page."""
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    response = client.post(
        "/_allauth/browser/v1/auth/login",
        {"phone": "+254712345678", "password": "a-long-staff-password-1"},
        content_type="application/json",
    )
    assert response.status_code in (200, 400, 401)
    assert client.get(f"{ADMIN}accounts/user/").status_code == 302


def test_signing_in_elsewhere_removes_the_admin_flag(admin_client):
    from apps.core.admin_site import ADMIN_LOGIN_SESSION_KEY

    assert admin_client.session[ADMIN_LOGIN_SESSION_KEY] is True
    admin_client.force_login(User.objects.get(phone="+254712345678"))
    assert ADMIN_LOGIN_SESSION_KEY not in admin_client.session
