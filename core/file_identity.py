"""Lightweight file identity helpers.

Future indexing should combine normalized path, file size, mtime, extension,
and optional quick hashes. Full large-video hashing must remain opt-in.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class FileIdentity:
    """Minimal file identity fields that can be captured without heavy IO."""

    path: str
    path_norm: str
    size: int | None = None
    mtime: float | None = None
    extension: str = ""


def identity_from_path(path: str | Path) -> FileIdentity:
    """Create a path-only identity placeholder for future compatibility code."""
    p = Path(path)
    path_text = str(p)
    return FileIdentity(
        path=path_text,
        path_norm=path_text.replace("\\", "/").lower(),
        extension=p.suffix.lower(),
    )

