"""API authentication.

DRF's SessionAuthentication sends no WWW-Authenticate challenge, so DRF turns
"not signed in" into 403. The API contract promises 401 for that case
(review finding API-1), which this subclass restores. CSRF checks are unchanged.
"""

from rest_framework import authentication
from rest_framework.request import Request


class SessionAuthentication(authentication.SessionAuthentication):
    def authenticate_header(self, request: Request) -> str:
        # Not a browser login prompt: browsers only prompt for Basic/Digest.
        return 'Session realm="api"'
