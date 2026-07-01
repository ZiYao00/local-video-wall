# -*- coding: utf-8 -*-
r"""
Local Civitai-style Video Wall v2

Usage:
1. Make sure Python 3.10+ is installed. Python 3.12 is recommended.
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
- Adjustable columns: 2-20.
- Inline wall playback is derived from column count.
- Compact topbar and immersive mode.
- English interface by default with Chinese language toggle.
"""

from __future__ import annotations

import json
import base64
import html
import mimetypes
import os
import ntpath
import posixpath
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
import ctypes
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, quote

from core.json_store import read_json_file, write_json_file
from metadata.embedded_reader import read_embedded_metadata
from metadata.ffprobe_reader import read_ffprobe_metadata
from metadata.normalizer import merge_metadata, metadata_to_dict
from metadata.sidecar_reader import read_sidecar_metadata
from review.store import (
    item_has_review_state,
    normalize_review_data,
    normalize_review_item,
    review_for_key as normalized_review_for_key,
)

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
    "filename_exclude_enabled": True,
    "filename_exclude_keywords": ["fanart", "thumb"],
    "filename_exclude_scope": "image",
    "columns": 6,
    "page_size": 120,
    "play_limit": 12,
    "wall_autoplay": True,
    "preview_large_videos": False,
    "pause_when_inactive": False,
    "confirm_trash": True,
    "sort_mode": "mtime_desc",
    "immersive": False,
    "language": "en",
    "theme": "dark",
    "font_size": "standard",
    "content_align": "center",
    "button_style": "text",
    "path_history": [],
    "path_favorites": [],
    "slideshow_interval": 5,
    "slideshow_effect": "drift",
    "slideshow_fit": "contain",
    "slideshow_loop": True,
}

runtime_lock = threading.Lock()
runtime_video_dir = ""
runtime_scan_roots: dict[str, str] = {}
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


def play_limit_for_columns(columns: int) -> int:
    return 0 if columns >= 10 else columns * 2


def clean_path_list(value, max_items: int = 30) -> list[str]:
    seen = set()
    paths = []
    if not isinstance(value, list):
        return paths
    for item in value:
        p = normalize_path(str(item or ""))
        if not p:
            continue
        key = os.path.normcase(p)
        if key in seen:
            continue
        seen.add(key)
        paths.append(p)
        if len(paths) >= max_items:
            break
    return paths


def clean_exclude_keywords(value, max_items: int = 30) -> list[str]:
    if not isinstance(value, list):
        return []
    keywords = []
    seen = set()
    for item in value:
        keyword = str(item or "").strip()[:80]
        key = keyword.casefold()
        if not keyword or key in seen:
            continue
        seen.add(key)
        keywords.append(keyword)
        if len(keywords) >= max_items:
            break
    return keywords


def add_recent_path(paths: list[str], path: str, max_items: int = 20) -> list[str]:
    p = normalize_path(path)
    if not p:
        return clean_path_list(paths, max_items)
    existing = [x for x in clean_path_list(paths, max_items) if os.path.normcase(x) != os.path.normcase(p)]
    return [p] + existing[: max_items - 1]


def load_config() -> dict:
    data = read_json_file(CONFIG_FILE, {})
    if not isinstance(data, dict):
        return dict(DEFAULT_CONFIG)
    if "filename_exclude_enabled" not in data and "exclude_cover_images" in data:
        data["filename_exclude_enabled"] = bool(data.get("exclude_cover_images"))
    cfg = dict(DEFAULT_CONFIG)
    cfg.update({k: data.get(k, v) for k, v in DEFAULT_CONFIG.items()})
    if not cfg.get("remember_path"):
        cfg["last_video_dir"] = ""
    cfg["columns"] = clamp_int(cfg.get("columns"), 6, 2, 20)
    cfg["page_size"] = clamp_int(cfg.get("page_size"), 120, 1, 240)
    cfg["play_limit"] = play_limit_for_columns(cfg["columns"])
    cfg["wall_autoplay"] = bool(cfg.get("wall_autoplay", True))
    cfg["pause_when_inactive"] = bool(cfg.get("pause_when_inactive", False))
    cfg["confirm_trash"] = bool(cfg.get("confirm_trash", True))
    cfg["language"] = normalize_language(cfg.get("language", "en"))
    cfg["path_history"] = clean_path_list(cfg.get("path_history"), 20)
    cfg["path_favorites"] = clean_path_list(cfg.get("path_favorites"), 30)
    cfg["filename_exclude_enabled"] = bool(cfg.get("filename_exclude_enabled", True))
    cfg["filename_exclude_keywords"] = clean_exclude_keywords(cfg.get("filename_exclude_keywords"), 30)
    cfg["filename_exclude_scope"] = "all" if cfg.get("filename_exclude_scope") == "all" else "image"
    cfg["font_size"] = cfg.get("font_size") if cfg.get("font_size") in {"small", "standard", "large"} else "standard"
    cfg["slideshow_interval"] = clamp_int(cfg.get("slideshow_interval"), 5, 3, 12)
    if cfg.get("slideshow_effect") not in {"fade", "slide", "drift", "random"}:
        cfg["slideshow_effect"] = "drift"
    if cfg.get("slideshow_fit") not in {"contain", "cover"}:
        cfg["slideshow_fit"] = "contain"
    cfg["slideshow_loop"] = bool(cfg.get("slideshow_loop", True))
    return cfg


