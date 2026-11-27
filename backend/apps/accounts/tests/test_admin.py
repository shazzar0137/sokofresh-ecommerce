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


def test_headless_password_login_is_not_available(client):
    """RSEC-1 / BSEC-2: allauth's API password login is shadowed (404), so staff
    passwords can only be tried on the admin login page, which limits attempts."""
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    response = client.post(
        "/_allauth/browser/v1/auth/login",
        {"phone": "+254712345678", "password": "a-long-staff-password-1"},
        content_type="application/json",
    )
    assert response.status_code == 404
    assert "_auth_user_id" not in client.session
    assert client.get(f"{ADMIN}accounts/user/").status_code == 302


def _admin_login(client, phone="0712345678", password="wrong-password-0000", **extra):  # noqa: S107 - test value
    return client.post(f"{ADMIN}login/", {"username": phone, "password": password}, **extra)


def test_admin_login_blocks_a_phone_after_five_failed_passwords(client):
    """BSEC-1: 40 wrong passwords used to be followed by a successful login."""
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    statuses = [_admin_login(client).status_code for _ in range(5)]
    assert statuses == [200] * 5  # the form, with "please enter a correct ..." errors
    # Even the right password is refused while the phone number is blocked.
    response = _admin_login(client, password="a-long-staff-password-1")
    assert response.status_code == 429
    assert "_auth_user_id" not in client.session


def test_admin_login_blocks_an_ip_guessing_across_many_phones(client):
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    statuses = [_admin_login(client, phone=f"07120000{i:02d}").status_code for i in range(11)]
    assert statuses == [200] * 10 + [429]
    # A different address is not affected by that IP's block.
    response = _admin_login(client, password="a-long-staff-password-1", REMOTE_ADDR="198.51.100.7")
    assert response.status_code == 302


def test_admin_login_still_works_after_a_few_typos(client):
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    for _ in range(4):
        assert _admin_login(client).status_code == 200
    response = _admin_login(client, password="a-long-staff-password-1")
    assert response.status_code == 302
    assert client.session["sokofresh_admin_password_login"] is True


def test_successful_admin_logins_are_not_counted(client):
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    for _ in range(8):
        assert _admin_login(client, password="a-long-staff-password-1").status_code == 302
        client.logout()


def test_admin_login_page_still_loads_when_blocked(client):
    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    for _ in range(5):
        _admin_login(client)
    assert client.get(f"{ADMIN}login/").status_code == 200


def test_signing_in_elsewhere_removes_the_admin_flag(admin_client):
    from apps.core.admin_site import ADMIN_LOGIN_SESSION_KEY

    assert admin_client.session[ADMIN_LOGIN_SESSION_KEY] is True
    admin_client.force_login(User.objects.get(phone="+254712345678"))
    assert ADMIN_LOGIN_SESSION_KEY not in admin_client.session
