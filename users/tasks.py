from celery import shared_task
from webhdfs.utils import add_user


@shared_task
def create_user_webhdfs(username: str) -> None:
    add_user(username)
