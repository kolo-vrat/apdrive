import json

from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

from webhdfs import api


class HomeView(TemplateView):
    template_name = "home.html"


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"


def webhdfs_view(request):
    host = settings.HADOOP_HOST
    port = settings.HADOOP_PORT
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode())
            operation = data["operation"]
            path = f"/{request.user.username}" + data["path"]
            client = api.WebHDFSClient(host, port, request.user.username)
            if operation == "LISTSTATUS":
                files = client.list_dir(path)
                return JsonResponse([f.__dict__ for f in files], safe=False)
            elif operation == "OPEN":
                file_name = data["file_name"]
                response = StreamingHttpResponse(
                    client.get_file(path, file_name),
                    content_type="application/octet-stream",
                )
                response["Content-Disposition"] = f"attachment; filename={file_name}"
                return response
            elif operation == "MKDIRS":
                dir_name = (
                    data["dir_name"] if data["path"] == "/" else f"/{data['dir_name']}"
                )
                client.create_dir(path, dir_name)
                return JsonResponse({"message": "Directory created successfully"})
            elif operation == "RENAME":
                if data["path"] == "/":
                    current_name = path + data["current_name"]
                    new_name = path + data["new_name"]
                else:
                    current_name = f"{path}/{data['current_name']}"
                    new_name = f"{path}/{data['new_name']}"
                client.rename_file_dir(current_name, new_name)
                return JsonResponse({"message": "Operation was successful"})
            elif operation == "DELETEFILE":
                file_name = (
                    data["file_name"]
                    if data["path"] == "/"
                    else f"/{data['file_name']}"
                )
                client.delete_file(path, file_name)
                return JsonResponse({"message": "Operation was successful"})
            elif operation == "DELETEDIR":
                dir_path = (
                    path + data["dir_name"]
                    if data["path"] == "/"
                    else f"{path}/{data['dir_name']}"
                )
                client.delete_dir(dir_path)
                return JsonResponse({"message": "Operation was successful"})
            else:
                return JsonResponse({"message": "Invalid operation"})
        except Exception as e:
            return JsonResponse({"error": str(e)})
    else:
        return JsonResponse({"error": "Method not supported"})


def webhdfs_upload(request):
    host = settings.HADOOP_HOST
    port = settings.HADOOP_PORT
    if request.method == "POST" and request.FILES.get("file"):
        uploaded_file = request.FILES["file"]
        client = api.WebHDFSClient(host, port, request.user.username)
        client_path = request.headers.get("X-Path")
        path = f"/{request.user.username}" + client_path
        file_name = (
            uploaded_file.name if client_path == "/" else f"/{uploaded_file.name}"
        )
        try:
            client.create_file(path, file_name, uploaded_file.read())
            return JsonResponse({"message": "File uploaded successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)})
    else:
        return JsonResponse({"error": "Method not supported or file not provided"})
