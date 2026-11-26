"""Logging that removes personal data before anything is written.

Phone numbers are personal data under the Kenya Data Protection Act, 2019, and
one-time codes are secrets. Neither may appear in full in logs (NFR-07,
proposal §9). Two layers:

- RedactPersonalDataFilter rewrites each record's message (for any handler);
- RedactingFormatter redacts the complete formatted output, including
  tracebacks and stack traces (review findings ARCH-5 / SEC-4).

The patterns use only bounded repetition, so their running time grows linearly
with the text (re-review finding RSEC-4: an unbounded pattern let a crafted
8 KB header take seconds to log). Very long texts are cut to MAX_LOG_CHARS after redaction.

This is a safety net, not a guarantee: code must still avoid logging these values.
Known limits: digits separated one by one ("1 2 3 4 5 6") and nine-digit numbers
without a prefix are not recognised; some ordinary numbers that look like phone
numbers or codes are masked too (privacy wins over log detail).
"""

import logging
import re

MAX_LOG_CHARS = 64 * 1024

_SEP = r"[\s.\-()]{0,3}"
# Kenyan mobiles: +254 / 254 / (+254) / 0, optional "(0)", then 7XX or 1XX and six
# more digits, with up to three spaces, dots, dashes or brackets between groups.
_PHONE_RE = re.compile(
    rf"(?<![\d+])(?:\(?\+?254\)?{_SEP}(?:\(0\){_SEP})?|0)"
    rf"([17]\d{{2}}){_SEP}(\d{{3}}){_SEP}(\d{{3}})(?!\d)"
)
# A code word (also inside names like verification_code or login_code), then up
# to a few separators (spaces, quotes, ":", "=", "-", "is"), then 4-8 digits.
_CODE_RE = re.compile(
    r"(?i)(?<![a-z])((?:pass)?code|otp|pin|token)(?![a-z])"
    r"([\"'\s:=\-]{0,6}(?:is[\"'\s:=\-]{1,6})?)\d{4,8}(?!\d)"
)


def redact(text: str) -> str:
    # Redact first, then cut: a number straddling the cut would otherwise leak
    # partly (re-review finding R3-2). The patterns are linear, so this is cheap.
    text = _PHONE_RE.sub(lambda m: f"+254{m.group(1)[0]}*****{m.group(3)}", text)
    text = _CODE_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}[redacted]", text)
    if len(text) > MAX_LOG_CHARS:
        text = text[:MAX_LOG_CHARS] + " …[log message truncated]"
    return text


class RedactPersonalDataFilter(logging.Filter):
    """Rewrite the final log message with phone numbers masked and codes removed."""

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            message = record.getMessage()
        except Exception:  # noqa: BLE001 - never let logging break the request
            return True
        redacted = redact(message)
        if redacted != message:
            record.msg = redacted
            record.args = None
        return True


class RedactingFormatter(logging.Formatter):
    """Format normally, then redact the whole text (message, traceback, stack)."""

    def format(self, record: logging.LogRecord) -> str:
        return redact(super().format(record))
