from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

import app


class QuietAppHandler(app.AppHandler):
    def log_message(self, format: str, *args) -> None:
        pass


class MediaRangeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        (self.root / "sample.mp4").write_bytes(b"0123456789")
        self.scan_id = "range-regression"
        self.original_port = app.PORT
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), QuietAppHandler)
        app.PORT = self.server.server_port
        with app.runtime_lock:
            app.runtime_scan_roots[self.scan_id] = str(self.root)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        with app.runtime_lock:
            app.runtime_scan_roots.pop(self.scan_id, None)
        app.PORT = self.original_port
        self.temp_dir.cleanup()

    def test_media_endpoint_honors_byte_range(self) -> None:
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request("GET", f"/media?scan_id={self.scan_id}&path=sample.mp4", headers={"Range": "bytes=2-5"})
        response = connection.getresponse()
        body = response.read()
        connection.close()

        self.assertEqual(response.status, 206)
        self.assertEqual(response.getheader("Content-Range"), "bytes 2-5/10")
        self.assertEqual(body, b"2345")

    def test_bootstrap_route_returns_the_active_test_server_port(self) -> None:
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request("GET", "/api/bootstrap")
        response = connection.getresponse()
        payload = json.loads(response.read())
        connection.close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["port"], self.server.server_port)
        self.assertTrue(payload["token"])

    def test_choose_folder_get_request_is_rejected_without_opening_a_dialog(self) -> None:
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request("GET", "/api/choose-folder")
        response = connection.getresponse()
        body = response.read().decode("utf-8")
        connection.close()

        self.assertEqual(response.status, 405)
        self.assertIn("use POST", body)

    def test_all_legacy_get_action_routes_are_rejected(self) -> None:
        for path in ("/api/open", "/api/open-file", "/api/choose-folder"):
            with self.subTest(path=path):
                connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
                connection.request("GET", path)
                response = connection.getresponse()
                response.read()
                connection.close()
                self.assertEqual(response.status, 405)
