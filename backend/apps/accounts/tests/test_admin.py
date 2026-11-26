"""Django admin works with the custom user model (ADR-0008)."""

import pytest
from django.conf import settings

from apps.accounts.models import User

pytestmark = pytest.mark.django_db

ADMIN = "/" + settings.ADMIN_URL


@pytest.fixture
def admin_client(client):
    admin = User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    client.force_login(admin)
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
