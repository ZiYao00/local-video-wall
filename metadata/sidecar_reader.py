"""Same-name sidecar JSON reader."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from core.json_store import read_json_file

from .normalizer import empty_metadata, normalize_metadata
from .schema import MediaMetadata


SIDECAR_SUFFIXES = (
    ".json",
    ".info.json",
    ".civitai.json",
)


def candidate_sidecar_paths(path: str | Path) -> list[Path]:
    """Return sidecar JSON candidates for a media path without reading them."""
    media_path = Path(path)
    candidates = [media_path.with_suffix(suffix) for suffix in SIDECAR_SUFFIXES]
    candidates.insert(1, media_path.with_name(f"{media_path.name}.json"))
    seen: set[str] = set()
    result: list[Path] = []
    for candidate in candidates:
        key = str(candidate).casefold()
        if key not in seen:
            seen.add(key)
            result.append(candidate)
    return result


def _first_text(data: dict[str, Any], keys: tuple[str, ...]) -> str:
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return str(value)
    return ""


def _extract_loras(value: Any) -> list[str]:
    if isinstance(value, dict):
        result = []
        for key, item in value.items():
            if isinstance(item, dict):
                name = item.get("name") or item.get("modelName") or item.get("lora_name") or item.get("model_name") or key
            else:
                name = item or key
            text = str(name or "").strip()
            if text:
                result.append(text)
        return result
    if isinstance(value, list):
        result = []
        for item in value:
            if isinstance(item, dict):
                name = item.get("name") or item.get("modelName") or item.get("lora_name") or item.get("model_name")
            else:
                name = item
            text = str(name or "").strip()
            if text:
                result.append(text)
        return result
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _collect_lora_fields(data: dict[str, Any]) -> list[str]:
    result: list[str] = []
    for key in (
        "loras",
        "lora",
        "Lora",
        "lora_names",
        "loraNames",
        "additional_networks",
        "additionalNetworks",
        "additional_networks_info",
        "additionalNetworksInfo",
    ):
        result.extend(_extract_loras(data.get(key)))
    seen: set[str] = set()
    unique: list[str] = []
    for item in result:
        text = str(item or "").strip()
        key = text.casefold()
        if text and key not in seen:
            seen.add(key)
            unique.append(text)
    return unique


def _normalize_sidecar_mapping(data: dict[str, Any], sidecar_path: Path, media_path: Path) -> MediaMetadata:
    resources = data.get("resources") if isinstance(data.get("resources"), list) else []
    resource_loras = [
        item.get("name") or item.get("modelName")
        for item in resources
        if isinstance(item, dict) and "lora" in str(item.get("type") or "").casefold()
    ]
    model_from_resources = next(
        (
            item.get("name") or item.get("modelName")
            for item in resources
            if isinstance(item, dict) and str(item.get("type") or "").casefold() in {"checkpoint", "model"}
        ),
        "",
    )
    normalized = {
        "file_path": str(media_path),
        "media_type": "video" if media_path.suffix.lower() in {".mp4", ".webm", ".mov", ".m4v"} else "image",
        "prompt": _first_text(data, ("prompt", "positive_prompt", "positive", "Prompt")),
        "negative_prompt": _first_text(data, ("negative_prompt", "negativePrompt", "negative", "Negative prompt")),
        "model": _first_text(data, ("model", "model_name", "modelName", "checkpoint", "ckpt_name")) or model_from_resources,
        "loras": _collect_lora_fields(data) + [str(v) for v in resource_loras if v],
        "seed": _first_text(data, ("seed", "Seed")),
        "sampler": _first_text(data, ("sampler", "Sampler")),
        "steps": data.get("steps") or data.get("Steps"),
        "cfg_scale": data.get("cfg_scale") or data.get("cfgScale") or data.get("CFG scale"),
        "source_app": _first_text(data, ("source_app", "sourceApp", "app", "generator")),
        "source_url": _first_text(data, ("source_url", "sourceUrl", "url", "downloadUrl")),
        "civitai_model_url": _first_text(data, ("civitai_model_url", "modelUrl")),
        "civitai_version_url": _first_text(data, ("civitai_version_url", "versionUrl")),
        "workflow": data.get("workflow"),
        "raw_metadata": {"sidecar_path": str(sidecar_path), "sidecar": data},
        "metadata_sources": ["sidecar"],
    }
    return normalize_metadata(normalized)


def read_sidecar_metadata(path: str | Path) -> MediaMetadata:
    """Read the first matching sidecar JSON file for a media path."""
    media_path = Path(path)
    for candidate in candidate_sidecar_paths(media_path):
        data = read_json_file(candidate, None)
        if isinstance(data, dict):
            return _normalize_sidecar_mapping(data, candidate, media_path)
    return empty_metadata(str(media_path), "video" if media_path.suffix.lower() in {".mp4", ".webm", ".mov", ".m4v"} else "image")
