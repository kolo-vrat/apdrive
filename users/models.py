from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    UserManager,
)
from django.utils.translation import gettext_lazy as _
from django.db import models


class DriveUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        if not email:
            email = input("Email address: ")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(username, email, password, **extra_fields)


class DriveUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(
        name="username",
        max_length=100,
        unique=True,
    )
    email = models.EmailField(
        name="email",
        unique=True,
    )
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
    )

    objects = DriveUserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
