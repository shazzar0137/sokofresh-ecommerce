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
        "sending to +254-712-345-678",
        "sending to (+254) 712 345678",
        "sending to +254 712345678",
        "sending to +254(0)712345678",
        "sending to 0712.345.678",
        '{"phone": "+254712345678"}',
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


def test_formatter_redacts_tracebacks():
    """ARCH-5 / SEC-4: exception text is redacted too."""
    import sys

    from apps.core.logging import RedactingFormatter

    try:
        raise RuntimeError("failed for +254712345678 with code 654321")
    except RuntimeError:
        record = logging.LogRecord("t", logging.ERROR, __file__, 1, "boom", None, sys.exc_info())
    output = RedactingFormatter("%(message)s").format(record)
    assert "RuntimeError" in output
    assert "+254712345678" not in output and "654321" not in output


def test_configured_handlers_redact_real_log_output():
    """QA-4: the real LOGGING config (not a hand-attached filter) redacts."""
    from apps.core.logging import RedactingFormatter, RedactPersonalDataFilter

    for name in ("apps", "django", "apps.notifications.sms"):
        logger = logging.getLogger(name)
        while not logger.handlers and logger.parent:
            logger = logger.parent
        handler = logger.handlers[0]
        assert isinstance(handler.formatter, RedactingFormatter)
        assert any(isinstance(f, RedactPersonalDataFilter) for f in handler.filters)
        record = logging.LogRecord(name, logging.INFO, __file__, 1, "to %s", ("0712345678",), None)
        assert "0712345678" not in handler.format(record)


def test_outbound_request_urls_are_not_logged_at_info():
    """SEC-11: httpx logs full URLs (which may carry tokens) at INFO."""
    assert logging.getLogger("httpx").getEffectiveLevel() >= logging.WARNING


@pytest.mark.parametrize(
    "text",
    [
        "code" + " " * 20000,
        "code" + ":" * 20000,
        "+254" + " " * 20000,
        "0" * 50000,
        "a_" * 30000 + "code 1",
    ],
)
def test_redaction_time_grows_linearly(text):
    """RSEC-4: no catastrophic backtracking."""
    import time

    start = time.perf_counter()
    redact(text)
    assert time.perf_counter() - start < 0.2


@pytest.mark.parametrize(
    "text", ["verification_code=123456", "login_code: 123456", "passcode 123456", "code-123456"]
)
def test_code_names_and_separators(text):
    assert "123456" not in redact(text)


def test_words_containing_code_are_left_alone():
    assert redact("barcode 12345678") == "barcode 12345678"


def test_very_long_messages_are_truncated():
    from apps.core.logging import MAX_LOG_CHARS

    assert len(redact("x" * (MAX_LOG_CHARS * 2))) < MAX_LOG_CHARS + 100
