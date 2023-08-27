from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from .models import DriveUser


class DriveUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm):
        model = DriveUser
        fields = ("username", "email")


class DriveUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm):
        model = DriveUser
        fields = ("username", "email")
