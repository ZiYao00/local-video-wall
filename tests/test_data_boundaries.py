from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
import json
import struct
import zlib

from core.json_store import read_json_file, write_json_file
from metadata.embedded_reader import PNG_SIGNATURE, read_embedded_metadata
from metadata.normalizer import metadata_to_dict, normalize_metadata


class JsonStoreTests(unittest.TestCase):
    def test_round_trip_preserves_unicode_data(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "review.json"
            expected = {"prompt": "中文提示词", "favorite": True}

            write_json_file(path, expected)

            self.assertEqual(read_json_file(path, {}), expected)

    def test_invalid_json_returns_default(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "broken.json"
            path.write_text("{broken", encoding="utf-8")

            self.assertEqual(read_json_file(path, {"safe": True}), {"safe": True})

    def test_large_valid_json_remains_readable(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "large.json"
            expected = {"prompt": "x" * (1024 * 1024)}
            write_json_file(path, expected)

            self.assertEqual(read_json_file(path, {}), expected)


class MetadataNormalizationTests(unittest.TestCase):
    def test_normalization_coerces_values_and_deduplicates_loras(self) -> None:
        metadata = normalize_metadata(
            {
                "file_path": "C:/媒体/图像.png",
                "width": "1024.0",
                "height": "invalid",
                "loras": ["Style", "style", ""],
                "metadata_sources": ["embedded", "embedded", "sidecar"],
                "prompt": "  test prompt  ",
            }
        )

        result = metadata_to_dict(metadata)
        self.assertEqual(result["width"], 1024)
        self.assertIsNone(result["height"])
        self.assertEqual(result["loras"], ["Style"])
        self.assertEqual(result["metadata_sources"], ["embedded", "sidecar"])
        self.assertEqual(result["prompt"], "test prompt")
        self.assertEqual(result["metadata_status"], "ok")


class EmbeddedMetadataTests(unittest.TestCase):
    @staticmethod
    def _text_chunk(key: str, value: str) -> bytes:
        data = key.encode("utf-8") + b"\0" + value.encode("utf-8")
        return struct.pack(">I", len(data)) + b"tEXt" + data + struct.pack(">I", zlib.crc32(b"tEXt" + data) & 0xFFFFFFFF)

    def test_a1111_parameters_are_read_from_png_text(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "a1111.png"
            payload = "portrait\nNegative prompt: blur\nSteps: 20, CFG scale: 7, Seed: 123"
            path.write_bytes(PNG_SIGNATURE + self._text_chunk("parameters", payload))

            metadata = metadata_to_dict(read_embedded_metadata(path, "image"))

            self.assertEqual(metadata["source_app"], "Stable Diffusion WebUI")
            self.assertEqual(metadata["prompt"], "portrait")
            self.assertEqual(metadata["negative_prompt"], "blur")
            self.assertEqual(metadata["steps"], 20)

    def test_comfy_workflow_is_read_from_png_text(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "comfy.png"
            workflow = {"nodes": [{"type": "CheckpointLoaderSimple", "widgets_values": ["model.safetensors"]}]}
            path.write_bytes(PNG_SIGNATURE + self._text_chunk("workflow", json.dumps(workflow)))

            metadata = metadata_to_dict(read_embedded_metadata(path, "image"))

            self.assertEqual(metadata["source_app"], "ComfyUI")
            self.assertEqual(metadata["workflow"], workflow)
            self.assertEqual(metadata["model"], "model.safetensors")
