"""Phone-number normalisation, checked against the shared fixture list."""

import pytest

from apps.core.phone import InvalidPhoneNumber, mask_phone, normalize_kenyan_mobile


def test_valid_numbers_normalise_to_e164(phone_numbers):
    for case in phone_numbers["valid"]:
        assert normalize_kenyan_mobile(case["input"]) == case["e164"], case["note"]


def test_invalid_numbers_are_rejected(phone_numbers):
    for case in phone_numbers["invalid"]:
        with pytest.raises(InvalidPhoneNumber):
            normalize_kenyan_mobile(case["input"])


def test_non_string_input_is_rejected():
    with pytest.raises(InvalidPhoneNumber):
        normalize_kenyan_mobile(None)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("phone", "masked"),
    [("+254712345678", "+2547*****678"), ("", ""), ("12345", "*****")],
)
def test_mask_phone_hides_middle_digits(phone, masked):
    assert mask_phone(phone) == masked