def save_config(cfg: dict) -> dict:
    merged = dict(DEFAULT_CONFIG)
    existing = read_json_file(CONFIG_FILE, {})
    if isinstance(existing, dict):
        merged.update({k: existing.get(k, v) for k, v in DEFAULT_CONFIG.items()})
    merged.update({k: cfg.get(k, v) for k, v in DEFAULT_CONFIG.items()})
    merged["remember_path"] = bool(merged.get("remember_path"))
    merged["recursive"] = bool(merged.get("recursive"))
    merged["immersive"] = bool(merged.get("immersive"))
    merged["columns"] = clamp_int(merged.get("columns"), 6, 2, 20)
    merged["page_size"] = clamp_int(merged.get("page_size"), 120, 1, 240)
    merged["play_limit"] = play_limit_for_columns(merged["columns"])
    merged["wall_autoplay"] = bool(merged.get("wall_autoplay", True))
    merged["pause_when_inactive"] = bool(merged.get("pause_when_inactive", False))
    merged["confirm_trash"] = bool(merged.get("confirm_trash", True))
    merged["language"] = normalize_language(merged.get("language", "en"))
    merged["path_history"] = clean_path_list(merged.get("path_history"), 20)
    merged["path_favorites"] = clean_path_list(merged.get("path_favorites"), 30)
    merged["filename_exclude_enabled"] = bool(merged.get("filename_exclude_enabled", True))
    merged["filename_exclude_keywords"] = clean_exclude_keywords(merged.get("filename_exclude_keywords"), 30)
    merged["filename_exclude_scope"] = "all" if merged.get("filename_exclude_scope") == "all" else "image"
    merged["theme"] = "light" if merged.get("theme") == "light" else "dark"
    merged["font_size"] = merged.get("font_size") if merged.get("font_size") in {"small", "standard", "large"} else "standard"
    merged["content_align"] = merged.get("content_align") if merged.get("content_align") in {"left", "center", "right"} else "center"
    merged["button_style"] = "icons" if merged.get("button_style") == "icons" else "text"
    merged["slideshow_interval"] = clamp_int(merged.get("slideshow_interval"), 5, 1, 15)
    if merged.get("slideshow_effect") not in {"none", "fade", "slide", "drift", "random"}:
        merged["slideshow_effect"] = "drift"
    if merged.get("slideshow_fit") not in {"contain", "cover"}:
        merged["slideshow_fit"] = "contain"
    merged["slideshow_loop"] = bool(merged.get("slideshow_loop", True))
    if not merged["remember_path"]:
        merged["last_video_dir"] = ""
    else:
        merged["last_video_dir"] = normalize_path(merged.get("last_video_dir", ""))
    write_json_file(CONFIG_FILE, merged)
    return merged


def load_review_data() -> dict:
    return normalize_review_data(read_json_file(REVIEW_FILE, {}))


def save_review_data(data: dict) -> dict:
    clean = normalize_review_data(data)
    write_json_file(REVIEW_FILE, clean)
    return clean


def review_for_key(data: dict, key: str) -> dict:
    return normalized_review_for_key(data, key)


