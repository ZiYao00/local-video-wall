"""Review-state schema definitions.

The current app still uses the existing review-data behavior. These types are
only a compatibility target for future migration work.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


ReviewStatus = Literal[
    "unreviewed",
    "keep",
    "featured",
    "pending-edit",
    "published",
    "rejected",
]


CURRENT_REVIEW_SCHEMA_VERSION = 2

DEFAULT_REVIEW_STATUS: ReviewStatus = "unreviewed"
REVIEW_ITEM_BOOLEAN_FIELDS = ("favorite", "selected")


@dataclass
class ReviewItem:
    """Future normalized review state for one media file."""

    path: str = ""
    path_norm: str = ""
    favorite: bool = False
    selected: bool = False
    review_status: ReviewStatus = "unreviewed"
    rating: int | None = None
    tags: list[str] = field(default_factory=list)
    collections: list[str] = field(default_factory=list)
    note: str = ""
