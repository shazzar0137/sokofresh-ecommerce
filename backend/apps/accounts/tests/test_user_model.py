"""Custom user model (created before the first migration, proposal §7)."""

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connection, transaction

from apps.accounts.models import User
from apps.core.phone import InvalidPhoneNumber

pytestmark = pytest.mark.django_db


def test_auth_user_model_is_the_custom_model():
    assert get_user_model() is User
    assert User.USERNAME_FIELD == "phone"


def test_create_user_normalises_phone_and_has_no_usable_password():
    user = User.objects.create_user("0712 345 678")
    assert user.phone == "+254712345678"
    assert not user.has_usable_password()
    assert not user.is_staff and not user.is_superuser
    assert user.email is None


def test_phone_is_unique_whatever_form_it_was_typed_in():
    User.objects.create_user("0712345678")
    with pytest.raises(ValidationError):
        User.objects.create_user("+254 712 345 678")


def test_invalid_phone_is_rejected():
    with pytest.raises(InvalidPhoneNumber):
        User.objects.create_user("0201234567")


def test_database_rejects_non_e164_phone_even_if_code_is_bypassed():
    with pytest.raises(IntegrityError), transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO accounts_user (password, is_superuser, phone, phone_verified, full_name,"
            " is_staff, is_active, date_joined) VALUES ('!', false, '0712345678', false, '',"
            " false, true, now())"
        )


def test_email_is_optional_but_unique_ignoring_case():
    User.objects.create_user("0712345678")
    User.objects.create_user("0712345679")  # two users without email are fine
    User.objects.create_user("0712345670", email="Wanjiku@Example.com")
    with pytest.raises(ValidationError):
        User.objects.create_user("0712345671", email="wanjiku@example.com")


def test_email_uniqueness_is_enforced_by_the_database():
    User.objects.create_user("0712345678", email="a@example.com")
    with pytest.raises(IntegrityError), transaction.atomic():
        User.objects.create(phone="+254712345679", email="A@example.com", password="!")


def test_superuser_requires_a_password():
    with pytest.raises(ValueError):
        User.objects.create_superuser("0712345678")
    admin = User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    assert admin.is_staff and admin.is_superuser and admin.has_usable_password()


def test_str_does_not_expose_the_full_number():
    user = User.objects.create_user("0712345678")
    assert "345" not in str(user)
    user.full_name = "Achieng Otieno"
    assert str(user) == "Achieng Otieno"
