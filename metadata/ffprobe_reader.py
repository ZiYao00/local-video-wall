"""Optional ffprobe metadata reader.

ffprobe is used only when it is available on PATH. It must never be mandatory
for app startup or normal media browsing.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

from .embedded_reader import _extract_comfy_metadata, _json_loads, _split_a1111_parameters
from .normalizer import empty_metadata, normalize_metadata
from .schema import MediaMetadata


FFPROBE_TIMEOUT_SECONDS = 8


def _parse_fraction(value: Any) -> float | None:
    text = str(value or "").strip()
    if not text or text == "0/0":
        return None
    if "/" in text:
        left, right = text.split("/", 1)
        try:
            denominator = float(right)
            return float(left) / denominator if denominator else None
        except ValueError:
            return None
    try:
        return float(text)
    except ValueError:
        return None


def _collect_tags(payload: dict[str, Any]) -> dict[str, Any]:
    tags: dict[str, Any] = {}

    def merge(source: Any) -> None:
        if not isinstance(source, dict):
            return
        for key, value in source.items():
            text_key = str(key or "").strip()
            if text_key and value not in (None, ""):
                tags[text_key] = value

    merge(payload.get("format", {}).get("tags") if isinstance(payload.get("format"), dict) else None)
    streams = payload.get("streams")
    if isinstance(streams, list):
        for stream in streams:
            if isinstance(stream, dict):
                merge(stream.get("tags"))
    return tags


def _tag_value(tags: dict[str, Any], *names: str) -> str:
    wanted = {name.casefold() for name in names}
    for key, value in tags.items():
        if str(key).casefold() in wanted and value not in (None, ""):
            return str(value)
    return ""


def _json_from_text(value: str) -> Any:
    text = str(value or "").strip()
    if not text or text[:1] not in {"{", "["}:
        return None
    return _json_loads(text)


def _extract_generation_fields(tags: dict[str, Any]) -> dict[str, Any]:
    data: dict[str, Any] = {}
    prompt_json = _json_from_text(_tag_value(tags, "prompt", "comfyui_prompt"))
    workflow_json = _json_from_text(_tag_value(tags, "workflow", "comfyui_workflow"))

    for container_key in ("comment", "description", "synopsis", "generation_data", "metadata"):
        parsed = _json_from_text(_tag_value(tags, container_key))
        if not isinstance(parsed, dict):
            continue
        prompt_json = prompt_json or parsed.get("prompt")
        workflow_json = workflow_json or parsed.get("workflow")
        for key in (
            "parameters",
            "prompt",
            "positive_prompt",
            "negative_prompt",
            "model",
            "model_name",
            "loras",
            "source_url",
        ):
            if key in parsed and key not in data:
                data[key] = parsed.get(key)

    if prompt_json or workflow_json:
        data.update(_extract_comfy_metadata(prompt_json, workflow_json))
        data["workflow"] = workflow_json or data.get("workflow")
        return data

    parameters = (
        _tag_value(tags, "parameters", "sd_parameters", "generation_parameters")
        or str(data.get("parameters") or "")
    )
    if not parameters:
        for key in ("comment", "description"):
            candidate = _tag_value(tags, key)
            if "\nSteps:" in candidate or "\nNegative prompt:" in candidate:
                parameters = candidate
                break
    if parameters:
        data.update(_split_a1111_parameters(parameters))

    data.setdefault("prompt", _tag_value(tags, "prompt", "positive_prompt", "positive", "description"))
    data.setdefault("negative_prompt", _tag_value(tags, "negative_prompt", "negative"))
    data.setdefault("model", _tag_value(tags, "model", "model_name", "checkpoint", "ckpt_name"))
    data.setdefault("source_url", _tag_value(tags, "source_url", "source", "url"))
    data.setdefault("source_app", _tag_value(tags, "source_app", "software", "encoder", "generator") or "Video metadata")
    return data


def read_ffprobe_metadata(path: str | Path, media_type: str = "video") -> MediaMetadata:
    """Read video container metadata through ffprobe when available."""
    file_path = Path(path)
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return empty_metadata(str(file_path), media_type)
    try:
        completed = subprocess.run(
            [
                ffprobe,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                str(file_path),
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=FFPROBE_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return empty_metadata(str(file_path), media_type)
    if completed.returncode != 0 or not completed.stdout.strip():
        return empty_metadata(str(file_path), media_type)
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return empty_metadata(str(file_path), media_type)

    video_stream = next(
        (
            stream
            for stream in payload.get("streams", [])
            if isinstance(stream, dict) and stream.get("codec_type") == "video"
        ),
        {},
    )
    format_data = payload.get("format") if isinstance(payload.get("format"), dict) else {}
    tags = _collect_tags(payload)
    generation = _extract_generation_fields(tags)
    data: dict[str, Any] = {
        "file_path": str(file_path),
        "media_type": media_type,
        "width": video_stream.get("width"),
        "height": video_stream.get("height"),
        "duration": video_stream.get("duration") or format_data.get("duration"),
        "fps": _parse_fraction(video_stream.get("avg_frame_rate") or video_stream.get("r_frame_rate")),
        "codec": video_stream.get("codec_name"),
        "format": format_data.get("format_name"),
        "raw_metadata": {"ffprobe_tags": tags},
        "metadata_sources": ["ffprobe"],
    }
    data.update(generation)
    return normalize_metadata(data)
