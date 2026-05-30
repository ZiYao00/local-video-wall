# -*- coding: utf-8 -*-
r"""
Local Civitai-style Video Wall v2

Usage:
1. Make sure Python 3.9+ is installed.
2. Double-click start.bat, or run:
   python app.py
3. Open:
   http://127.0.0.1:8787

v2 changes:
- Path input is empty by default.
- Manual path input.
- Windows folder picker button.
- Remember path checkbox.
- Recursive scan checkbox.
- Adjustable columns: 4 / 5 / 6 / 7 / 8 / 9.
- Playback limit: 12 / 18 / 24 / 30.
- Compact topbar and immersive mode.
- English interface by default with Chinese language toggle.
"""

from __future__ import annotations

import json
import mimetypes
import os
import posixpath
import re
import shutil
import subprocess
import sys
import threading
import time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, quote

HOST = "127.0.0.1"
PORT = 8787

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
CONFIG_FILE = BASE_DIR / "config.json"
REVIEW_FILE = BASE_DIR / "review_data.json"
ACTION_LOG_FILE = BASE_DIR / "file_actions.log"

VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
MEDIA_EXTENSIONS = VIDEO_EXTENSIONS | IMAGE_EXTENSIONS
INTERNAL_MEDIA_DIRS = {"_video_wall_trash", "_video_wall_review"}

DEFAULT_CONFIG = {
    "remember_path": False,
    "last_video_dir": "",
    "recursive": False,
    "columns": 6,
    "play_limit": 24,
    "sort_mode": "mtime_desc",
    "immersive": False,
    "language": "en",
    "slideshow_interval": 5,
    "slideshow_effect": "drift",
    "slideshow_fit": "contain",
    "slideshow_loop": True,
}

runtime_lock = threading.Lock()
runtime_video_dir = ""
review_lock = threading.Lock()


def normalize_path(p: str) -> str:
    p = (p or "").strip().strip('"')
    return str(Path(p).expanduser()) if p else ""


def normalize_language(value: str) -> str:
    return "zh" if value == "zh" else "en"


def clamp_int(value, default: int, low: int, high: int) -> int:
    try:
        n = int(value)
    except Exception:
        n = default
    return max(low, min(high, n))


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return dict(DEFAULT_CONFIG)
    try:
        data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        return dict(DEFAULT_CONFIG)
    cfg = dict(DEFAULT_CONFIG)
    cfg.update({k: data.get(k, v) for k, v in DEFAULT_CONFIG.items()})
    if not cfg.get("remember_path"):
        cfg["last_video_dir"] = ""
    cfg["columns"] = clamp_int(cfg.get("columns"), 6, 4, 9)
    cfg["play_limit"] = clamp_int(cfg.get("play_limit"), 24, 12, 30)
    cfg["language"] = normalize_language(cfg.get("language", "en"))
    cfg["slideshow_interval"] = clamp_int(cfg.get("slideshow_interval"), 5, 3, 12)
    if cfg.get("slideshow_effect") not in {"fade", "slide", "drift", "random"}:
        cfg["slideshow_effect"] = "drift"
    if cfg.get("slideshow_fit") not in {"contain", "cover"}:
        cfg["slideshow_fit"] = "contain"
    cfg["slideshow_loop"] = bool(cfg.get("slideshow_loop", True))
    return cfg


def save_config(cfg: dict) -> dict:
    merged = dict(DEFAULT_CONFIG)
    merged.update({k: cfg.get(k, v) for k, v in DEFAULT_CONFIG.items()})
    merged["remember_path"] = bool(merged.get("remember_path"))
    merged["recursive"] = bool(merged.get("recursive"))
    merged["immersive"] = bool(merged.get("immersive"))
    merged["columns"] = clamp_int(merged.get("columns"), 6, 4, 9)
    merged["play_limit"] = clamp_int(merged.get("play_limit"), 24, 12, 30)
    merged["language"] = normalize_language(merged.get("language", "en"))
    merged["slideshow_interval"] = clamp_int(merged.get("slideshow_interval"), 5, 3, 12)
    if merged.get("slideshow_effect") not in {"fade", "slide", "drift", "random"}:
        merged["slideshow_effect"] = "drift"
    if merged.get("slideshow_fit") not in {"contain", "cover"}:
        merged["slideshow_fit"] = "contain"
    merged["slideshow_loop"] = bool(merged.get("slideshow_loop", True))
    if not merged["remember_path"]:
        merged["last_video_dir"] = ""
    else:
        merged["last_video_dir"] = normalize_path(merged.get("last_video_dir", ""))
    CONFIG_FILE.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    return merged


def load_review_data() -> dict:
    if not REVIEW_FILE.exists():
        return {"items": {}}
    try:
        data = json.loads(REVIEW_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"items": {}}
    items = data.get("items")
    return {"items": items if isinstance(items, dict) else {}}


