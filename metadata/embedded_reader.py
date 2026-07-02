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


def _comfy_node_map(prompt: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(prompt, dict):
        return {}
    return {str(key): node for key, node in prompt.items() if isinstance(node, dict)}


def _iter_workflow_nodes(workflow: Any) -> Iterable[dict[str, Any]]:
    if not isinstance(workflow, dict):
        return []
    nodes = workflow.get("nodes")
    if not isinstance(nodes, list):
        return []
    return [node for node in nodes if isinstance(node, dict)]


def _extract_loras(values: Iterable[Any]) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()

    def add_lora(name: Any, weight: Any = None) -> None:
        text = str(name or "").strip()
        if not text:
            return
        if isinstance(weight, (int, float, str)) and str(weight).strip() not in {"", "0", "0.0"}:
            text = _format_lora_display(text, str(weight).strip())
        key = text.casefold()
        if key not in seen:
            seen.add(key)
            found.append(text)

    for value in values:
        if isinstance(value, dict):
            for key, item in value.items():
                key_text = str(key or "").casefold()
                if "lora" in key_text and item not in (None, "", False):
                    add_lora(item)
            continue
        text = str(value or "")
        for match in re.finditer(r"<lora:([^:>]+)(?::[^>]+)?>", text, flags=re.IGNORECASE):
            weight_match = re.match(r"<lora:[^:>]+:([^>]+)>", match.group(0), flags=re.IGNORECASE)
            add_lora(match.group(1).strip(), weight_match.group(1).strip() if weight_match else None)
    return found


def _add_unique_text(target: list[str], value: Any) -> None:
    text = str(value or "").strip()
    if text and text.casefold() not in {item.casefold() for item in target}:
        target.append(text)


def _clean_strength(value: Any) -> str:
    if value in (None, "", False):
        return ""
    if isinstance(value, bool):
        return ""
    try:
        number = float(value)
    except (TypeError, ValueError):
        text = str(value or "").strip()
        return text if text and text.casefold() not in {"true", "false", "on", "off"} else ""
    return f"{number:g}"


def _format_lora_display(name: Any, *strength_values: tuple[str, Any] | Any) -> str:
    text = str(name or "").strip()
    if not text:
        return ""
    parts: list[str] = []
    for value in strength_values:
        label = ""
        raw = value
        if isinstance(value, tuple):
            label, raw = value
        strength = _clean_strength(raw)
        if not strength:
            continue
        parts.append(f"{label} {strength}".strip())
    return f"{text} - {' / '.join(parts)}" if parts else text


def _looks_like_prompt_text(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    text = value.strip()
    if len(text) < 3:
        return False
    lowered = text.casefold()
    if lowered.startswith(("http://", "https://")):
        return False
    if lowered.endswith((".safetensors", ".ckpt", ".pt", ".pth", ".onnx", ".json", ".png", ".jpg", ".jpeg", ".webp")):
        return False
    if re.fullmatch(r"[\d\s.,:;_+\-\\/]+", text):
        return False
    return True


def _is_link_value(value: Any) -> bool:
    return isinstance(value, (list, tuple)) and len(value) == 2 and isinstance(value[1], int)


def _is_model_loader_class(class_type: str) -> bool:
    lowered = class_type.casefold()
    if any(token in lowered for token in ("lora", "vae", "clip", "controlnet", "upscale", "embedding")):
        return False
    compact = re.sub(r"[\s_\-]+", "", lowered)
    return (
        "checkpoint" in lowered
        or "ckpt" in lowered
        or "unet" in lowered
        or "diffusion" in lowered
        or ("model" in lowered and "loader" in lowered)
        or "modelload" in compact
    )


def _looks_like_model_name(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    text = value.strip()
    if len(text) < 2:
        return False
    lowered = text.casefold()
    if lowered in {"none", "default", "auto", "cpu", "cuda", "fp8", "fp16", "bf16", "float16", "float32"}:
        return False
    if lowered.startswith(("http://", "https://")):
        return False
    if text[:1] in {"{", "["}:
        return False
    if re.fullmatch(r"[\d\s.,:;_+\-\\/]+", text):
        return False
    return True


def _extract_models_from_inputs(class_type: str, inputs: dict[str, Any]) -> list[str]:
    found: list[str] = []
    if not _is_model_loader_class(class_type):
        return found
    key_tokens = ("ckpt", "checkpoint", "unet", "diffusion", "model")
    skip_tokens = ("strength", "weight", "clip", "vae", "lora", "control", "dtype", "precision")
    for key, value in inputs.items():
        if _is_link_value(value):
            continue
        key_fold = str(key or "").casefold()
        if not any(token in key_fold for token in key_tokens):
            continue
        if any(token in key_fold for token in skip_tokens):
            continue
        if _looks_like_model_name(value):
            _add_unique_text(found, value)
    return found


def _extract_models_from_workflow(workflow: Any) -> list[str]:
    found: list[str] = []
    for node in _iter_workflow_nodes(workflow):
        class_type = str(node.get("type") or node.get("class_type") or node.get("title") or "")
        if not _is_model_loader_class(class_type):
            continue
        for key in ("properties", "inputs"):
            value = node.get(key)
            if isinstance(value, dict):
                for model in _extract_models_from_inputs(class_type, value):
                    _add_unique_text(found, model)
        widgets = node.get("widgets_values")
        if isinstance(widgets, list):
            for value in widgets:
                if _looks_like_model_name(value):
                    _add_unique_text(found, value)
                    break
    return found


def _text_kind_from_key(key: Any, class_type: str = "") -> str:
    text = f"{key or ''} {class_type}".casefold()
    if any(token in text for token in ("negative", "neg_prompt", "negative_prompt", "uncond")):
        return "negative"
    if any(token in text for token in ("positive", "pos_prompt", "positive_prompt")):
        return "positive"
    if any(token in text for token in ("prompt", "wildcard", "text", "caption", "string")):
        return "positive"
    return ""


def _extract_prompt_texts_from_inputs(class_type: str, inputs: dict[str, Any]) -> tuple[list[str], list[str], list[str]]:
    positives: list[str] = []
    negatives: list[str] = []
    clip_texts: list[str] = []
    class_key = class_type.casefold()
    prompt_like_class = any(token in class_key for token in ("prompt", "wildcard", "textencode", "cliptextencode", "conditioning"))
    for key, value in inputs.items():
        if not _looks_like_prompt_text(value):
            continue
        kind = _text_kind_from_key(key, class_type)
        if key == "text" and "cliptextencode" in class_key:
            _add_unique_text(clip_texts, value)
            continue
        if kind == "negative":
            _add_unique_text(negatives, value)
        elif kind == "positive":
            _add_unique_text(positives, value)
        elif prompt_like_class:
            _add_unique_text(positives, value)
    return positives, negatives, clip_texts


def _extract_prompt_texts_from_workflow(workflow: Any) -> tuple[list[str], list[str]]:
    positives: list[str] = []
    negatives: list[str] = []
    for node in _iter_workflow_nodes(workflow):
        class_type = str(node.get("type") or node.get("class_type") or node.get("title") or "")
        kind = _text_kind_from_key("", class_type)
        prompt_like = bool(kind) or any(token in class_type.casefold() for token in ("wildcard", "text", "prompt", "conditioning"))
        widgets = node.get("widgets_values")
        if not isinstance(widgets, list) or not prompt_like:
            continue
        for value in widgets:
            if not _looks_like_prompt_text(value):
                continue
            if kind == "negative":
                _add_unique_text(negatives, value)
            else:
                _add_unique_text(positives, value)
    return positives, negatives


def _linked_node_id(value: Any) -> str:
    if isinstance(value, (list, tuple)) and value:
        first = value[0]
        if isinstance(first, (int, str)):
            return str(first)
    return ""


def _is_sampler_node(class_type: str) -> bool:
    class_key = class_type.casefold()
    return "ksampler" in class_key or class_key in {"samplercustom", "samplercustomadvanced"}


def _prompt_input_values(inputs: dict[str, Any], class_type: str) -> Iterable[Any]:
    class_key = class_type.casefold()
    prompt_like_class = any(token in class_key for token in ("prompt", "wildcard", "string", "text", "cliptextencode"))
    for key, value in inputs.items():
        key_fold = str(key or "").casefold()
        if _linked_node_id(value):
            yield value
            continue
        if key_fold in {"seed", "steps", "cfg", "cfg_scale", "sampler_name", "scheduler"}:
            continue
        if any(token in key_fold for token in ("function", "expression", "script", "code", "mode", "operation")):
            continue
        if any(token in key_fold for token in ("prompt", "text", "string", "wildcard", "caption")) or prompt_like_class:
            yield value


def _resolve_prompt_chain(node_id: str, nodes: dict[str, dict[str, Any]], visited: set[str] | None = None) -> list[str]:
    if not node_id or node_id not in nodes:
        return []
    if visited is None:
        visited = set()
    if node_id in visited or len(visited) > 80:
        return []
    visited.add(node_id)
    node = nodes[node_id]
    class_type = str(node.get("class_type") or "")
    inputs = node.get("inputs") if isinstance(node.get("inputs"), dict) else {}
    result: list[str] = []
    for value in _prompt_input_values(inputs, class_type):
        linked_id = _linked_node_id(value)
        if linked_id:
            for text in _resolve_prompt_chain(linked_id, nodes, visited):
                _add_unique_text(result, text)
            continue
        if _looks_like_prompt_text(value):
            _add_unique_text(result, value)
    return result


def _extract_sampler_prompts(prompt: Any) -> tuple[list[str], list[str]]:
    nodes = _comfy_node_map(prompt)
    positives: list[str] = []
    negatives: list[str] = []
    for node in nodes.values():
        class_type = str(node.get("class_type") or "")
        if not _is_sampler_node(class_type):
            continue
        inputs = node.get("inputs") if isinstance(node.get("inputs"), dict) else {}
        positive_link = _linked_node_id(inputs.get("positive") or inputs.get("positive_conditioning"))
        negative_link = _linked_node_id(inputs.get("negative") or inputs.get("negative_conditioning"))
        for text in _resolve_prompt_chain(positive_link, nodes):
            _add_unique_text(positives, text)
        for text in _resolve_prompt_chain(negative_link, nodes):
            _add_unique_text(negatives, text)
    return positives, negatives


def _extract_loras_from_comfy_inputs(class_type: str, inputs: dict[str, Any]) -> list[str]:
    class_key = class_type.casefold()
    found: list[str] = []
    lora_like_class = "lora" in class_key or "loraloader" in class_key

    def strength_for(key: str) -> list[tuple[str, Any]]:
        key_fold = key.casefold()
        suffix = ""
        match = re.search(r"(?:lora|name|model_name|lora_name)[_\- ]*(\d+)$", key_fold)
        if match:
            suffix = match.group(1)
        candidates: list[tuple[str, str]] = []
        if suffix:
            candidates.extend([
                ("model", f"model_strength_{suffix}"),
                ("clip", f"clip_strength_{suffix}"),
                ("strength", f"strength_{suffix}"),
                ("weight", f"weight_{suffix}"),
            ])
        candidates.extend([
            ("model", "strength_model"),
            ("clip", "strength_clip"),
            ("model", "model_strength"),
            ("clip", "clip_strength"),
            ("strength", "strength"),
            ("weight", "weight"),
        ])
        result: list[tuple[str, Any]] = []
        for label, candidate in candidates:
            if candidate in inputs:
                result.append((label, inputs.get(candidate)))
        return result

    def add_lora(value: Any) -> None:
        if isinstance(value, dict):
            nested = (
                value.get("name")
                or value.get("modelName")
                or value.get("lora_name")
                or value.get("model_name")
                or value.get("lora")
            )
            _add_unique_text(
                found,
                _format_lora_display(
                    nested,
                    ("model", value.get("strength_model") or value.get("model_strength")),
                    ("clip", value.get("strength_clip") or value.get("clip_strength")),
                    ("strength", value.get("strength")),
                    ("weight", value.get("weight")),
                ),
            )
            return
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return
            parsed = _json_loads(text) if text[:1] in {"{", "["} else None
            if isinstance(parsed, (dict, list)):
                for item in _extract_loras_from_value(parsed):
                    _add_unique_text(found, item)
                return
        _add_unique_text(found, value)

    for key, value in inputs.items():
        key_text = str(key or "")
        key_fold = key_text.casefold()
        if value in (None, "", False):
            continue
        if any(token in key_fold for token in ("strength", "weight", "enabled", "enable", "switch", "bypass")):
            continue
        if "lora" not in key_fold and not (lora_like_class and key_fold in {"model_name", "name"}):
            continue
        if isinstance(value, (list, tuple)):
            for item in value:
                add_lora(item)
            continue
        if isinstance(value, str) and not value.strip()[:1] in {"{", "["}:
            _add_unique_text(found, _format_lora_display(value, *strength_for(key_text)))
        else:
            add_lora(value)
    return found


def _extract_loras_from_value(value: Any) -> list[str]:
    result: list[str] = []
    if isinstance(value, dict):
        if value.get("enabled") is False or value.get("on") is False or value.get("bypass") is True:
            return result
        is_lora_record = (
            "lora" in str(value.get("type") or "").casefold()
            or any("lora" in str(key or "").casefold() for key in value.keys())
            or any(key in value for key in ("modelName", "model_name"))
        )
        name = (
            (value.get("name") if is_lora_record else "")
            or value.get("modelName")
            or value.get("lora_name")
            or value.get("model_name")
            or value.get("lora")
        )
        _add_unique_text(
            result,
            _format_lora_display(
                name,
                ("model", value.get("strength_model") or value.get("model_strength")),
                ("clip", value.get("strength_clip") or value.get("clip_strength")),
                ("strength", value.get("strength")),
                ("weight", value.get("weight")),
            ),
        )
        for key, item in value.items():
            key_fold = str(key or "").casefold()
            if any(token in key_fold for token in ("strength", "weight", "enabled", "enable", "switch", "bypass", "on")):
                continue
            if key_fold in {"name", "modelname", "model_name", "lora_name", "lora"} and name:
                continue
            if "lora" in key_fold or key_fold in {"modelname", "model_name"}:
                for nested in _extract_loras_from_value(item):
                    _add_unique_text(result, nested)
        return result
    if isinstance(value, list):
        for item in value:
            for nested in _extract_loras_from_value(item):
                _add_unique_text(result, nested)
        return result
    if isinstance(value, str):
        text = value.strip()
        if not text or text.casefold() in {"true", "false", "on", "off", "enabled", "disabled"}:
            return result
        if re.fullmatch(r"[\d\s.,:;_+\-\\/]+", text):
            return result
        if text[:1] in {"{", "["}:
            parsed = _json_loads(text)
            if isinstance(parsed, (dict, list)):
                for nested in _extract_loras_from_value(parsed):
                    _add_unique_text(result, nested)
                return result
        if text.lower().endswith((".safetensors", ".ckpt", ".pt", ".pth")) or "lora" in text.casefold():
            _add_unique_text(result, text)
    return result


def _extract_loras_from_rgthree_widgets(widgets: list[Any]) -> list[str]:
    found: list[str] = []
    skip_next = False
    for index, value in enumerate(widgets):
        if skip_next:
            skip_next = False
            continue
        if value in (False, None, ""):
            continue
        if isinstance(value, bool):
            continue
        items = _extract_loras_from_value(value)
        if items and isinstance(value, str):
            next_one = widgets[index + 1] if index + 1 < len(widgets) else None
            next_two = widgets[index + 2] if index + 2 < len(widgets) else None
            if _clean_strength(next_one) and _clean_strength(next_two):
                items = [_format_lora_display(item, ("model", next_one), ("clip", next_two)) for item in items]
            elif _clean_strength(next_one):
                items = [_format_lora_display(item, ("strength", next_one)) for item in items]
        for item in items:
            _add_unique_text(found, item)
        if isinstance(value, str) and value.strip().casefold() in {"off", "disabled", "bypassed"}:
            skip_next = True
    return found


def _extract_loras_from_workflow(workflow: Any) -> list[str]:
    found: list[str] = []
    for node in _iter_workflow_nodes(workflow):
        class_type = str(node.get("type") or node.get("class_type") or node.get("title") or "")
        if "lora" not in class_type.casefold():
            continue
        widgets = node.get("widgets_values")
        if isinstance(widgets, list):
            for lora in _extract_loras_from_rgthree_widgets(widgets):
                _add_unique_text(found, lora)
        for key in ("properties", "widgets", "inputs"):
            value = node.get(key)
            for lora in _extract_loras_from_value(value):
                _add_unique_text(found, lora)
    return found


def _extract_comfy_metadata(prompt: Any, workflow: Any) -> dict[str, Any]:
    sampler_positives, sampler_negatives = _extract_sampler_prompts(prompt)
    fallback_positives: list[str] = []
    fallback_negatives: list[str] = []
    clip_texts: list[str] = []
    models: list[str] = []
    loras: list[str] = []
    for node in _iter_comfy_nodes(prompt):
        class_type = str(node.get("class_type") or "")
        inputs = node.get("inputs") if isinstance(node.get("inputs"), dict) else {}
        node_positives, node_negatives, node_clip_texts = _extract_prompt_texts_from_inputs(class_type, inputs)
        for text in node_positives:
            _add_unique_text(fallback_positives, text)
        for text in node_negatives:
            _add_unique_text(fallback_negatives, text)
        for text in node_clip_texts:
            _add_unique_text(clip_texts, text)
        for model in _extract_models_from_inputs(class_type, inputs):
            _add_unique_text(models, model)
        for lora in _extract_loras_from_comfy_inputs(class_type, inputs):
            _add_unique_text(loras, lora)
    workflow_positives, workflow_negatives = _extract_prompt_texts_from_workflow(workflow)
    for text in workflow_positives:
        _add_unique_text(fallback_positives, text)
    for text in workflow_negatives:
        _add_unique_text(fallback_negatives, text)
    for lora in _extract_loras_from_workflow(workflow):
        _add_unique_text(loras, lora)
    for model in _extract_models_from_workflow(workflow):
        _add_unique_text(models, model)
    if not fallback_positives and clip_texts:
        _add_unique_text(fallback_positives, clip_texts[0])
    if not fallback_negatives and len(clip_texts) > 1:
        _add_unique_text(fallback_negatives, clip_texts[1])
    positive_prompts = sampler_positives or fallback_positives
    negative_prompts = sampler_negatives or fallback_negatives
    return {
        "source_app": "ComfyUI",
        "prompt": "\n\n".join(positive_prompts),
        "negative_prompt": "\n\n".join(negative_prompts),
        "model": models[0] if models else "",
        "loras": loras or _extract_loras([*positive_prompts, *negative_prompts, *clip_texts]),
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
