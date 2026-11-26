"""Phone + one-time-code sign-in through django-allauth headless (ADR-0005).

This exercises the real allauth endpoints with a real database; only the SMS
sending is captured in memory instead of reaching Africa's Talking.
"""

import re

import pytest

from apps.accounts.tests.factories import UserFactory
from apps.notifications import sms

pytestmark = pytest.mark.django_db

BASE = "/_allauth/browser/v1"


def last_code() -> str:
    assert sms.outbox, "no SMS was sent"
    match = re.search(r"\b(\d{6})\b", sms.outbox[-1].body)
    assert match, sms.outbox[-1].body
    return match.group(1)


def test_config_advertises_phone_login_by_code(client):
    data = client.get(f"{BASE}/config").json()["data"]["account"]
    assert data["login_by_code_enabled"] is True
    assert "phone" in data["login_methods"]


def test_existing_customer_signs_in_with_a_code(client):
    UserFactory(phone="+254712345678")

    response = client.post(
        f"{BASE}/auth/code/request", {"phone": "+254712345678"}, content_type="application/json"
    )
    assert response.status_code == 401  # flow pending: a code is required next
    assert len(sms.outbox) == 1
    assert sms.outbox[0].to == "+254712345678"
    assert re.fullmatch(r"Your SokoFresh code is \d{6}\. .*", sms.outbox[0].body)

    response = client.post(
        f"{BASE}/auth/code/confirm", {"code": last_code()}, content_type="application/json"
    )
    assert response.status_code == 200, response.json()
    assert response.json()["meta"]["is_authenticated"] is True

    session = client.get(f"{BASE}/auth/session").json()
    assert session["meta"]["is_authenticated"] is True


def test_wrong_code_does_not_sign_in(client):
    UserFactory(phone="+254712345678")
    client.post(
        f"{BASE}/auth/code/request", {"phone": "+254712345678"}, content_type="application/json"
    )
    code = last_code()
    wrong = "000000" if code != "000000" else "111111"
    response = client.post(
        f"{BASE}/auth/code/confirm", {"code": wrong}, content_type="application/json"
    )
    assert response.status_code == 400
    session = client.get(f"{BASE}/auth/session")
    assert session.status_code == 401


def test_allauth_endpoints_require_international_format(client):
    # Contract: allauth headless accepts only E.164 ("+2547..."). The frontend
    # normalises what customers type (FE-32) before calling these endpoints.
    response = client.post(
        f"{BASE}/auth/code/request", {"phone": "0712345678"}, content_type="application/json"
    )
    assert response.status_code == 400
    assert response.json()["errors"][0]["code"] == "invalid_phone"
    assert sms.outbox == []


@pytest.mark.parametrize("phone", ["+255712345678", "+14155550100"])
def test_non_kenyan_numbers_are_rejected(client, phone):
    response = client.post(
        f"{BASE}/auth/code/request", {"phone": phone}, content_type="application/json"
    )
    assert response.status_code == 400
    assert sms.outbox == []


def test_invalid_phone_is_rejected_without_sending_sms(client):
    response = client.post(
        f"{BASE}/auth/code/request", {"phone": "+254201234567"}, content_type="application/json"
    )
    assert response.status_code == 400
    assert sms.outbox == []


def test_unknown_number_gets_no_sms_and_no_account_is_revealed(client):
    response = client.post(
        f"{BASE}/auth/code/request", {"phone": "+254799000001"}, content_type="application/json"
    )
    # Same pending response as for a real account (enumeration prevention),
    # and no SMS is paid for. Creating accounts at checkout is Phase 5.
    assert response.status_code == 401
    assert sms.outbox == []


def test_code_requests_for_one_number_are_rate_limited(client):
    UserFactory(phone="+254712345678")
    statuses = [
        client.post(
            f"{BASE}/auth/code/request", {"phone": "+254712345678"}, content_type="application/json"
        ).status_code
        for _ in range(5)
    ]
    # allauth answers 400 with a stable error code once the limit is reached.
    assert statuses[:3] == [401, 401, 401]
    assert statuses[3:] == [400, 400]
    assert len(sms.outbox) == 3


def test_rate_limit_error_code_is_stable(client):
    UserFactory(phone="+254712345678")
    for _ in range(3):
        client.post(
            f"{BASE}/auth/code/request", {"phone": "+254712345678"}, content_type="application/json"
        )
    response = client.post(
        f"{BASE}/auth/code/request", {"phone": "+254712345678"}, content_type="application/json"
    )
    assert response.json()["errors"][0]["code"] == "too_many_login_attempts"


