"""ffprobe metadata reader boundary.

Future implementations can call ffprobe when it is available. ffprobe must not
be mandatory for the app to start or browse local media.
"""

from __future__ import annotations

from pathlib import Path

from .normalizer import empty_metadata
from .schema import MediaMetadata


def read_ffprobe_metadata(path: str | Path, media_type: str = "video") -> MediaMetadata:
    """Return safe empty metadata until ffprobe integration is implemented."""
    return empty_metadata(str(path), media_type)

