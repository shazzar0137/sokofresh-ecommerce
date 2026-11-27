"""allauth adapter phone hooks (QA-1: previously never executed by tests)."""

import pytest
from django import forms

from apps.accounts.adapter import AccountAdapter
from apps.accounts.models import User
from apps.accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def adapter(rf):
    return AccountAdapter(rf.get("/"))


def test_clean_phone_normalises_or_raises_form_error(adapter):
    assert adapter.clean_phone("+254712345678") == "+254712345678"
    with pytest.raises(forms.ValidationError):
        adapter.clean_phone("+255712345678")


def test_set_phone_normalises_and_saves(adapter):
    user = UserFactory(phone="+254712345678", phone_verified=True)
    adapter.set_phone(user, "0722 000 001", verified=False)
    user.refresh_from_db()
    assert (user.phone, user.phone_verified) == ("+254722000001", False)


def test_set_phone_on_unsaved_user_does_not_save(adapter):
    user = User(phone="")
    adapter.set_phone(user, "0722000001", verified=True)
    assert user.pk is None and user.phone == "+254722000001"


def test_get_phone(adapter):
    assert adapter.get_phone(User(phone="")) is None
    user = UserFactory(phone="+254712345678", phone_verified=False)
    assert adapter.get_phone(user) == ("+254712345678", False)


def test_set_phone_verified_only_for_the_number_on_the_account(adapter):
    user = UserFactory(phone="+254712345678", phone_verified=False)
    adapter.set_phone_verified(user, "+254799000001")
    user.refresh_from_db()
    assert user.phone_verified is False
    adapter.set_phone_verified(user, "0712345678")
    user.refresh_from_db()
    assert user.phone_verified is True


def test_get_user_by_phone(adapter):
    user = UserFactory(phone="+254712345678")
    UserFactory(phone="+254712345679", is_active=False)
    assert adapter.get_user_by_phone("0712345678") == user
    assert adapter.get_user_by_phone("+254712345679") is None  # inactive
    assert adapter.get_user_by_phone("not a phone") is None