def test_sign_out(client):
    user = UserFactory()
    client.force_login(user)
    assert client.get(f"{BASE}/auth/session").status_code == 200
    assert client.delete(f"{BASE}/auth/session").status_code == 401
    assert client.get(f"{BASE}/auth/session").status_code == 401


# --- Review findings (BACKEND_REVIEW_REPORT.md) ---


def _request_code(client, phone="+254712345678"):
    return client.post(
        f"{BASE}/auth/code/request", {"phone": phone}, content_type="application/json"
    )


def _confirm(client, code):
    return client.post(f"{BASE}/auth/code/confirm", {"code": code}, content_type="application/json")


@pytest.mark.parametrize("role", ["staff", "superuser"])
def test_staff_cannot_sign_in_with_an_sms_code(client, role, caplog):
    """SEC-1: an SMS code alone must never open Django admin (SIM-swap risk).

    allauth headless answers with its ordinary "not signed in" response, which
    also avoids telling an attacker that the number belongs to staff.
    """
    from django.conf import settings

    from apps.accounts.models import User

    if role == "superuser":
        User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    else:
        UserFactory(phone="+254712345678", is_staff=True)
    _request_code(client)
    response = _confirm(client, last_code())
    assert response.status_code == 401
    assert response.json()["meta"]["is_authenticated"] is False
    assert "Refused code sign-in for staff account" in caplog.text
    assert client.get(f"{BASE}/auth/session").status_code == 401
    assert client.get("/" + settings.ADMIN_URL).status_code == 302  # to the login page


def test_staff_can_still_sign_in_to_admin_with_password(client):
    from django.conf import settings

    from apps.accounts.models import User

    User.objects.create_superuser("0712345678", password="a-long-staff-password-1")
    admin = "/" + settings.ADMIN_URL
    response = client.post(
        f"{admin}login/",
        {"username": "0712 345 678", "password": "a-long-staff-password-1", "next": admin},
    )
    assert response.status_code == 302  # DB-6: local number format accepted
    assert client.get(admin).status_code == 200


@pytest.mark.parametrize("phone", ["+254799111222", "+254712345678"])
def test_sign_up_is_closed_and_reveals_nothing(client, phone):
    """SEC-2 / QA-1: new and existing numbers get the same answer; no 500, no user."""
    from apps.accounts.models import User

    UserFactory(phone="+254712345678")
    response = client.post(f"{BASE}/auth/signup", {"phone": phone}, content_type="application/json")
    assert response.status_code == 403
    assert User.objects.count() == 1
    assert sms.outbox == []


def test_inactive_user_gets_no_sms(client):
    """QA-2: deactivated accounts get no code (and no SMS cost)."""
    UserFactory(phone="+254712345678", is_active=False)
    response = _request_code(client)
    assert response.status_code == 401
    assert sms.outbox == []


def test_code_stops_working_after_three_wrong_attempts(client):
    """QA-3: guessing is limited to 3 attempts; then even the right code fails."""
    UserFactory(phone="+254712345678")
    _request_code(client)
    code = last_code()
    wrong = "000000" if code != "000000" else "111111"
    assert [_confirm(client, wrong).status_code for _ in range(3)] == [400, 400, 400]
    assert _confirm(client, code).status_code == 409  # flow ended
    assert client.get(f"{BASE}/auth/session").status_code == 401


def test_used_code_cannot_be_replayed(client):
    UserFactory(phone="+254712345678")
    _request_code(client)
    code = last_code()
    assert _confirm(client, code).status_code == 200
    client.delete(f"{BASE}/auth/session")
    assert _confirm(client, code).status_code in (400, 409)
    assert client.get(f"{BASE}/auth/session").status_code == 401


def test_session_key_changes_at_sign_in(client):
    UserFactory(phone="+254712345678")
    client.get(f"{BASE}/config")
    _request_code(client)
    before = client.session.session_key
    _confirm(client, last_code())
    assert client.session.session_key != before


def test_sms_provider_failure_gives_the_same_answer_as_unknown_number(client, settings):
    """SEC-5: a send failure must not reveal that the number has an account."""
    settings.SMS_BACKEND = "apps.notifications.sms.DisabledSmsBackend"
    UserFactory(phone="+254712345678")
    known = _request_code(client)
    unknown = _request_code(client, "+254799000001")
    assert known.status_code == unknown.status_code == 401
    assert known.json() == unknown.json()


def test_phone_change_endpoint_is_not_available(client):
    """SEC-8: signed-in users cannot make the system text arbitrary numbers."""
    client.force_login(UserFactory())
    response = client.post(
        f"{BASE}/account/phone", {"phone": "+254711000222"}, content_type="application/json"
    )
    assert response.status_code == 404
    assert sms.outbox == []