def update_review_item(key: str, changes: dict) -> dict:
    key = str(key or "").strip()
    if not key:
        raise ValueError("Missing review key")
    with review_lock:
        data = load_review_data()
        items = data.setdefault("items", {})
        current = normalize_review_item(items.get(key, {}))
        if "favorite" in changes:
            current["favorite"] = bool(changes.get("favorite"))
        if "selected" in changes:
            current["selected"] = bool(changes.get("selected"))
        if item_has_review_state(current):
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

def move_to_windows_recycle_bin(file_path: Path) -> None:
    if os.name != "nt":
        raise RuntimeError("System recycle bin is only supported on Windows.")
    script = (
        "$ErrorActionPreference = 'Stop'; "
        "$ProgressPreference = 'SilentlyContinue'; "
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; "
        "$OutputEncoding = [System.Text.Encoding]::UTF8; "
        "$Path = [Environment]::GetEnvironmentVariable('LOCAL_VIDEO_WALL_RECYCLE_PATH', 'Process'); "
        "if ([string]::IsNullOrWhiteSpace($Path)) { throw 'Missing recycle path.' }; "
        "Add-Type -AssemblyName Microsoft.VisualBasic; "
        "[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile("
        "$Path, "
        "[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs, "
        "[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)"
    )
    encoded_script = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    env = os.environ.copy()
    env["LOCAL_VIDEO_WALL_RECYCLE_PATH"] = str(file_path)
    last_message = "Unknown recycle bin error"
    for attempt in range(6):
        result = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-EncodedCommand",
                encoded_script,
            ],
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
        )
        if result.returncode == 0:
            return
        last_message = clean_powershell_error(result.stderr or result.stdout or last_message)
        if "being used by another process" not in last_message and "另一个程序正在使用" not in last_message:
            break
        if attempt < 5:
            time.sleep(0.45)
    raise RuntimeError(last_message)


def clean_powershell_error(message: str) -> str:
    text = (message or "").strip()
    if text.startswith("#< CLIXML"):
        error_parts = re.findall(r'<S S="Error">(.*?)</S>', text, flags=re.S)
        if error_parts:
            text = "\n".join(html.unescape(part) for part in error_parts)
    text = re.sub(r"_x([0-9A-Fa-f]{4})_", lambda m: chr(int(m.group(1), 16)), text)
    text = re.sub(r"\s+", " ", text).strip()
    return text or "Unknown recycle bin error"

def log_file_action(action: str, source: Path, destination: Path) -> None:
    record = {
        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "action": action,
        "source": str(source),
        "destination": str(destination),
    }
    with ACTION_LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def list_drive_roots() -> list[dict]:
    roots = []
    if os.name == "nt":
        drives = []
        if hasattr(os, "listdrives"):
            try:
                drives = list(os.listdrives())
            except Exception:
                drives = []
        if not drives:
            try:
                mask = ctypes.windll.kernel32.GetLogicalDrives()
                drives = [f"{chr(code)}:\\" for code in range(ord("A"), ord("Z") + 1) if mask & (1 << (code - ord("A")))]
            except Exception:
                drives = [f"{chr(code)}:\\" for code in range(ord("A"), ord("Z") + 1)]
        for drive in drives:
            p = Path(drive)
            if p.exists():
                roots.append({"name": drive.rstrip("\\"), "path": str(p), "type": "drive"})
    else:
        roots.append({"name": "/", "path": "/", "type": "root"})
        home = str(Path.home())
        if home != "/":
            roots.append({"name": "Home", "path": home, "type": "home"})
    return roots

