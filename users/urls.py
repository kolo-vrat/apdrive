from django.urls import path

from .views import logout_view, SignUpView, DriveLoginView

urlpatterns = [
    path("login/", DriveLoginView.as_view(), name="login"),
    path("logout/", logout_view, name="logout"),
    path("signup/", SignUpView.as_view(), name="signup"),
]