def save_review_data(data: dict) -> dict:
    clean = {"items": data.get("items", {}) if isinstance(data.get("items"), dict) else {}}
    REVIEW_FILE.write_text(json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8")
    return clean


def review_for_key(data: dict, key: str) -> dict:
    item = data.get("items", {}).get(key, {})
    return {
        "favorite": bool(item.get("favorite", False)),
        "selected": bool(item.get("selected", False)),
    }


def update_review_item(key: str, changes: dict) -> dict:
    key = str(key or "").strip()
    if not key:
        raise ValueError("Missing review key")
    with review_lock:
        data = load_review_data()
        items = data.setdefault("items", {})
        current = review_for_key(data, key)
        if "favorite" in changes:
            current["favorite"] = bool(changes.get("favorite"))
        if "selected" in changes:
            current["selected"] = bool(changes.get("selected"))
        if current["favorite"] or current["selected"]:
            current["updated_at"] = int(time.time())
            items[key] = current
        else:
            items.pop(key, None)
        save_review_data(data)
        return review_for_key(data, key)


def unique_destination(dest_dir: Path, filename: str) -> Path:
    dest = dest_dir / filename
    if not dest.exists():
        return dest
    stem = dest.stem
    suffix = dest.suffix
    for i in range(1, 10000):
        candidate = dest_dir / f"{stem}_{i}{suffix}"
        if not candidate.exists():
            return candidate
    raise RuntimeError("Could not create a unique destination filename")


def log_file_action(action: str, source: Path, destination: Path) -> None:
    record = {
        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "action": action,
        "source": str(source),
        "destination": str(destination),
    }
    with ACTION_LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def get_current_video_dir() -> Path | None:
    with runtime_lock:
        p = runtime_video_dir
    if not p:
        return None
    return Path(p)


def set_current_video_dir(path: str):
    global runtime_video_dir
    with runtime_lock:
        runtime_video_dir = normalize_path(path)


def safe_rel_to_path(root: Path, rel: str) -> Path:
    rel = unquote(rel).replace("\\", "/")
    rel = posixpath.normpath(rel)
    if rel.startswith("../") or rel == ".." or os.path.isabs(rel):
        raise ValueError("Invalid path")
    root_resolved = root.resolve()
    full = (root_resolved / rel).resolve()
    try:
        full.relative_to(root_resolved)
    except ValueError:
        raise ValueError("Path outside video directory")
    return full


def scan_videos(video_dir: str, recursive: bool) -> tuple[list[dict], str | None]:
    root = Path(normalize_path(video_dir))
    if not str(root).strip():
        return [], "Folder path is empty. Please enter or choose a video folder first."
    if not root.exists():
        return [], f"Path does not exist: {root}"
    if not root.is_dir():
        return [], f"This is not a folder path: {root}"

    pattern = "**/*" if recursive else "*"
    files: list[Path] = []
    try:
        for p in root.glob(pattern):
            try:
                if any(part in INTERNAL_MEDIA_DIRS for part in p.parts):
                    continue
                if p.is_file() and p.suffix.lower() in MEDIA_EXTENSIONS:
                    files.append(p)
            except OSError:
                continue
    except Exception as exc:
        return [], f"Scan failed: {exc}"

    try:
        files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    except Exception:
        files.sort(key=lambda p: str(p).lower())

    videos = []
    review_data = load_review_data()
    root_resolved = root.resolve()
    for i, p in enumerate(files):
        try:
            st = p.stat()
            key = str(p.resolve())
            rel = p.resolve().relative_to(root_resolved).as_posix()
            review = review_for_key(review_data, key)
            media_type = "video" if p.suffix.lower() in VIDEO_EXTENSIONS else "image"
            videos.append({
                "id": i,
                "key": key,
                "type": media_type,
                "name": p.name,
                "rel": rel,
                "url": "/media?path=" + quote(rel, safe=""),
                "size_mb": round(st.st_size / 1024 / 1024, 2),
                "mtime": int(st.st_mtime),
                "mtime_text": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_mtime)),
                "favorite": review["favorite"],
                "selected": review["selected"],
            })
        except Exception:
            continue
    return videos, None


