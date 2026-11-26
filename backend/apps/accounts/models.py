"""The SokoFresh user model.

Created before the first migration, as Django requires for a custom user model
(proposal §7). Customers sign in with their phone number and a one-time SMS
code (ADR-0005), so the phone number is the login identifier and customers have
no usable password. Staff and admin users also have a password for Django admin.

Roles are Django groups (see roles.py): Customer, Rider, Staff, Admin.
"""

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.db.models.functions import Lower, Trim
from django.utils import timezone

from apps.core.phone import InvalidPhoneNumber, mask_phone, normalize_kenyan_mobile

# Database-level rule: phone numbers are stored only in Kenyan E.164 form.
KENYAN_E164_REGEX = r"^\+254[17][0-9]{8}$"


def _normalize_email(email: str | None) -> str | None:
    """Trimmed, lower-case email, or None when empty (one rule for every path)."""
    email = (email or "").strip()
    return BaseUserManager.normalize_email(email).lower() if email else None


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def get_by_natural_key(self, username: str) -> "User":
        # Lets staff type 0712 345 678 at the admin login (finding DB-6).
        try:
            username = normalize_kenyan_mobile(username)
        except InvalidPhoneNumber:
            pass
        return super().get_by_natural_key(username)

    def _create_user(self, phone: str, password: str | None, **extra_fields) -> "User":
        if not phone:
            raise ValueError("A phone number is required.")
        phone = normalize_kenyan_mobile(phone)
        email = _normalize_email(extra_fields.pop("email", None))
        user = self.model(phone=phone, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            # Customers sign in with one-time codes; no password can be used.
            user.set_unusable_password()
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    def create_user(self, phone: str, password: str | None = None, **extra_fields) -> "User":
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(phone, password, **extra_fields)

    def create_superuser(self, phone: str, password: str | None = None, **extra_fields) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True:
            raise ValueError("A superuser must have is_staff=True and is_superuser=True.")
        if not password:
            raise ValueError("A superuser must have a password for Django admin.")
        return self._create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField(
        "phone number",
        max_length=16,
        unique=True,
        help_text="Kenyan mobile number in international form, e.g. +254712345678.",
    )
    phone_verified = models.BooleanField(
        default=False, help_text="True once the user has confirmed a code sent to this number."
    )
    # NULL (not "") when absent, so the conditional unique constraint below allows
    # many users without an email.
    email = models.EmailField("email address", blank=True, null=True)  # noqa: DJ001
    full_name = models.CharField(max_length=150, blank=True)
    is_staff = models.BooleanField(
        default=False, help_text="Can sign in to Django admin (Staff and Admin roles)."
    )
    is_active = models.BooleanField(
        default=True, help_text="Untick instead of deleting the account."
    )
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        constraints = [
            models.CheckConstraint(
                condition=Q(phone__regex=KENYAN_E164_REGEX),
                name="accounts_user_phone_kenyan_e164",
            ),
            # Email is optional; when present it must be unique (case-insensitive).
            models.UniqueConstraint(
                Lower("email"),
                condition=Q(email__isnull=False),
                name="accounts_user_email_unique_ci",
            ),
            # Stored email is NULL or already trimmed and lower-case, so the unique
            # rule above cannot be dodged with "" or spaces (finding DB-3).
            models.CheckConstraint(
                condition=Q(email__isnull=True) | (~Q(email="") & Q(email=Lower(Trim(F("email"))))),
                name="accounts_user_email_normalised",
            ),
            # Every user has a real or deliberately unusable password hash.
            models.CheckConstraint(condition=~Q(password=""), name="accounts_user_password_set"),
        ]

    def __str__(self) -> str:
        # Masked, so lists and logs do not show full numbers.
        return self.full_name or mask_phone(self.phone)

    def clean(self) -> None:
        super().clean()
        if self.phone:
            try:
                self.phone = normalize_kenyan_mobile(self.phone)
            except InvalidPhoneNumber as exc:
                # A form error, not a crash, in Django admin (finding DB-1).
                raise ValidationError({"phone": str(exc)}, code="invalid_phone") from exc
        self.email = _normalize_email(self.email)

    def save(self, *args, **kwargs) -> None:
        # Normalise on every save, not only in forms (DRF does not call clean()).
        self.email = _normalize_email(self.email)
        super().save(*args, **kwargs)

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.full_name.split(" ")[0] if self.full_name else ""
