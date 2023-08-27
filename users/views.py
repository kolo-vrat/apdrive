from typing import Any, Dict
from django.contrib import messages
from django.contrib.auth import logout
from django.urls import reverse_lazy
from django.shortcuts import redirect
from django.views.generic.edit import FormView
from django.contrib.auth.views import LoginView

from .forms import DriveUserCreationForm
from .tasks import create_user_webhdfs


class SignUpView(FormView):
    template_name = "registration/signup.html"
    form_class = DriveUserCreationForm
    success_url = reverse_lazy("login")

    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["title"] = "Sign Up"
        return context

    def form_valid(self, form):
        user = form.save()
        task_result = create_user_webhdfs.delay(user.username)

        task_result.wait()

        if task_result.successful():
            messages.success(self.request, "Account created, you can now log in.")
            return super().form_valid(form)
        else:
            user.delete()
            messages.error(self.request, "Sign up failed, please try again!")
            return redirect("signup")


class DriveLoginView(LoginView):
    template_name = "registration/login.html"

    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["title"] = "Login"
        return context


def logout_view(request):
    logout(request)
    return redirect("home")
