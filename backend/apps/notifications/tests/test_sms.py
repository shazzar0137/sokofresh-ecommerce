"""SMS backends: development, tests, and the production default that refuses to send."""

import pytest
from django.test import override_settings

from apps.notifications import sms


def test_locmem_backend_records_normalised_number():
    sms.send_sms("0712 345 678", "hello")
    assert sms.outbox == [sms.SmsMessage(to="+254712345678", body="hello")]


def test_invalid_number_is_not_sent():
    from apps.core.phone import InvalidPhoneNumber

    with pytest.raises(InvalidPhoneNumber):
        sms.send_sms("+14155550100", "hello")
    assert sms.outbox == []


@override_settings(SMS_BACKEND="apps.notifications.sms.ConsoleSmsBackend")
def test_console_backend_masks_the_number(capsys):
    sms.send_sms("0712345678", "Your code is 123456")
    out = capsys.readouterr().out
    assert "+254712345678" not in out
    assert "+2547*****678" in out


@override_settings(SMS_BACKEND="apps.notifications.sms.DisabledSmsBackend")
def test_disabled_backend_fails_loudly():
    with pytest.raises(sms.SmsNotConfigured):
        sms.send_sms("0712345678", "hello")
