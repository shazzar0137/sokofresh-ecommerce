"""Kenyan phone numbers.

Customers type numbers in many forms (0712 345 678, 0112345678, +254 712 345 678,
254712345678). Everything the backend stores uses one form: E.164, for example
+254712345678. The `phonenumbers` library (Google's libphonenumber) does the
validation (ADR-0010).
"""

import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberType

KENYA_REGION = "KE"
KENYA_E164_PREFIX = "+254"

_ACCEPTED_TYPES = {PhoneNumberType.MOBILE, PhoneNumberType.FIXED_LINE_OR_MOBILE}


class InvalidPhoneNumber(ValueError):
    """Raised when a value is not a valid Kenyan mobile number."""


def normalize_kenyan_mobile(raw: str) -> str:
    """Return the number in E.164 form (+2547XXXXXXXX / +2541XXXXXXXX).

    Raises InvalidPhoneNumber for anything that is not a valid Kenyan mobile
    number, including valid numbers from other countries.
    """
    if not isinstance(raw, str) or not raw.strip():
        raise InvalidPhoneNumber("Enter a phone number.")
    try:
        parsed = phonenumbers.parse(raw, KENYA_REGION)
    except NumberParseException as exc:
        raise InvalidPhoneNumber("Enter a valid Kenyan mobile number.") from exc

    if phonenumbers.region_code_for_number(parsed) != KENYA_REGION:
        raise InvalidPhoneNumber("Enter a Kenyan mobile number (+254).")
    if not phonenumbers.is_valid_number(parsed):
        raise InvalidPhoneNumber("Enter a valid Kenyan mobile number.")
    if phonenumbers.number_type(parsed) not in _ACCEPTED_TYPES:
        raise InvalidPhoneNumber("Enter a mobile number, not a landline.")
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def mask_phone(phone: str) -> str:
    """Hide the middle digits for logs and staff lists: +254712345678 -> +2547*****678."""
    if not phone:
        return ""
    digits = phone.strip()
    if len(digits) <= 7:
        return "*" * len(digits)
    return f"{digits[:5]}{'*' * (len(digits) - 8)}{digits[-3:]}"
