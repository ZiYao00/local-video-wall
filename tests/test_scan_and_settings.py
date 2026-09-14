from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

import app


class QuietAppHandler(app.AppHandler):
    def log_message(self, format: str, *args) -> None:
        pass


class ScanAndSettingsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.media_dir = self.root / "media"
        self.media_dir.mkdir()
        (self.media_dir / "clip.mp4").write_bytes(b"video")
        (self.media_dir / "image.png").write_bytes(b"image")
        self.config_file = self.root / "config.json"
        self.review_file = self.root / "review_data.json"
        self.action_log = self.root / "actions.log"
        self.desktop_scan_registry = self.root / "desktop-scans.json"
        self.file_patches = [
            patch.object(app, "CONFIG_FILE", self.config_file),
            patch.object(app, "REVIEW_FILE", self.review_file),
            patch.object(app, "ACTION_LOG_FILE", self.action_log),
            patch.object(app, "DESKTOP_SCAN_REGISTRY_FILE", self.desktop_scan_registry),
        ]
        for file_patch in self.file_patches:
            file_patch.start()
        self.original_port = app.PORT
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), QuietAppHandler)
        app.PORT = self.server.server_port
        with app.runtime_lock:
            self.original_runtime_video_dir = app.runtime_video_dir
            self.original_scan_roots = dict(app.runtime_scan_roots)
            app.runtime_video_dir = ""
            app.runtime_scan_roots.clear()
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        with app.runtime_lock:
            app.runtime_video_dir = self.original_runtime_video_dir
            app.runtime_scan_roots.clear()
            app.runtime_scan_roots.update(self.original_scan_roots)
        app.PORT = self.original_port
        for file_patch in reversed(self.file_patches):
            file_patch.stop()
        self.temp_dir.cleanup()

    def _token(self) -> str:
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request("GET", "/api/bootstrap")
        token = json.loads(connection.getresponse().read())["token"]
        connection.close()
        return token

    def _post(self, path: str, payload: dict) -> tuple[int, dict]:
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request(
            "POST",
            path,
            body=json.dumps(payload),
            headers={
                "Content-Type": "application/json",
                "Origin": "http://127.0.0.1",
                "Referer": f"http://127.0.0.1:{self.server.server_port}/",
                "X-App-Token": self._token(),
            },
        )
        response = connection.getresponse()
        data = json.loads(response.read())
        status = response.status
        connection.close()
        return status, data

    def test_scan_lists_media_and_records_the_temporary_root(self) -> None:
        zero_byte_media = self.media_dir / "paid-placeholder.mp4"
        zero_byte_media.write_bytes(b"")
        status, data = self._post(
            "/api/scan",
            {
                "video_dir": str(self.media_dir),
                "recursive": False,
                "filename_exclude_enabled": False,
                "filename_exclude_keywords": [],
                "remember_path": True,
            },
        )

        self.assertEqual(status, 200)
        self.assertEqual(data["count"], 2)
        self.assertEqual({item["name"] for item in data["videos"]}, {"clip.mp4", "image.png"})
        self.assertTrue(zero_byte_media.exists())
        self.assertEqual(zero_byte_media.stat().st_size, 0)
        self.assertEqual(data["config"]["last_video_dir"], str(self.media_dir))
        self.assertEqual(data["config"]["path_history"][0], str(self.media_dir))
        if app.os.name == "nt":
            registry = json.loads(self.desktop_scan_registry.read_text(encoding="utf-8"))
            self.assertEqual(registry["scans"][data["scan_id"]], str(self.media_dir))

    def test_scan_rejects_missing_directory_without_writing_config(self) -> None:
        missing = self.root / "missing"
        status, data = self._post("/api/scan", {"video_dir": str(missing)})

        self.assertEqual(status, 400)
        self.assertFalse(data["ok"])
        self.assertFalse(self.config_file.exists())

    def test_scan_rejects_a_blocked_path_before_recording_it(self) -> None:
        self.assertTrue(app.is_path_within("H:\\folder", "H:\\"))
        with patch.object(app.os, "name", "nt"):
            self.assertEqual(app.normalize_path("h"), "H:\\")
            self.assertEqual(app.normalize_path("H:"), "H:\\")
        status, data = self._post(
            "/api/settings",
            {"blocked_scan_paths": [str(self.root)], "min_scan_volume_gb": 0},
        )
        self.assertEqual(status, 200)

        status, data = self._post("/api/scan", {"video_dir": str(self.media_dir)})
        self.assertEqual(status, 400)
        self.assertFalse(data["ok"])
        self.assertIn("Scanning is disabled", data["error"])
        self.assertEqual(app.load_config()["path_history"], [])

    def test_scan_rejects_a_volume_below_the_configured_capacity_limit(self) -> None:
        usage = type("DiskUsage", (), {"total": 190 * 1024 * 1024})()
        with patch.object(app.shutil, "disk_usage", return_value=usage):
            status, data = self._post(
                "/api/scan",
                {"video_dir": str(self.media_dir), "min_scan_volume_gb": 1},
            )

        self.assertEqual(status, 400)
        self.assertIn("below the 1 GB", data["error"])

    def test_drive_list_skips_an_unreadable_volume_without_hiding_others(self) -> None:
        class FakePath:
            def __init__(self, value: str) -> None:
                self.value = value

            def exists(self) -> bool:
                if self.value == "E:\\":
                    raise OSError(1005, "Unrecognized file system")
                return True

            def __str__(self) -> str:
                return self.value

        with (
            patch.object(app.os, "name", "nt"),
            patch.object(app.os, "listdrives", return_value=["E:\\", "F:\\"], create=True),
            patch.object(app, "Path", FakePath),
            patch.object(app, "load_config", return_value={"blocked_scan_paths": [], "min_scan_volume_gb": 0}),
        ):
            roots = app.list_drive_roots()

        self.assertEqual(roots, [{"name": "F:", "path": "F:\\", "type": "drive", "scan_blocked": False, "scan_block_reason": ""}])

    def test_settings_are_normalized_and_persisted_in_the_temporary_config(self) -> None:
        status, data = self._post(
            "/api/settings",
            {
                "columns": 999,
                "page_size": 999,
                "play_limit": 1,
                "theme": "light",
                "font_size": "large",
                "content_align": "left",
                "button_style": "icons",
                "slideshow_interval": 99,
                "slideshow_effect": "none",
                "slideshow_fit": "cover",
                "blocked_scan_paths": ["H:\\", "h:\\"],
                "min_scan_volume_gb": 9999,
            },
        )

        self.assertEqual(status, 200)
        config = data["config"]
        self.assertEqual(config["columns"], 20)
        self.assertEqual(config["page_size"], 240)
        self.assertEqual(config["play_limit"], 4)
        self.assertEqual(config["theme"], "light")
        self.assertEqual(config["font_size"], "large")
        self.assertEqual(config["content_align"], "left")
        self.assertEqual(config["button_style"], "icons")
        self.assertEqual(config["slideshow_interval"], 15)
        self.assertEqual(config["blocked_scan_paths"], ["H:\\"])
        self.assertEqual(config["min_scan_volume_gb"], 1024)
        self.assertEqual(app.load_config(), config)

    def test_drag_roots_are_compacted_persisted_and_preserved_by_scan(self) -> None:
        creator_dir = self.media_dir / "creator"
        creator_dir.mkdir()

        status, data = self._post(
            "/api/settings",
            {"drag_roots": [str(self.media_dir), str(creator_dir), str(self.media_dir)]},
        )
        self.assertEqual(status, 200)
        self.assertEqual(data["config"]["drag_roots"], [str(self.media_dir)])

        status, data = self._post(
            "/api/path-state",
            {"action": "drag_root_add", "path": str(self.root)},
        )
        self.assertEqual(status, 200)
        self.assertEqual(data["config"]["drag_roots"], [str(self.root)])

        status, data = self._post(
            "/api/scan",
            {
                "video_dir": str(self.media_dir),
                "recursive": False,
                "filename_exclude_enabled": False,
                "filename_exclude_keywords": [],
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(data["config"]["drag_roots"], [str(self.root)])

        status, data = self._post(
            "/api/path-state",
            {"action": "drag_root_remove", "path": str(self.root)},
        )
        self.assertEqual(status, 200)
        self.assertEqual(data["config"]["drag_roots"], [])

    def test_drag_root_verification_matches_browser_file_sample_without_persisting(self) -> None:
        clip = self.media_dir / "clip.mp4"
        stat = clip.stat()
        status, data = self._post(
            "/api/drag-root/verify",
            {
                "root": str(self.media_dir),
                "samples": [{
                    "rel": "clip.mp4",
                    "size": stat.st_size,
                    "last_modified": stat.st_mtime * 1000,
                }],
            },
        )

        self.assertEqual(status, 200)
        self.assertTrue(data["ok"])
        self.assertEqual(data["checked"], 1)
        self.assertEqual(data["root"], str(self.media_dir))
        self.assertEqual(app.load_config()["drag_roots"], [])

    def test_drag_root_verification_rejects_wrong_expected_root(self) -> None:
        wrong_root = self.root / "wrong-root"
        wrong_root.mkdir()
        clip = self.media_dir / "clip.mp4"
        stat = clip.stat()
        status, data = self._post(
            "/api/drag-root/verify",
            {
                "root": str(wrong_root),
                "samples": [{
                    "rel": "clip.mp4",
                    "size": stat.st_size,
                    "last_modified": stat.st_mtime * 1000,
                }],
            },
        )

        self.assertEqual(status, 400)
        self.assertFalse(data["ok"])
        self.assertEqual(data["reason"], "sample-not-found")
        self.assertEqual(app.load_config()["drag_roots"], [])

    def test_drag_root_add_rejects_missing_folder(self) -> None:
        missing = self.root / "missing-drag-root"
        status, data = self._post(
            "/api/path-state",
            {"action": "drag_root_add", "path": str(missing)},
        )

        self.assertEqual(status, 400)
        self.assertFalse(data["ok"])
        self.assertEqual(app.load_config()["drag_roots"], [])

    def test_multiple_independent_drag_roots_can_coexist(self) -> None:
        other_root = self.root / "other-media"
        other_root.mkdir()

        status, data = self._post(
            "/api/path-state",
            {"action": "drag_root_add", "path": str(self.media_dir)},
        )
        self.assertEqual(status, 200)
        status, data = self._post(
            "/api/path-state",
            {"action": "drag_root_add", "path": str(other_root)},
        )

        self.assertEqual(status, 200)
        self.assertEqual(set(data["config"]["drag_roots"]), {str(self.media_dir), str(other_root)})
