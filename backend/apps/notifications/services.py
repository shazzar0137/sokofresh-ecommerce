"""Public entry points of the notifications app. Other apps call these, not sms.py."""

from .sms import send_sms

__all__ = ["send_sms"]