def choose_folder_dialog() -> str:
    if os.name == "nt":
        script = r"""
Add-Type -AssemblyName System.Windows.Forms
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Choose a video folder"
$dialog.ShowNewFolderButton = $false
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
}
"""
        try:
            completed = subprocess.run(
                ["powershell", "-NoProfile", "-STA", "-Command", script],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            selected = completed.stdout.strip()
            if selected:
                return selected
        except Exception:
            pass
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        selected = filedialog.askdirectory(title="Choose a video folder")
        root.destroy()
        return selected or ""
    except Exception:
        return ""


class AppHandler(BaseHTTPRequestHandler):
    server_version = "LocalVideoWallV2/2.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, rel_path: str):
        if rel_path in ("", "/"):
            rel_path = "index.html"
        rel_path = rel_path.lstrip("/")
        full = (STATIC_DIR / rel_path).resolve()
        try:
            full.relative_to(STATIC_DIR.resolve())
        except ValueError:
            self.send_error(403)
            return
        if not full.exists() or not full.is_file():
            self.send_error(404)
            return
        mime, _ = mimetypes.guess_type(str(full))
        if not mime:
            mime = "application/octet-stream"
        data = full.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def serve_media(self, rel: str):
        root = get_current_video_dir()
        if root is None:
            self.send_error(404, "No video directory selected")
            return
        try:
            file_path = safe_rel_to_path(root, rel)
        except ValueError:
            self.send_error(403)
            return
        if not file_path.exists() or not file_path.is_file():
            self.send_error(404)
            return
        file_size = file_path.stat().st_size
        content_type = mimetypes.guess_type(str(file_path))[0] or "video/mp4"
        range_header = self.headers.get("Range")
        if range_header:
            m = re.match(r"bytes=(\d*)-(\d*)", range_header)
            if not m:
                self.send_error(416)
                return
            start_s, end_s = m.groups()
            if start_s == "" and end_s == "":
                self.send_error(416)
                return
            if start_s == "":
                length = int(end_s)
                start = max(file_size - length, 0)
                end = file_size - 1
            else:
                start = int(start_s)
                end = int(end_s) if end_s else file_size - 1
            if start >= file_size:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return
            end = min(end, file_size - 1)
            chunk_size = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", content_type)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(chunk_size))
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    chunk = f.read(min(1024 * 1024, remaining))
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except BrokenPipeError:
                        break
                    remaining -= len(chunk)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(file_size))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except BrokenPipeError:
                    break

    def api_open_in_explorer(self, rel: str):
        root = get_current_video_dir()
        if root is None:
            self.send_json({"ok": False, "error": "Please choose and scan a video folder first."}, 400)
            return
        try:
            file_path = safe_rel_to_path(root, rel)
        except ValueError:
            self.send_json({"ok": False, "error": "Invalid path"}, 403)
            return
        if not file_path.exists():
            self.send_json({"ok": False, "error": "File not found"}, 404)
            return
        if os.name == "nt":
            subprocess.Popen(["explorer", "/select,", str(file_path)])
            self.send_json({"ok": True})
        else:
            subprocess.Popen(["xdg-open", str(file_path.parent)])
            self.send_json({"ok": True})

    def api_file_action(self, payload: dict):
        root = get_current_video_dir()
        if root is None:
            self.send_json({"ok": False, "error": "Please choose and scan a media folder first."}, 400)
            return
        if not bool(payload.get("confirm", False)):
            self.send_json({"ok": False, "error": "Confirmation is required."}, 400)
            return
        action = str(payload.get("action", "")).strip()
        if action not in {"move_review", "move_trash"}:
            self.send_json({"ok": False, "error": "Unsupported file action."}, 400)
            return
        rel = payload.get("rel", "")
        try:
            file_path = safe_rel_to_path(root, rel)
        except ValueError:
            self.send_json({"ok": False, "error": "Invalid path"}, 403)
            return
        if not file_path.exists() or not file_path.is_file():
            self.send_json({"ok": False, "error": "File not found"}, 404)
            return
        target_name = "_video_wall_review" if action == "move_review" else "_video_wall_trash"
        target_dir = root.resolve() / target_name
        if target_name in file_path.parts:
            self.send_json({"ok": False, "error": "File is already inside the target folder."}, 400)
            return
        target_dir.mkdir(exist_ok=True)
        dest = unique_destination(target_dir, file_path.name)
        try:
            shutil.move(str(file_path), str(dest))
        except Exception as exc:
            self.send_json({"ok": False, "error": f"Move failed: {exc}"}, 500)
            return
        log_file_action(action, file_path, dest)
        try:
            new_rel = dest.resolve().relative_to(root.resolve()).as_posix()
        except Exception:
            new_rel = dest.name
        self.send_json({"ok": True, "action": action, "destination": str(dest), "new_rel": new_rel})

    def do_GET(self):
        path, _, query = self.path.partition("?")
        qs = parse_qs(query)
        if path == "/api/config":
            cfg = load_config()
            if cfg.get("remember_path") and cfg.get("last_video_dir"):
                set_current_video_dir(cfg.get("last_video_dir"))
            self.send_json({"ok": True, "config": cfg})
            return
        if path == "/api/choose-folder":
            selected = choose_folder_dialog()
            self.send_json({"ok": True, "path": selected})
            return
        if path == "/api/open":
            rel = qs.get("path", [""])[0]
            self.api_open_in_explorer(rel)
            return
        if path == "/api/review":
            self.send_json({"ok": True, "review": load_review_data()})
            return
        if path == "/media":
            rel = qs.get("path", [""])[0]
            self.serve_media(rel)
            return
        if path == "/health":
            cfg = load_config()
            self.send_json({"ok": True, "config": cfg, "runtime_video_dir": str(get_current_video_dir() or "")})
            return
        if path == "/":
            self.serve_static("index.html")
        elif path.startswith("/static/"):
            self.serve_static(path[len("/static/"):])
        else:
            self.send_error(404)

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        payload = self.read_json_body()
        if path == "/api/scan":
            video_dir = normalize_path(payload.get("video_dir", ""))
            recursive = bool(payload.get("recursive", False))
            remember_path = bool(payload.get("remember_path", False))
            columns = clamp_int(payload.get("columns"), 6, 4, 9)
            play_limit = clamp_int(payload.get("play_limit"), 24, 12, 30)
            sort_mode = payload.get("sort_mode", "mtime_desc")
            immersive = bool(payload.get("immersive", False))
            language = normalize_language(payload.get("language", "en"))
            videos, error = scan_videos(video_dir, recursive)
            if error:
                self.send_json({"ok": False, "error": error, "videos": []}, 400)
                return
            set_current_video_dir(video_dir)
            cfg = save_config({
                "remember_path": remember_path,
                "last_video_dir": video_dir if remember_path else "",
                "recursive": recursive,
                "columns": columns,
                "play_limit": play_limit,
                "sort_mode": sort_mode,
                "immersive": immersive,
                "language": language,
                "slideshow_interval": payload.get("slideshow_interval", DEFAULT_CONFIG["slideshow_interval"]),
                "slideshow_effect": payload.get("slideshow_effect", DEFAULT_CONFIG["slideshow_effect"]),
                "slideshow_fit": payload.get("slideshow_fit", DEFAULT_CONFIG["slideshow_fit"]),
                "slideshow_loop": bool(payload.get("slideshow_loop", DEFAULT_CONFIG["slideshow_loop"])),
            })
            self.send_json({
                "ok": True,
                "video_dir": video_dir,
                "count": len(videos),
                "recursive": recursive,
                "videos": videos,
                "config": cfg,
            })
            return
        if path == "/api/settings":
            cfg = load_config()
            cfg.update({
                "remember_path": bool(payload.get("remember_path", cfg.get("remember_path", False))),
                "recursive": bool(payload.get("recursive", cfg.get("recursive", False))),
                "columns": clamp_int(payload.get("columns", cfg.get("columns", 6)), 6, 4, 9),
                "play_limit": clamp_int(payload.get("play_limit", cfg.get("play_limit", 24)), 24, 12, 30),
                "sort_mode": payload.get("sort_mode", cfg.get("sort_mode", "mtime_desc")),
                "immersive": bool(payload.get("immersive", cfg.get("immersive", False))),
                "language": normalize_language(payload.get("language", cfg.get("language", "en"))),
                "slideshow_interval": payload.get("slideshow_interval", cfg.get("slideshow_interval", 5)),
                "slideshow_effect": payload.get("slideshow_effect", cfg.get("slideshow_effect", "drift")),
                "slideshow_fit": payload.get("slideshow_fit", cfg.get("slideshow_fit", "contain")),
                "slideshow_loop": bool(payload.get("slideshow_loop", cfg.get("slideshow_loop", True))),
            })
            current = str(get_current_video_dir() or "")
            if cfg.get("remember_path"):
                cfg["last_video_dir"] = normalize_path(payload.get("last_video_dir", current))
            else:
                cfg["last_video_dir"] = ""
            cfg = save_config(cfg)
            self.send_json({"ok": True, "config": cfg})
            return
        if path == "/api/review":
            try:
                review = update_review_item(payload.get("key", ""), payload)
            except ValueError as exc:
                self.send_json({"ok": False, "error": str(exc)}, 400)
                return
            self.send_json({"ok": True, "review": review})
            return
        if path == "/api/file-action":
            self.api_file_action(payload)
            return
        self.send_error(404)


def main():
    cfg = load_config()
    if cfg.get("remember_path") and cfg.get("last_video_dir"):
        set_current_video_dir(cfg["last_video_dir"])
    print("=" * 72)
    print("Local Civitai-style Video Wall v2")
    print("=" * 72)
    print("Path input is empty by default unless 'remember path' was enabled.")
    print(f"Remembered folder: {cfg.get('last_video_dir') or '(empty)'}")
    print(f"Open in browser: http://{HOST}:{PORT}")
    print("=" * 72)
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")


if __name__ == "__main__":
    main()
