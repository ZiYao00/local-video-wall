from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import app


class PathSafetyTests(unittest.TestCase):
    def test_safe_rel_to_path_accepts_nested_media_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            resolved = app.safe_rel_to_path(root, "nested/clip.mp4")

            self.assertEqual(resolved, (root / "nested" / "clip.mp4").resolve())

    def test_safe_rel_to_path_rejects_paths_outside_root(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            for value in ("../outside.mp4", "..%2Foutside.mp4", "C:/outside.mp4"):
                with self.subTest(value=value):
                    with self.assertRaises(ValueError):
                        app.safe_rel_to_path(root, value)


class LocalTrashTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.log_path = self.root / "actions.log"
        self.log_patch = patch.object(app, "ACTION_LOG_FILE", self.log_path)
        self.log_patch.start()

    def tearDown(self) -> None:
        self.log_patch.stop()
        self.temp_dir.cleanup()

    def test_move_and_restore_preserves_unicode_media(self) -> None:
        source = self.root / "素材" / "测试 视频.mp4"
        source.parent.mkdir()
        source.write_bytes(b"original-media")

        item = app.move_to_local_trash(self.root, "素材/测试 视频.mp4")

        self.assertFalse(source.exists())
        self.assertEqual(item["status"], "trashed")
        self.assertEqual([entry["id"] for entry in app.list_local_trash(self.root)], [item["id"]])

        restored = app.restore_from_local_trash(self.root, item["id"])

        self.assertEqual(restored["status"], "restored")
        self.assertEqual(restored["restored_rel"], "素材/测试 视频.mp4")
        self.assertEqual(source.read_bytes(), b"original-media")

    def test_restore_uses_unique_name_when_original_path_is_occupied(self) -> None:
        source = self.root / "clip.mp4"
        source.write_bytes(b"trashed-version")
        item = app.move_to_local_trash(self.root, "clip.mp4")
        source.write_bytes(b"new-version")

        restored = app.restore_from_local_trash(self.root, item["id"])
        restored_path = self.root / restored["restored_rel"]

        self.assertEqual(restored_path.name, "clip_1.mp4")
        self.assertEqual(source.read_bytes(), b"new-version")
        self.assertEqual(restored_path.read_bytes(), b"trashed-version")

    def test_invalid_trash_id_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            app.trash_item_path(self.root, "not-a-trash-id")

    def test_system_recycle_handoff_marks_item_after_recycler_succeeds(self) -> None:
        source = self.root / "clip.mp4"
        source.write_bytes(b"media")
        item = app.move_to_local_trash(self.root, "clip.mp4")

        with patch.object(app, "move_to_windows_recycle_bin", return_value={"total_ms": 1, "retry_count": 0}) as recycler:
            removed = app.move_local_trash_to_system_recycle_bin(self.root, item["id"])

        self.assertEqual(removed["status"], "system_trashed")
        self.assertIn("system_trashed_at", removed)
        self.assertEqual(recycler.call_count, 1)
