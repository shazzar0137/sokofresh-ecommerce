"""Django admin for users (ADR-0008: Django admin is the staff tool)."""

from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm

from .models import User


class SokoFreshUserCreationForm(AdminUserCreationForm):
    class Meta:
        model = User
        fields = ("phone",)


class SokoFreshUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"
        field_classes: dict[str, type[forms.Field]] = {}


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = SokoFreshUserChangeForm
    add_form = SokoFreshUserCreationForm

    ordering = ("-date_joined",)
    list_display = (
        "__str__",
        "masked_phone",
        "phone_verified",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "phone_verified", "groups")
    search_fields = ("phone", "full_name", "email")
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        (None, {"fields": ("phone", "phone_verified", "password")}),
        ("Personal details", {"fields": ("full_name", "email")}),
        (
            "Roles and permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone", "usable_password", "password1", "password2"),
            },
        ),
    )

    @admin.display(description="Phone")
    def masked_phone(self, obj: User) -> str:
        from apps.core.phone import mask_phone

        return mask_phone(obj.phone)
