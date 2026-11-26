"""django-allauth adapter: phone storage and SMS codes (ADR-0005).

allauth does not store phone numbers itself. It calls these hooks, and the
phone number lives on our User model. Login codes are sent directly (not
through the task queue) because they expire within minutes (ADR-0011 item 8).
"""

from allauth.account.adapter import DefaultAccountAdapter
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.base_user import AbstractBaseUser

from apps.core.phone import InvalidPhoneNumber, normalize_kenyan_mobile
from apps.notifications.sms import send_sms

LOGIN_CODE_MESSAGE = (
    "Your SokoFresh code is {code}. It expires in {minutes} minutes. Do not share it."
)


class AccountAdapter(DefaultAccountAdapter):
    def clean_phone(self, phone: str) -> str:
        try:
            return normalize_kenyan_mobile(phone)
        except InvalidPhoneNumber as exc:
            raise forms.ValidationError(str(exc), code="invalid_phone") from exc

    def set_phone(self, user: AbstractBaseUser, phone: str, verified: bool) -> None:
        user.phone = normalize_kenyan_mobile(phone)
        user.phone_verified = verified
        if user.pk:
            user.save(update_fields=["phone", "phone_verified"])

    def get_phone(self, user: AbstractBaseUser) -> tuple[str, bool] | None:
        if not getattr(user, "phone", None):
            return None
        return user.phone, user.phone_verified

    def set_phone_verified(self, user: AbstractBaseUser, phone: str) -> None:
        if normalize_kenyan_mobile(phone) != user.phone:
            # allauth only verifies the number already on the account.
            return
        user.phone_verified = True
        user.save(update_fields=["phone_verified"])

    def get_user_by_phone(self, phone: str) -> AbstractBaseUser | None:
        try:
            normalized = normalize_kenyan_mobile(phone)
        except InvalidPhoneNumber:
            return None
        return get_user_model().objects.filter(phone=normalized, is_active=True).first()

    def send_verification_code_sms(
        self, user: AbstractBaseUser, phone: str, code: str, **kwargs
    ) -> None:
        from allauth.account import app_settings

        minutes = max(1, app_settings.LOGIN_BY_CODE_TIMEOUT // 60)
        send_sms(phone, LOGIN_CODE_MESSAGE.format(code=code, minutes=minutes))