def suggest_child_folders(partial_path: str, limit: int = 20) -> tuple[list[dict], str | None]:
    raw = (partial_path or "").strip().strip('"')
    if not raw:
        return [], None
    try:
        expanded = os.path.expanduser(raw)
        if os.name == "nt":
            expanded = expanded.replace("/", "\\")
            if re.fullmatch(r"[A-Za-z]:", expanded):
                parent = Path(expanded + "\\")
                prefix = ""
            elif expanded.endswith("\\"):
                parent = Path(expanded)
                prefix = ""
            else:
                parent = Path(ntpath.dirname(expanded) or expanded)
                prefix = ntpath.basename(expanded)
        else:
            if expanded.endswith("/"):
                parent = Path(expanded)
                prefix = ""
            else:
                parent = Path(os.path.dirname(expanded) or ".")
                prefix = os.path.basename(expanded)
    except Exception as exc:
        return [], f"Invalid path: {exc}"
    if not parent.exists() or not parent.is_dir():
        return [], None
    suggestions = []
    prefix_key = prefix.casefold()
    capped_limit = max(1, min(limit, 50))
    try:
        children = parent.iterdir()
        for child in children:
            try:
                if not child.is_dir():
                    continue
                if prefix_key and not child.name.casefold().startswith(prefix_key):
                    continue
                suggestions.append({"name": child.name, "path": str(child)})
                if len(suggestions) >= capped_limit:
                    break
            except Exception:
                continue
    except PermissionError:
        return [], None
    except Exception as exc:
        return [], f"Could not list folder: {exc}"
    suggestions.sort(key=lambda item: item["name"].casefold())
    return suggestions, None

def list_child_folders(path: str, limit: int = 300) -> tuple[list[dict], str | None]:
    folder = Path(normalize_path(path))
    if not folder.exists() or not folder.is_dir():
        return [], "Folder does not exist."
    entries = []
    try:
        children = list(folder.iterdir())
    except PermissionError:
        return [], "Permission denied."
    except Exception as exc:
        return [], f"Could not list folder: {exc}"
    dirs = []
    for child in children:
        try:
            if child.is_dir():
                dirs.append(child)
        except Exception:
            continue
    dirs.sort(key=lambda p: p.name.lower())
    for child in dirs[:limit]:
        entries.append({"name": child.name, "path": str(child), "type": "folder"})
    return entries, None


def get_current_video_dir() -> Path | None:
    with runtime_lock:
        p = runtime_video_dir
    if not p:
        return None
    return Path(p)


def register_scan_root(path: str) -> str:
    scan_id = uuid.uuid4().hex
    with runtime_lock:
        runtime_scan_roots[scan_id] = normalize_path(path)
    return scan_id


def get_scan_root(scan_id: str) -> Path | None:
    scan_id = (scan_id or "").strip()
    if not scan_id:
        return get_current_video_dir()
    with runtime_lock:
        p = runtime_scan_roots.get(scan_id)
    if not p:
        return get_current_video_dir()
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


def scan_videos(
    video_dir: str,
    recursive: bool,
    exclude_enabled: bool = True,
    exclude_keywords: list[str] | None = None,
    exclude_scope: str = "image",
) -> tuple[list[dict], str | None, str, int]:
    root = Path(normalize_path(video_dir))
    if not str(root).strip():
        return [], "Folder path is empty. Please enter or choose a video folder first.", "", 0
    if not root.exists():
        return [], f"Path does not exist: {root}", "", 0
    if not root.is_dir():
        return [], f"This is not a folder path: {root}", "", 0

    files: list[Path] = []
    excluded_count = 0
    keyword_keys = [keyword.casefold() for keyword in clean_exclude_keywords(exclude_keywords or [], 30)]
    exclude_scope = "all" if exclude_scope == "all" else "image"
    try:
        candidates = []
        if recursive:
            for current, dirs, names in os.walk(root):
                current_path = Path(current)
                try:
                    depth = len(current_path.relative_to(root).parts)
                except ValueError:
                    continue
                dirs[:] = [name for name in dirs if name not in INTERNAL_MEDIA_DIRS]
                if depth >= 2:
                    dirs[:] = []
                candidates.extend(current_path / name for name in names)
        else:
            candidates = list(root.iterdir())
        for p in candidates:
            try:
                if any(part in INTERNAL_MEDIA_DIRS for part in p.relative_to(root).parts):
                    continue
                suffix = p.suffix.lower()
                if not p.is_file() or suffix not in MEDIA_EXTENSIONS:
                    continue
                should_filter_type = exclude_scope == "all" or suffix in IMAGE_EXTENSIONS
                if exclude_enabled and keyword_keys and should_filter_type:
                    filename_key = p.name.casefold()
                    if any(keyword in filename_key for keyword in keyword_keys):
                        excluded_count += 1
                        continue
                files.append(p)
            except OSError:
                continue
    except Exception as exc:
        return [], f"Scan failed: {exc}", "", 0

    try:
        files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    except Exception:
        files.sort(key=lambda p: str(p).lower())

    videos = []
    review_data = load_review_data()
    root_resolved = root.resolve()
    scan_id = register_scan_root(str(root_resolved))
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
                "full_path": key,
                "scan_id": scan_id,
                "url": f"/media?scan_id={quote(scan_id, safe='')}&path={quote(rel, safe='')}",
                "size_mb": round(st.st_size / 1024 / 1024, 2),
                "mtime": int(st.st_mtime),
                "mtime_text": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_mtime)),
                "favorite": review["favorite"],
                "selected": review["selected"],
            })
        except Exception:
            continue
    return videos, None, scan_id, excluded_count


