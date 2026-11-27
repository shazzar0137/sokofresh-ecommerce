"""django-allauth adapter: phone storage and SMS codes (ADR-0005).

allauth does not store phone numbers itself. It calls these hooks, and the
phone number lives on our User model. Login codes are sent directly (not
through the task queue) because they expire within minutes (ADR-0011 item 8).
"""

import logging

from allauth.account.adapter import DefaultAccountAdapter
from django import forms
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.base_user import AbstractBaseUser
from django.http import HttpRequest, HttpResponse, JsonResponse

from apps.core.phone import InvalidPhoneNumber, mask_phone, normalize_kenyan_mobile
from apps.notifications.services import send_sms

logger = logging.getLogger("apps.accounts.adapter")

LOGIN_CODE_MESSAGE = (
    "Your SokoFresh code is {code}. It expires in {minutes} minutes. Do not share it."
)


class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        # Account creation (at checkout) is built in Phase 5 (ADR-0011 item 5).
        # Until then sign-up is closed, so every number gets the same answer.
        return settings.ACCOUNT_SIGNUP_OPEN

    def pre_login(
        self, request: HttpRequest, user: AbstractBaseUser, **kwargs
    ) -> HttpResponse | None:
        """Staff and admin accounts may not sign in with an SMS code alone.

        An SMS code proves only control of a SIM card (SIM-swap risk), so it must
        never open Django admin. Staff sign in on the admin login page with their
        password; MFA follows in Phase 5 (KI-007). allauth headless turns the
        refusal into its normal "not signed in" (401) response.
        """
        if user.is_staff or user.is_superuser:
            from allauth.account.internal.flows.login import get_authentication_records
            from allauth.account.internal.stagekit import clear_login

            records = get_authentication_records(request, user) or []
            if records and records[-1].get("method") == "code":
                clear_login(request)
                logger.warning("Refused code sign-in for staff account %s", mask_phone(user.phone))
                return JsonResponse(
                    {
                        "status": 403,
                        "errors": [
                            {
                                "message": "Staff accounts sign in on the staff site.",
                                "code": "staff_code_login_not_allowed",
                            }
                        ],
                    },
                    status=403,
                )
        return super().pre_login(request, user, **kwargs)

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

        if user is not None and (user.is_staff or user.is_superuser):
            # Staff cannot use codes (pre_login refuses them), so do not text one.
            # The HTTP response stays the same (re-review finding R3-4).
            logger.info("No sign-in code sent to staff account %s", mask_phone(phone))
            return
        minutes = max(1, app_settings.LOGIN_BY_CODE_TIMEOUT // 60)
        try:
            send_sms(phone, LOGIN_CODE_MESSAGE.format(code=code, minutes=minutes))
        except Exception:  # noqa: BLE001
            # A provider failure must not change the HTTP response (that would
            # reveal which numbers have accounts). The error is logged for staff.
            logger.exception("Could not send sign-in code to %s", mask_phone(phone))
