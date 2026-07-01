"""Embedded metadata reader.

This first implementation is dependency-free and focuses on PNG text chunks,
which commonly contain Stable Diffusion WebUI / A1111 `parameters` and ComfyUI
`prompt` / `workflow` metadata.
"""

from __future__ import annotations

import json
import re
import struct
import zlib
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from .normalizer import empty_metadata, normalize_metadata
from .schema import MediaMetadata


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
TEXT_CHUNKS = {b"tEXt", b"zTXt", b"iTXt"}
MAX_TEXT_CHUNK_BYTES = 16 * 1024 * 1024


def _read_png_text_chunks(path: Path) -> dict[str, Any]:
    text_chunks: dict[str, Any] = {}
    with path.open("rb") as handle:
        if handle.read(8) != PNG_SIGNATURE:
            return text_chunks
        while True:
            header = handle.read(8)
            if len(header) != 8:
                break
            length, chunk_type = struct.unpack(">I4s", header)
            if length > MAX_TEXT_CHUNK_BYTES and chunk_type in TEXT_CHUNKS:
                handle.seek(length + 4, 1)
                continue
            if chunk_type in TEXT_CHUNKS:
                data = handle.read(length)
            else:
                handle.seek(length, 1)
                data = b""
            handle.seek(4, 1)
            if chunk_type == b"IEND":
                break
            if chunk_type not in TEXT_CHUNKS:
                continue
            parsed = _parse_png_text_chunk(chunk_type, data)
            if parsed:
                key, value = parsed
                text_chunks[key] = value
    return text_chunks


def _decode_text(data: bytes) -> str:
    return data.decode("utf-8", errors="replace").strip()


def _parse_png_text_chunk(chunk_type: bytes, data: bytes) -> tuple[str, str] | None:
    if chunk_type == b"tEXt":
        if b"\x00" not in data:
            return None
        key, value = data.split(b"\x00", 1)
        return _decode_text(key), _decode_text(value)
    if chunk_type == b"zTXt":
        parts = data.split(b"\x00", 2)
        if len(parts) != 3:
            return None
        key, compression_method, compressed = parts
        if compression_method != b"\x00":
            return None
        try:
            value = zlib.decompress(compressed)
        except zlib.error:
            return None
        return _decode_text(key), _decode_text(value)
    if chunk_type == b"iTXt":
        parts = data.split(b"\x00", 4)
        if len(parts) != 5:
            return None
        key, compression_flag, compression_method, _language, rest = parts
        if b"\x00" not in rest:
            return None
        _translated, text = rest.split(b"\x00", 1)
        if compression_flag == b"\x01" and compression_method == b"\x00":
            try:
                text = zlib.decompress(text)
            except zlib.error:
                return None
        return _decode_text(key), _decode_text(text)
    return None


def _split_a1111_parameters(raw: str) -> dict[str, Any]:
    data: dict[str, Any] = {
        "prompt": raw,
        "source_app": "Stable Diffusion WebUI",
    }
    prompt_text = raw
    negative_text = ""
    params_text = ""
    if "\nNegative prompt:" in raw:
        prompt_text, tail = raw.split("\nNegative prompt:", 1)
        if "\nSteps:" in tail:
            negative_text, params_tail = tail.split("\nSteps:", 1)
            params_text = f"Steps:{params_tail}"
        else:
            negative_text = tail
    elif "\nSteps:" in raw:
        prompt_text, params_tail = raw.split("\nSteps:", 1)
        params_text = f"Steps:{params_tail}"
    data["prompt"] = prompt_text.strip()
    data["negative_prompt"] = negative_text.strip()
    for match in re.finditer(r"([A-Za-z][A-Za-z ]+):\s*([^,\n]+)", params_text):
        key = match.group(1).strip().casefold()
        value = match.group(2).strip()
        if key == "steps":
            data["steps"] = value
        elif key == "sampler":
            data["sampler"] = value
        elif key == "cfg scale":
            data["cfg_scale"] = value
        elif key == "seed":
            data["seed"] = value
        elif key == "model":
            data["model"] = value
    data["loras"] = _extract_loras([data.get("prompt", ""), data.get("negative_prompt", "")])
    return data


def _json_loads(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


def _iter_comfy_nodes(prompt: Any) -> Iterable[dict[str, Any]]:
    if not isinstance(prompt, dict):
        return []
    nodes = prompt.values() if all(isinstance(key, str) for key in prompt.keys()) else []
    return [node for node in nodes if isinstance(node, dict)]


def _extract_loras(values: Iterable[Any]) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = str(value or "")
        for match in re.finditer(r"<lora:([^:>]+)(?::[^>]+)?>", text, flags=re.IGNORECASE):
            name = match.group(1).strip()
            key = name.casefold()
            if name and key not in seen:
                seen.add(key)
                found.append(name)
    return found


def _extract_comfy_metadata(prompt: Any, workflow: Any) -> dict[str, Any]:
    text_prompts: list[str] = []
    models: list[str] = []
    loras: list[str] = []
    for node in _iter_comfy_nodes(prompt):
        class_type = str(node.get("class_type") or "")
        inputs = node.get("inputs") if isinstance(node.get("inputs"), dict) else {}
        if "CLIPTextEncode" in class_type and inputs.get("text"):
            text_prompts.append(str(inputs.get("text") or "").strip())
        if class_type in {"CheckpointLoaderSimple", "CheckpointLoader"} and inputs.get("ckpt_name"):
            models.append(str(inputs.get("ckpt_name") or "").strip())
        if "LoraLoader" in class_type and inputs.get("lora_name"):
            loras.append(str(inputs.get("lora_name") or "").strip())
    return {
        "source_app": "ComfyUI",
        "prompt": text_prompts[0] if text_prompts else "",
        "negative_prompt": text_prompts[1] if len(text_prompts) > 1 else "",
        "model": models[0] if models else "",
        "loras": loras or _extract_loras(text_prompts),
        "workflow": workflow,
    }


def read_embedded_metadata(path: str | Path, media_type: str = "") -> MediaMetadata:
    """Read dependency-free embedded metadata for supported image files."""
    file_path = Path(path)
    if file_path.suffix.lower() != ".png":
        return empty_metadata(str(file_path), media_type)
    try:
        chunks = _read_png_text_chunks(file_path)
    except OSError:
        return empty_metadata(str(file_path), media_type)
    if not chunks:
        return empty_metadata(str(file_path), media_type)
    data: dict[str, Any] = {
        "file_path": str(file_path),
        "media_type": media_type or "image",
        "raw_metadata": chunks,
        "metadata_sources": ["embedded"],
    }
    if isinstance(chunks.get("parameters"), str):
        data.update(_split_a1111_parameters(chunks["parameters"]))
    prompt_json = _json_loads(chunks.get("prompt", "")) if isinstance(chunks.get("prompt"), str) else None
    workflow_json = _json_loads(chunks.get("workflow", "")) if isinstance(chunks.get("workflow"), str) else None
    if prompt_json or workflow_json:
        data.update(_extract_comfy_metadata(prompt_json, workflow_json))
        data["workflow"] = workflow_json or data.get("workflow")
    return normalize_metadata(data)
