"""Logging filter that removes personal data before log lines are written.

Phone numbers are personal data under the Kenya Data Protection Act, 2019, and
one-time codes are secrets. Neither may appear in full in logs (NFR-07,
proposal §9). This filter is a safety net: code should still avoid logging them.
"""

import logging
import re

# Kenyan mobile numbers in common written forms: +2547..., 2547..., 07..., 01...
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?254|0)([17]\d{2})[ -]?(\d{3})[ -]?(\d{3})(?!\d)")
# "code 123456", "code: 123456", "code is 123456", "otp=123456"
_CODE_RE = re.compile(r"(?i)\b(code|otp|pin)(\s*(?:is|:|=)?\s*)\d{4,8}\b")


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
