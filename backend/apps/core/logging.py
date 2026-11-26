"""Logging that removes personal data before anything is written.

Phone numbers are personal data under the Kenya Data Protection Act, 2019, and
one-time codes are secrets. Neither may appear in full in logs (NFR-07,
proposal §9). Two layers:

- RedactPersonalDataFilter rewrites each record's message (for any handler);
- RedactingFormatter redacts the complete formatted output, including
  tracebacks and stack traces (review findings ARCH-5 / SEC-4).

This is a safety net: code should still avoid logging these values.
"""

import logging
import re

# Kenyan mobiles: +254 / 254 / (+254) / 0, optional "(0)", then 7XX or 1XX and six
# more digits, with optional spaces, dots, dashes or brackets between groups.
_SEP = r"[\s.\-()]*"
_PHONE_RE = re.compile(
    rf"(?<![\d+])(?:\(?\+?254\)?{_SEP}(?:\(0\){_SEP})?|0)([17]\d{{2}}){_SEP}(\d{{3}}){_SEP}(\d{{3}})(?!\d)"
)
# "code 123456", "code: 123456", "code is 123456", "otp=123456", "token 123456",
# and JSON/dict forms: "code": "123456", 'code': '123456'.
_CODE_RE = re.compile(
    r"""(?i)(["']?\b(?:code|otp|pin|token)\b["']?)(\s*(?:is|:|=)?\s*["']?)\d{4,8}\b"""
)


def redact(text: str) -> str:
    text = _PHONE_RE.sub(lambda m: f"+254{m.group(1)[0]}*****{m.group(3)}", text)
    return _CODE_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}[redacted]", text)


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