def _choose_modern_windows_folder(title: str) -> str | None:
    if os.name != "nt":
        return None
    try:
        import ctypes
        from ctypes import wintypes

        ole32 = ctypes.WinDLL("ole32")

        class GUID(ctypes.Structure):
            _fields_ = [
                ("Data1", wintypes.DWORD),
                ("Data2", wintypes.WORD),
                ("Data3", wintypes.WORD),
                ("Data4", wintypes.BYTE * 8),
            ]

        ole32.CLSIDFromString.argtypes = [wintypes.LPCWSTR, ctypes.POINTER(GUID)]
        ole32.CLSIDFromString.restype = ctypes.c_long
        ole32.CoInitializeEx.argtypes = [ctypes.c_void_p, wintypes.DWORD]
        ole32.CoInitializeEx.restype = ctypes.c_long
        ole32.CoUninitialize.argtypes = []
        ole32.CoUninitialize.restype = None
        ole32.CoCreateInstance.argtypes = [
            ctypes.POINTER(GUID),
            ctypes.c_void_p,
            wintypes.DWORD,
            ctypes.POINTER(GUID),
            ctypes.POINTER(ctypes.c_void_p),
        ]
        ole32.CoCreateInstance.restype = ctypes.c_long
        ole32.CoTaskMemFree.argtypes = [ctypes.c_void_p]
        ole32.CoTaskMemFree.restype = None

        def make_guid(value: str) -> GUID:
            guid = GUID()
            hr = ole32.CLSIDFromString(value, ctypes.byref(guid))
            if hr < 0:
                raise OSError(hr)
            return guid

        clsid_file_open_dialog = make_guid("{DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7}")
        iid_file_open_dialog = make_guid("{D57C7288-D4AD-4768-BE02-9D969532D960}")

        coinit_apartmentthreaded = 0x2
        clsctx_inproc_server = 0x1
        fos_pickfolders = 0x20
        fos_forcefilesystem = 0x40
        fos_nochangedir = 0x8
        fos_pathmustexist = 0x800
        sigdn_filesyspath = 0x80058000
        hresult_cancelled = -2147023673

        initialized = False
        dialog = ctypes.c_void_p()
        item = ctypes.c_void_p()
        name_ptr = ctypes.c_void_p()
        release_dialog = None
        release_item = None

        hr = ole32.CoInitializeEx(None, coinit_apartmentthreaded)
        if hr >= 0:
            initialized = True
        elif hr != -2147417850:
            return None

        try:
            hr = ole32.CoCreateInstance(
                ctypes.byref(clsid_file_open_dialog),
                None,
                clsctx_inproc_server,
                ctypes.byref(iid_file_open_dialog),
                ctypes.byref(dialog),
            )
            if hr < 0 or not dialog.value:
                return None

            dialog_vtbl = ctypes.cast(dialog, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents

            def dialog_method(index, restype, *argtypes):
                return ctypes.WINFUNCTYPE(restype, ctypes.c_void_p, *argtypes)(dialog_vtbl[index])

            get_options = dialog_method(10, ctypes.c_long, ctypes.POINTER(wintypes.DWORD))
            set_options = dialog_method(9, ctypes.c_long, wintypes.DWORD)
            set_title = dialog_method(17, ctypes.c_long, wintypes.LPCWSTR)
            set_ok_label = dialog_method(18, ctypes.c_long, wintypes.LPCWSTR)
            show = dialog_method(3, ctypes.c_long, wintypes.HWND)
            get_result = dialog_method(20, ctypes.c_long, ctypes.POINTER(ctypes.c_void_p))
            release_dialog = dialog_method(2, wintypes.ULONG)

            options = wintypes.DWORD()
            hr = get_options(dialog, ctypes.byref(options))
            if hr < 0:
                return None
            hr = set_options(
                dialog,
                options.value | fos_pickfolders | fos_forcefilesystem | fos_nochangedir | fos_pathmustexist,
            )
            if hr < 0:
                return None
            set_title(dialog, title)
            set_ok_label(dialog, "Select Folder")

            hr = show(dialog, None)
            if hr == hresult_cancelled:
                return ""
            if hr < 0:
                return None

            hr = get_result(dialog, ctypes.byref(item))
            if hr < 0 or not item.value:
                return None

            item_vtbl = ctypes.cast(item, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents

            def item_method(index, restype, *argtypes):
                return ctypes.WINFUNCTYPE(restype, ctypes.c_void_p, *argtypes)(item_vtbl[index])

            get_display_name = item_method(5, ctypes.c_long, wintypes.DWORD, ctypes.POINTER(ctypes.c_void_p))
            release_item = item_method(2, wintypes.ULONG)

            hr = get_display_name(item, sigdn_filesyspath, ctypes.byref(name_ptr))
            if hr < 0 or not name_ptr.value:
                return None
            return ctypes.wstring_at(name_ptr)
        finally:
            if name_ptr.value:
                ole32.CoTaskMemFree(name_ptr)
            if item.value and release_item:
                release_item(item)
            if dialog.value and release_dialog:
                release_dialog(dialog)
            if initialized:
                ole32.CoUninitialize()
    except Exception:
        return None


def _choose_legacy_windows_folder(title: str) -> str:
    script = r"""
Add-Type -AssemblyName System.Windows.Forms
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "__TITLE__"
$dialog.ShowNewFolderButton = $false
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
}
""".replace("__TITLE__", title.replace('"', "'"))
    try:
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-STA", "-Command", script],
            input=str(file_path),
        capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        return completed.stdout.strip()
    except Exception:
        return ""


def choose_folder_dialog() -> str:
    title = "Choose a video folder"
    if os.name == "nt":
        selected = _choose_modern_windows_folder(title)
        if selected is not None:
            return selected
        selected = _choose_legacy_windows_folder(title)
        if selected:
            return selected
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        selected = filedialog.askdirectory(title=title)
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

    def serve_media(self, rel: str, scan_id: str = ""):
        root = get_scan_root(scan_id)
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

    def api_open_in_explorer(self, rel: str, scan_id: str = ""):
        root = get_scan_root(scan_id)
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

    def api_open_file_default_app(self, rel: str, scan_id: str = ""):
        root = get_scan_root(scan_id)
        if root is None:
            self.send_json({"ok": False, "error": "Please choose and scan a media folder first."}, 400)
            return
        try:
            file_path = safe_rel_to_path(root, rel)
        except ValueError:
            self.send_json({"ok": False, "error": "Invalid path"}, 403)
            return
        if not file_path.exists() or not file_path.is_file():
            self.send_json({"ok": False, "error": "File not found"}, 404)
            return
        try:
            if os.name == "nt":
                os.startfile(str(file_path))  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                subprocess.Popen(["open", str(file_path)])
            else:
                subprocess.Popen(["xdg-open", str(file_path)])
        except Exception as exc:
            self.send_json({"ok": False, "error": f"Could not open file: {exc}"}, 500)
            return
        self.send_json({"ok": True})

    def api_metadata(self, rel: str, scan_id: str = ""):
        root = get_scan_root(scan_id)
        if root is None:
            self.send_json({"ok": False, "error": "Please choose and scan a media folder first."}, 400)
            return
        try:
            file_path = safe_rel_to_path(root, rel)
        except ValueError:
            self.send_json({"ok": False, "error": "Invalid path"}, 403)
            return
        if not file_path.exists() or not file_path.is_file():
            self.send_json({"ok": False, "error": "File not found"}, 404)
            return
        suffix = file_path.suffix.lower()
        if suffix not in MEDIA_EXTENSIONS:
            self.send_json({"ok": False, "error": "Unsupported media type"}, 415)
            return
        media_type = "video" if suffix in VIDEO_EXTENSIONS else "image"
        try:
            metadata_parts = [
                read_embedded_metadata(file_path, media_type),
                read_sidecar_metadata(file_path),
            ]
            if media_type == "video":
                metadata_parts.append(read_ffprobe_metadata(file_path, media_type))
            metadata = merge_metadata(*metadata_parts)
            self.send_json({"ok": True, "metadata": metadata_to_dict(metadata)})
        except Exception as exc:
            self.send_json({"ok": False, "error": f"Metadata read failed: {exc}"}, 500)

    def api_file_action(self, payload: dict):
        root = get_scan_root(str(payload.get("scan_id", "")))
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
        if action == "move_trash":
            try:
                move_to_windows_recycle_bin(file_path)
            except Exception as exc:
                self.send_json({"ok": False, "error": f"Move to Recycle Bin failed: {exc}"}, 500)
                return
            destination = "Windows Recycle Bin"
            log_file_action(action, file_path, Path(destination))
            self.send_json({"ok": True, "action": action, "destination": destination, "new_rel": ""})
            return

        target_name = "_video_wall_review"
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
        if path == "/api/fs/roots":
            self.send_json({"ok": True, "roots": list_drive_roots()})
            return
        if path == "/api/fs/suggest":
            partial_path = qs.get("path", [""])[0]
            suggestions, error = suggest_child_folders(unquote(partial_path))
            if error:
                self.send_json({"ok": False, "error": error, "suggestions": []}, 400)
            else:
                self.send_json({"ok": True, "suggestions": suggestions})
            return
        if path == "/api/fs/list":
            folder_path = qs.get("path", [""])[0]
            folders, error = list_child_folders(unquote(folder_path))
            if error:
                self.send_json({"ok": False, "error": error, "folders": []}, 400)
            else:
                self.send_json({"ok": True, "path": normalize_path(unquote(folder_path)), "folders": folders})
            return
        if path == "/api/open":
            rel = qs.get("path", [""])[0]
            scan_id = qs.get("scan_id", [""])[0]
            self.api_open_in_explorer(rel, scan_id)
            return
        if path == "/api/open-file":
            rel = qs.get("path", [""])[0]
            scan_id = qs.get("scan_id", [""])[0]
            self.api_open_file_default_app(rel, scan_id)
            return
        if path == "/api/metadata":
            rel = qs.get("path", [""])[0]
            scan_id = qs.get("scan_id", [""])[0]
            self.api_metadata(rel, scan_id)
            return
        if path == "/api/review":
            self.send_json({"ok": True, "review": load_review_data()})
            return
        if path == "/media":
            rel = qs.get("path", [""])[0]
            scan_id = qs.get("scan_id", [""])[0]
            self.serve_media(rel, scan_id)
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
            exclude_enabled = bool(payload.get("filename_exclude_enabled", True))
            exclude_keywords = clean_exclude_keywords(payload.get("filename_exclude_keywords"), 30)
            exclude_scope = "all" if payload.get("filename_exclude_scope") == "all" else "image"
            remember_path = bool(payload.get("remember_path", False))
            columns = clamp_int(payload.get("columns"), 6, 2, 20)
            page_size = clamp_int(payload.get("page_size"), 120, 1, 240)
            play_limit = play_limit_for_columns(columns)
            sort_mode = payload.get("sort_mode", "mtime_desc")
            immersive = bool(payload.get("immersive", False))
            language = normalize_language(payload.get("language", "en"))
            videos, error, scan_id, excluded_count = scan_videos(
                video_dir, recursive, exclude_enabled, exclude_keywords, exclude_scope
            )
            if error:
                self.send_json({"ok": False, "error": error, "videos": []}, 400)
                return
            set_current_video_dir(video_dir)
            current_cfg = load_config()
            cfg = save_config({
                "remember_path": remember_path,
                "last_video_dir": video_dir if remember_path else "",
                "path_history": add_recent_path(current_cfg.get("path_history", []), video_dir),
                "path_favorites": current_cfg.get("path_favorites", []),
                "recursive": recursive,
                "filename_exclude_enabled": exclude_enabled,
                "filename_exclude_keywords": exclude_keywords,
                "filename_exclude_scope": exclude_scope,
                "columns": columns,
                "page_size": page_size,
                "play_limit": play_limit,
                "wall_autoplay": bool(payload.get("wall_autoplay", DEFAULT_CONFIG["wall_autoplay"])),
                "preview_large_videos": bool(payload.get("preview_large_videos", DEFAULT_CONFIG["preview_large_videos"])),
                "pause_when_inactive": bool(payload.get("pause_when_inactive", DEFAULT_CONFIG["pause_when_inactive"])),
                "confirm_trash": bool(payload.get("confirm_trash", DEFAULT_CONFIG["confirm_trash"])),
                "sort_mode": sort_mode,
                "immersive": immersive,
                "language": language,
                "theme": payload.get("theme", DEFAULT_CONFIG["theme"]),
                "font_size": payload.get("font_size", DEFAULT_CONFIG["font_size"]),
                "content_align": payload.get("content_align", DEFAULT_CONFIG["content_align"]),
                "button_style": payload.get("button_style", DEFAULT_CONFIG["button_style"]),
                "slideshow_interval": payload.get("slideshow_interval", DEFAULT_CONFIG["slideshow_interval"]),
                "slideshow_effect": payload.get("slideshow_effect", DEFAULT_CONFIG["slideshow_effect"]),
                "slideshow_fit": payload.get("slideshow_fit", DEFAULT_CONFIG["slideshow_fit"]),
                "slideshow_loop": bool(payload.get("slideshow_loop", DEFAULT_CONFIG["slideshow_loop"])),
            })
            self.send_json({
                "ok": True,
                "video_dir": video_dir,
                "scan_id": scan_id,
                "count": len(videos),
                "excluded_count": excluded_count,
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
                "filename_exclude_enabled": bool(payload.get("filename_exclude_enabled", cfg.get("filename_exclude_enabled", True))),
                "filename_exclude_keywords": clean_exclude_keywords(
                    payload.get("filename_exclude_keywords", cfg.get("filename_exclude_keywords", [])), 30
                ),
                "filename_exclude_scope": "all" if payload.get(
                    "filename_exclude_scope", cfg.get("filename_exclude_scope", "image")
                ) == "all" else "image",
                "columns": clamp_int(payload.get("columns", cfg.get("columns", 6)), 6, 2, 20),
                "page_size": clamp_int(payload.get("page_size", cfg.get("page_size", 120)), 120, 1, 240),
                "wall_autoplay": bool(payload.get("wall_autoplay", cfg.get("wall_autoplay", True))),
                "preview_large_videos": bool(payload.get("preview_large_videos", cfg.get("preview_large_videos", False))),
                "pause_when_inactive": bool(payload.get("pause_when_inactive", cfg.get("pause_when_inactive", False))),
                "confirm_trash": bool(payload.get("confirm_trash", cfg.get("confirm_trash", True))),
                "sort_mode": payload.get("sort_mode", cfg.get("sort_mode", "mtime_desc")),
                "immersive": bool(payload.get("immersive", cfg.get("immersive", False))),
                "language": normalize_language(payload.get("language", cfg.get("language", "en"))),
                "theme": payload.get("theme", cfg.get("theme", "dark")),
                "font_size": payload.get("font_size", cfg.get("font_size", "standard")),
                "content_align": payload.get("content_align", cfg.get("content_align", "center")),
                "button_style": payload.get("button_style", cfg.get("button_style", "text")),
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
        if path == "/api/path-state":
            cfg = load_config()
            action = str(payload.get("action", "")).strip()
            folder_path = normalize_path(payload.get("path", ""))
            if action == "favorite":
                favorites = clean_path_list(cfg.get("path_favorites"), 30)
                exists = any(os.path.normcase(x) == os.path.normcase(folder_path) for x in favorites)
                if folder_path and not exists:
                    favorites.insert(0, folder_path)
                cfg["path_favorites"] = clean_path_list(favorites, 30)
            elif action == "unfavorite":
                cfg["path_favorites"] = [
                    x for x in clean_path_list(cfg.get("path_favorites"), 30)
                    if os.path.normcase(x) != os.path.normcase(folder_path)
                ]
            elif action == "history":
                cfg["path_history"] = add_recent_path(cfg.get("path_history", []), folder_path)
            elif action == "remove_history":
                cfg["path_history"] = [
                    x for x in clean_path_list(cfg.get("path_history"), 20)
                    if os.path.normcase(x) != os.path.normcase(folder_path)
                ]
            elif action == "clear_history":
                cfg["path_history"] = []
            else:
                self.send_json({"ok": False, "error": "Unknown path-state action."}, 400)
                return
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
