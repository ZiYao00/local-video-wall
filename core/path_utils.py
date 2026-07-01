"""Path normalization and safety helpers.

This module is reserved for Windows-first local path utilities, including
normalized path comparison and safe path checks for API endpoints.
"""

from __future__ import annotations

from pathlib import Path


def normalize_path_for_key(path: str | Path) -> str:
    """Return a stable lowercase path key without resolving missing files."""
    return str(Path(path)).replace("\\", "/").lower()

