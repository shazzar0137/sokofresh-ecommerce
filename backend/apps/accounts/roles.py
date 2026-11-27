"""User roles (proposal §7): Django groups, created by migration 0002.

- Customer: shops on the storefront.
- Rider: a delivery-partner rider using the rider screens (ADR-0013 / B-15).
- Staff: manages products, stock and orders in Django admin.
- Admin: everything, including users and settings.

Permissions are attached to the groups as each app's models are built.
"""

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser


class Role:
    CUSTOMER = "Customer"
    RIDER = "Rider"
    STAFF = "Staff"
    ADMIN = "Admin"

    ALL = (CUSTOMER, RIDER, STAFF, ADMIN)


def has_role(user: AbstractBaseUser | AnonymousUser, role: str) -> bool:
    """True if the signed-in, active user belongs to the role's group."""
    if role not in Role.ALL:
        raise ValueError(f"Unknown role: {role!r}")
    if not user or not user.is_authenticated or not user.is_active:
        return False
    return user.groups.filter(name=role).exists()
