"""UTF-8 JSON persistence helpers."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any


JsonObject = dict[str, Any]


def describe_json_path(path: str | Path) -> Path:
    """Return a normalized Path object for a future JSON store operation."""
    return Path(path)


def read_json_file(path: str | Path, default: Any = None) -> Any:
    """Read a UTF-8 JSON file and return default if it is missing or invalid."""
    json_path = Path(path)
    if not json_path.exists():
        return default
    try:
        with json_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError, UnicodeError):
        return default


def write_json_file(path: str | Path, data: Any, *, indent: int = 2) -> None:
    """Write UTF-8 JSON via a same-directory temp file, then replace target."""
    json_path = Path(path)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    fd = -1
    temp_name = ""
    try:
        fd, temp_name = tempfile.mkstemp(
            prefix=f".{json_path.name}.",
            suffix=".tmp",
            dir=str(json_path.parent),
            text=True,
        )
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            fd = -1
            json.dump(data, handle, ensure_ascii=False, indent=indent)
            handle.write("\n")
        Path(temp_name).replace(json_path)
    finally:
        if fd != -1:
            os.close(fd)
        if temp_name:
            temp_path = Path(temp_name)
            if temp_path.exists():
                temp_path.unlink()
