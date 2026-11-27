"""The four role groups exist and has_role() works."""

import pytest
from django.contrib.auth.models import AnonymousUser, Group

from apps.accounts.roles import Role, has_role
from apps.accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_migration_created_the_four_role_groups():
    assert set(Group.objects.values_list("name", flat=True)) >= set(Role.ALL)


def test_has_role():
    rider = UserFactory()
    rider.groups.add(Group.objects.get(name=Role.RIDER))
    assert has_role(rider, Role.RIDER)
    assert not has_role(rider, Role.STAFF)
    assert not has_role(AnonymousUser(), Role.CUSTOMER)


def test_inactive_user_has_no_role():
    staff = UserFactory(is_active=False)
    staff.groups.add(Group.objects.get(name=Role.STAFF))
    assert not has_role(staff, Role.STAFF)


def test_unknown_role_is_an_error():
    with pytest.raises(ValueError):
        has_role(UserFactory(), "Superhero")
