"""Sending SMS messages.

The backend is chosen with settings.SMS_BACKEND (like Django's EMAIL_BACKEND):

- ConsoleSmsBackend : development. Prints the message with the number masked.
- LocMemSmsBackend  : tests. Keeps messages in `outbox` so tests can read codes.
- DisabledSmsBackend: default for production until the Africa's Talking backend
  is built in Phase 5. Refuses to send, so nothing silently pretends to work.

Production refuses the console and in-memory backends (config/settings/prod.py).
"""

import logging
from dataclasses import dataclass

from django.conf import settings
from django.utils.module_loading import import_string

from apps.core.phone import mask_phone, normalize_kenyan_mobile

logger = logging.getLogger("apps.notifications.sms")


class SmsNotConfigured(RuntimeError):
    """Raised when no real SMS backend is configured."""


@dataclass(frozen=True)
class SmsMessage:
    to: str
    body: str


class BaseSmsBackend:
    def send(self, message: SmsMessage) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class ConsoleSmsBackend(BaseSmsBackend):
    """Development only: shows the message so a developer can sign in locally."""

    def send(self, message: SmsMessage) -> None:
        print(f"[SMS to {mask_phone(message.to)}] {message.body}", flush=True)  # noqa: T201


# Messages sent with LocMemSmsBackend (tests clear it between tests).
outbox: list[SmsMessage] = []


class LocMemSmsBackend(BaseSmsBackend):
    def send(self, message: SmsMessage) -> None:
        outbox.append(message)


class DisabledSmsBackend(BaseSmsBackend):
    def send(self, message: SmsMessage) -> None:
        logger.error("SMS to %s not sent: no SMS backend configured", mask_phone(message.to))
        raise SmsNotConfigured("No SMS backend is configured (set SMS_BACKEND).")


def get_backend() -> BaseSmsBackend:
    return import_string(settings.SMS_BACKEND)()


def send_sms(to: str, body: str) -> None:
    """Send one SMS. `to` is normalised to E.164 first; invalid numbers raise."""
    message = SmsMessage(to=normalize_kenyan_mobile(to), body=body)
    get_backend().send(message)
    logger.info("SMS sent to %s", mask_phone(message.to))
