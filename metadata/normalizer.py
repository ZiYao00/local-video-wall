"""Metadata normalization boundary.

Readers for embedded metadata, sidecar JSON, and ffprobe output should return
partial data that is normalized here before reaching API or UI code.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .schema import METADATA_TEXT_FIELDS, MediaMetadata


def empty_metadata(file_path: str = "", media_type: str = "") -> MediaMetadata:
    """Return a safe empty metadata object for unsupported or unreadable files."""
    return MediaMetadata(
        file_path=file_path,
        media_type=media_type,
        metadata_status="empty",
    )


def _clean_text(value: Any, limit: int = 20000) -> str:
    text = str(value or "").strip()
    return text[:limit]


def _clean_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _clean_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clean_string_list(value: Any, limit: int = 120) -> list[str]:
    if value is None:
        return []
    raw_items = value if isinstance(value, list) else [value]
    result: list[str] = []
    seen: set[str] = set()
    for item in raw_items:
        text = _clean_text(item, 240)
        key = text.casefold()
        if not text or key in seen:
            continue
        seen.add(key)
        result.append(text)
        if len(result) >= limit:
            break
    return result


def _clean_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _status_for(metadata: MediaMetadata) -> str:
    if metadata.metadata_status == "error":
        return "error"
    if metadata.has_ai_metadata():
        return "ok"
    if any(
        value is not None
        for value in (
            metadata.width,
            metadata.height,
            metadata.duration,
            metadata.fps,
        )
    ) or metadata.codec or metadata.format or metadata.raw_metadata:
        return "partial"
    return "empty"


def normalize_metadata(data: dict[str, Any] | None = None) -> MediaMetadata:
    """Normalize a loose metadata mapping into the shared schema."""
    if not data:
        return empty_metadata()
    metadata = MediaMetadata(
        file_path=_clean_text(data.get("file_path"), 4000),
        media_type=_clean_text(data.get("media_type"), 40),
        width=_clean_int(data.get("width")),
        height=_clean_int(data.get("height")),
        duration=_clean_float(data.get("duration")),
        fps=_clean_float(data.get("fps")),
        codec=_clean_text(data.get("codec"), 120),
        format=_clean_text(data.get("format"), 120),
        loras=_clean_string_list(data.get("loras")),
        steps=_clean_int(data.get("steps")),
        cfg_scale=_clean_float(data.get("cfg_scale")),
        workflow=data.get("workflow"),
        raw_metadata=_clean_dict(data.get("raw_metadata")),
        metadata_sources=_clean_string_list(data.get("metadata_sources"), 20),
        metadata_status="error" if data.get("metadata_status") == "error" else "empty",
    )
    for field_name in METADATA_TEXT_FIELDS:
        setattr(metadata, field_name, _clean_text(data.get(field_name)))
    metadata.metadata_status = _status_for(metadata)  # type: ignore[assignment]
    return metadata


def metadata_to_dict(metadata: MediaMetadata) -> dict[str, Any]:
    """Convert normalized metadata to a JSON-serializable dictionary."""
    return asdict(metadata)


def merge_metadata(*items: MediaMetadata) -> MediaMetadata:
    """Merge metadata objects, keeping earlier non-empty user-facing fields."""
    merged = MediaMetadata()
    raw: dict[str, Any] = {}
    sources: list[str] = []
    for item in items:
        if not isinstance(item, MediaMetadata):
            continue
        for field_name in MediaMetadata.__dataclass_fields__:
            if field_name in {"raw_metadata", "metadata_sources", "metadata_status"}:
                continue
            current = getattr(merged, field_name)
            value = getattr(item, field_name)
            if current in (None, "", []) and value not in (None, "", []):
                setattr(merged, field_name, value)
        if item.raw_metadata:
            key = "+".join(item.metadata_sources) or item.metadata_status
            raw[key or "metadata"] = item.raw_metadata
        for source in item.metadata_sources:
            if source not in sources:
                sources.append(source)
    merged.raw_metadata = raw
    merged.metadata_sources = sources
    merged.metadata_status = _status_for(merged)  # type: ignore[assignment]
    return merged
