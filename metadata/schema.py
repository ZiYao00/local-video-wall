"""Shared metadata schema for preview-first AI generation metadata."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


MetadataStatus = Literal["empty", "partial", "ok", "error"]
MetadataSource = Literal["embedded", "sidecar", "ffprobe", "mediainfo", "filesystem", "unknown"]


METADATA_TEXT_FIELDS = (
    "prompt",
    "negative_prompt",
    "model",
    "seed",
    "sampler",
    "source_app",
    "source_url",
    "civitai_model_url",
    "civitai_version_url",
)


@dataclass
class MediaMetadata:
    """Normalized metadata shown in preview panels and later used for search."""

    file_path: str = ""
    media_type: str = ""
    width: int | None = None
    height: int | None = None
    duration: float | None = None
    fps: float | None = None
    codec: str = ""
    format: str = ""
    prompt: str = ""
    negative_prompt: str = ""
    model: str = ""
    loras: list[str] = field(default_factory=list)
    seed: str = ""
    sampler: str = ""
    steps: int | None = None
    cfg_scale: float | None = None
    source_app: str = ""
    source_url: str = ""
    civitai_model_url: str = ""
    civitai_version_url: str = ""
    workflow: Any = None
    raw_metadata: dict[str, Any] = field(default_factory=dict)
    metadata_sources: list[str] = field(default_factory=list)
    metadata_status: MetadataStatus = "empty"

    def has_ai_metadata(self) -> bool:
        """Return whether this object contains user-facing AI generation data."""
        return bool(
            self.prompt
            or self.negative_prompt
            or self.model
            or self.loras
            or self.seed
            or self.sampler
            or self.workflow
            or self.source_url
            or self.civitai_model_url
            or self.civitai_version_url
        )
