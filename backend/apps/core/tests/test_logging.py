"""Personal data must not reach the logs (NFR-07)."""

import logging

import pytest

from apps.core.logging import RedactPersonalDataFilter, redact


@pytest.mark.parametrize(
    "text",
    [
        "sending to +254712345678",
        "sending to 254712345678",
        "sending to 0712345678",
        "sending to 0712 345 678",
        "sending to 0110123456",
    ],
)
def test_phone_numbers_are_masked(text):
    result = redact(text)
    assert "345678" not in result.replace("*****", "")
    assert "*****" in result


@pytest.mark.parametrize("text", ["Your code is 482913", "code: 482913", "otp=482913", "PIN 4829"])
def test_codes_are_removed(text):
    result = redact(text)
    assert "482913" not in result and "4829" not in result
    assert "[redacted]" in result


def test_ordinary_numbers_are_left_alone():
    assert (
        redact("order SF-7KQ2 total KES 1090, 3 items") == "order SF-7KQ2 total KES 1090, 3 items"
    )


def test_filter_rewrites_formatted_message():
    record = logging.LogRecord(
        "t", logging.INFO, __file__, 1, "SMS to %s: code %s", ("0712345678", "123456"), None
    )
    assert RedactPersonalDataFilter().filter(record) is True
    message = record.getMessage()
    assert "0712345678" not in message and "123456" not in message


def test_logged_output_is_redacted(caplog):
    logger = logging.getLogger("apps.test")
    logger.addFilter(RedactPersonalDataFilter())
    with caplog.at_level(logging.INFO, logger="apps.test"):
        logger.info("login code 654321 for +254712345678")
    logger.filters.clear()
    assert "654321" not in caplog.text
    assert "+254712345678" not in caplog.text
