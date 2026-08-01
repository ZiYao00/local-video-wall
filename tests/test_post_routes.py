from __future__ import annotations

import unittest
from unittest.mock import Mock, patch

import app


class PostActionRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.handler = object.__new__(app.AppHandler)
        self.handler.api_file_action = Mock()
        self.handler.api_batch_file_action = Mock()
        self.handler.api_trash_action = Mock()
        self.handler.api_open_in_explorer = Mock()
        self.handler.api_open_file_default_app = Mock()
        self.handler.send_json = Mock()

    def test_payload_routes_dispatch_to_existing_handlers(self) -> None:
        cases = (
            ("/api/file-action", self.handler.api_file_action),
            ("/api/file-actions/batch", self.handler.api_batch_file_action),
            ("/api/trash/action", self.handler.api_trash_action),
        )
        payload = {"action": "test"}
        for path, target in cases:
            with self.subTest(path=path):
                self.assertTrue(self.handler._dispatch_post_action(path, payload))
                target.assert_called_once_with(payload)

    def test_open_routes_keep_path_and_scan_id(self) -> None:
        payload = {"path": "nested/clip.mp4", "scan_id": "scan-1"}

        self.assertTrue(self.handler._dispatch_post_action("/api/open", payload))
        self.assertTrue(self.handler._dispatch_post_action("/api/open-file", payload))

        self.handler.api_open_in_explorer.assert_called_once_with("nested/clip.mp4", "scan-1")
        self.handler.api_open_file_default_app.assert_called_once_with("nested/clip.mp4", "scan-1")

    def test_choose_folder_route_uses_dialog_result(self) -> None:
        with patch.object(app, "choose_folder_dialog", return_value="D:/Media") as picker:
            self.assertTrue(self.handler._dispatch_post_action("/api/choose-folder", {}))

        picker.assert_called_once_with()
        self.handler.send_json.assert_called_once_with({"ok": True, "path": "D:/Media"})

    def test_unknown_route_is_not_dispatched(self) -> None:
        self.assertFalse(self.handler._dispatch_post_action("/api/unknown", {}))


class PostStateRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.handler = object.__new__(app.AppHandler)
        self.handler._post_path_state = Mock()
        self.handler._post_review = Mock()

    def test_state_routes_dispatch_to_existing_handlers(self) -> None:
        payload = {"key": "media-key"}
        self.assertTrue(self.handler._dispatch_post_state("/api/path-state", payload))
        self.assertTrue(self.handler._dispatch_post_state("/api/review", payload))

        self.handler._post_path_state.assert_called_once_with(payload)
        self.handler._post_review.assert_called_once_with(payload)

    def test_unknown_state_route_is_not_dispatched(self) -> None:
        self.assertFalse(self.handler._dispatch_post_state("/api/unknown", {}))
