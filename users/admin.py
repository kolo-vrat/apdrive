from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import DriveUserChangeForm, DriveUserCreationForm
from .models import DriveUser


@admin.register(DriveUser)
class DriveUserAdmin(UserAdmin):
    add_form = DriveUserCreationForm
    form = DriveUserChangeForm
    model = DriveUser
    list_display = [
        "username",
        "email",
    ]
    list_filter = [
        "username",
        "email",
    ]
    ordering = ("username",)
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("email",)}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets
