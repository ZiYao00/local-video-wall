"""Metadata extraction and normalization helpers."""

from .normalizer import empty_metadata, metadata_to_dict, normalize_metadata
from .schema import MediaMetadata

__all__ = [
    "MediaMetadata",
    "empty_metadata",
    "metadata_to_dict",
    "normalize_metadata",
]
