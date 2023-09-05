from django.urls import path
from .views import HomeView, DashboardView, webhdfs_view, webhdfs_upload

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("webhdfs/", webhdfs_view, name="webhdfs"),
    path("webhdfs_upload/", webhdfs_upload, name="webhdfs_upload"),
]
