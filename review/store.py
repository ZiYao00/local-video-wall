"""Review-data compatibility and normalization helpers."""

from __future__ import annotations

from typing import Any

from .schema import CURRENT_REVIEW_SCHEMA_VERSION, DEFAULT_REVIEW_STATUS


LegacyReviewData = dict[str, Any]
ReviewData = dict[str, Any]


def is_legacy_review_data(data: Any) -> bool:
    """Return whether data looks like the existing loose review-data mapping."""
    return isinstance(data, dict)


def empty_review_data() -> ReviewData:
    """Return an empty review data document using the current schema marker."""
    return {"schema_version": CURRENT_REVIEW_SCHEMA_VERSION, "items": {}}


def normalize_string_list(value: Any, max_items: int = 80) -> list[str]:
    """Normalize tag or collection lists while preserving display spelling."""
    if not isinstance(value, list):
        return []
    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        text = str(item or "").strip()
        key = text.casefold()
        if not text or key in seen:
            continue
        seen.add(key)
        result.append(text[:120])
        if len(result) >= max_items:
            break
    return result


def normalize_rating(value: Any) -> int | None:
    """Normalize optional 1-5 rating values for future UI use."""
    if value in (None, ""):
        return None
    try:
        rating = int(value)
    except (TypeError, ValueError):
        return None
    return max(1, min(5, rating))


def normalize_review_item(item: Any) -> dict[str, Any]:
    """Normalize one review item while keeping old favorite/selected behavior."""
    if not isinstance(item, dict):
        item = {}
    normalized: dict[str, Any] = {
        "favorite": bool(item.get("favorite", False)),
        "selected": bool(item.get("selected", False)),
    }
    review_status = str(item.get("review_status") or DEFAULT_REVIEW_STATUS).strip()
    if review_status in {"keep", "featured", "pending-edit", "published", "rejected"}:
        normalized["review_status"] = review_status
    rating = normalize_rating(item.get("rating"))
    if rating is not None:
        normalized["rating"] = rating
    tags = normalize_string_list(item.get("tags"))
    if tags:
        normalized["tags"] = tags
    collections = normalize_string_list(item.get("collections"))
    if collections:
        normalized["collections"] = collections
    note = str(item.get("note") or "").strip()
    if note:
        normalized["note"] = note[:4000]
    updated_at = item.get("updated_at")
    if isinstance(updated_at, (int, float)):
        normalized["updated_at"] = int(updated_at)
    path = str(item.get("path") or "").strip()
    if path:
        normalized["path"] = path
    path_norm = str(item.get("path_norm") or "").strip()
    if path_norm:
        normalized["path_norm"] = path_norm
    return normalized


def item_has_review_state(item: dict[str, Any]) -> bool:
    """Return whether a normalized item contains meaningful review state."""
    return any(
        [
            item.get("favorite"),
            item.get("selected"),
            item.get("review_status") not in (None, DEFAULT_REVIEW_STATUS),
            item.get("rating") is not None,
            bool(item.get("tags")),
            bool(item.get("collections")),
            bool(item.get("note")),
        ]
    )


def normalize_review_data(data: Any) -> ReviewData:
    """Normalize old or current review_data.json content."""
    if not isinstance(data, dict):
        return empty_review_data()
    raw_items = data.get("items")
    if not isinstance(raw_items, dict):
        raw_items = {}
    items: dict[str, dict[str, Any]] = {}
    for key, value in raw_items.items():
        clean_key = str(key or "").strip()
        if not clean_key:
            continue
        item = normalize_review_item(value)
        if item_has_review_state(item):
            items[clean_key] = item
    return {"schema_version": CURRENT_REVIEW_SCHEMA_VERSION, "items": items}


def review_for_key(data: Any, key: str) -> dict[str, bool]:
    """Return the current UI-facing review state for a key."""
    if not isinstance(data, dict):
        return {"favorite": False, "selected": False}
    item = data.get("items", {}).get(str(key or "").strip(), {})
    if not isinstance(item, dict):
        item = {}
    return {
        "favorite": bool(item.get("favorite", False)),
        "selected": bool(item.get("selected", False)),
    }
