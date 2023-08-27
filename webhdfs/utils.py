import subprocess
from . import errors

from requests import Response


def add_user(user_name: str) -> None:
    proc = subprocess.run(["hadoop", "fs", "-mkdir", f"/{user_name}"])
    proc.check_returncode()
    proc = subprocess.run(["hadoop", "fs", "-chmod", "-R", "755", f"/{user_name}"])
    proc.check_returncode()
    proc = subprocess.run(["hadoop", "fs", "-chown", "-R", user_name, f"/{user_name}"])
    proc.check_returncode()


def handle_error(response: Response) -> None:
    response_json = response.json()
    exc = response_json["RemoteException"]

    if exc["exception"] == "IllegalArgumentException":
        raise errors.IllegalArgumentException(exc["message"])
    elif exc["exception"] == "UnsupportedOperationException":
        raise errors.UnsupportedOperationException(exc["message"])
    elif exc["exception"] == "SecurityException":
        raise errors.SecurityException(exc["message"])
    elif exc["exception"] == "IOException":
        raise errors.IOException(exc["message"])
    elif exc["exception"] == "FileNotFoundException":
        raise errors.FileNotFoundException(exc["message"])
    elif exc["exception"] == "RuntimeException":
        raise errors.RuntimeException(exc["message"])
    else:
        raise Exception("An unknown error occurred")
