import json

from dataclasses import dataclass, fields


@dataclass(kw_only=True)
class File:
    """Class that represents a FileStatus object in WebHDFS"""

    accessTime: int
    blockSize: int
    group: str
    length: int
    modificationTime: int
    owner: str
    pathSuffix: str
    permission: str
    replication: str
    type: str

    def __init__(self, **kwargs):
        names = set([f.name for f in fields(self)])
        for k, v in kwargs.items():
            if k in names:
                setattr(self, k, v)

    def to_json_string(self) -> str:
        return json.dumps(self.__dict__)
