import requests

from os import path as pathtools
from urllib.parse import quote
from .models import File
from .utils import handle_error


class WebHDFSClient:
    CHUNK_SIZE = 8192

    def __init__(self, host: str, port: int, user_name: str) -> None:
        self.url = f"http://{host}:{port}/webhdfs/v1"
        self.user_name = user_name

    def check_status(self, path: str) -> bool:
        url = self._get_encoded_url(self.url + path + "?op=GETFILESTATUS")
        response = requests.get(url)
        return response.status_code == 200

    # Directory management
    # create
    def create_dir(self, path: str, name: str, permission: int = 740) -> None:
        queries = f"?op=MKDIRS&permission={permission}&user.name={self.user_name}"
        url = self._get_encoded_url(self.url + path + name + queries)
        response = requests.put(url)
        if response.status_code >= 400:
            handle_error(response)

    # rename
    def rename_file_dir(self, path: str, name: str) -> None:
        parent_path = self._get_parent_path(path)
        new_path = parent_path + name
        queries = f"?op=RENAME&destination={new_path}&user.name={self.user_name}"
        url = self._get_encoded_url(self.url + path + queries)
        response = requests.put(url)
        if response.status_code >= 400:
            handle_error(response)

    # delete
    def delete_dir(self, path: str, recursive: bool = True) -> None:
        queries = f"?op=DELETE&recursive={'true' if recursive else 'false'}&user.name={self.user_name}"
        url = self._get_encoded_url(self.url + path + queries)
        response = requests.delete(url)
        if response.status_code >= 400:
            handle_error(response)

    # list
    def list_dir(self, path: str) -> list[File]:
        queries = f"?op=LISTSTATUS&user.name={self.user_name}"
        json_response = self._get_response_json(path, queries)
        files = []

        try:
            json_files = json_response["FileStatuses"]["FileStatus"]
        except KeyError:
            raise ValueError("JSON data is not valid")

        for file in json_files:
            files.append(File(**file))

        return files

    # File management
    # open
    def get_file(self, path: str, file_name: str) -> None:
        queries = f"?op=OPEN&user.name={self.user_name}"
        url = self._get_encoded_url(self.url + path + file_name + queries)
        response = requests.get(url, stream=True)

        status_code = response.status_code
        if status_code == 200:
            for chunk in response.iter_content(chunk_size=self.CHUNK_SIZE):
                yield chunk
        else:
            handle_error(response)

        response.close()

    # create
    def create_file(self, path: str, file_name: str, file_data: bytes) -> None:
        queries = f"?op=CREATE&user.name={self.user_name}&overwrite=true"
        headers = {"Content-Type": "application/octet-stream"}
        url = self._get_encoded_url(self.url + path + file_name + queries)
        response = requests.put(
            url,
            headers=headers,
            data=file_data,
        )
        if response.status_code >= 400:
            handle_error(response)

        response.close()

    # delete
    def delete_file(self, path: str, file_name: str) -> None:
        queries = f"?op=DELETE&user.name={self.user_name}"
        url = self._get_encoded_url(self.url + path + file_name + queries)
        response = requests.delete(url)
        if response.status_code >= 400:
            handle_error(response)

    def _get_response_json(self, path: str, queries: str) -> dict:
        url = self._get_encoded_url(self.url + path + queries)
        response = requests.get(url)

        if response.status_code >= 400:
            handle_error(response)

        try:
            json_response = response.json()
        except requests.exceptions.JSONDecodeError:
            raise ValueError("Got an invalid JSON")

        return json_response

    def _get_parent_path(self, path: str) -> str:
        return pathtools.split(pathtools.split(path)[0])[0] + "/"

    def _get_encoded_url(self, url: str) -> str:
        return quote(url, safe="/:?=&")
