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
        self.file_patches = [
            patch.object(app, "CONFIG_FILE", self.config_file),
            patch.object(app, "REVIEW_FILE", self.review_file),
            patch.object(app, "ACTION_LOG_FILE", self.action_log),
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
        self.assertEqual(data["config"]["last_video_dir"], str(self.media_dir))
        self.assertEqual(data["config"]["path_history"][0], str(self.media_dir))

    def test_scan_rejects_missing_directory_without_writing_config(self) -> None:
        missing = self.root / "missing"
        status, data = self._post("/api/scan", {"video_dir": str(missing)})

        self.assertEqual(status, 400)
        self.assertFalse(data["ok"])
        self.assertFalse(self.config_file.exists())

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
            },
        )

        self.assertEqual(status, 200)
        config = data["config"]
        self.assertEqual(config["columns"], 20)
        self.assertEqual(config["page_size"], 240)
        self.assertEqual(config["play_limit"], 12)
        self.assertEqual(config["theme"], "light")
        self.assertEqual(config["font_size"], "large")
        self.assertEqual(config["content_align"], "left")
        self.assertEqual(config["button_style"], "icons")
        self.assertEqual(config["slideshow_interval"], 15)
        self.assertEqual(app.load_config(), config)
