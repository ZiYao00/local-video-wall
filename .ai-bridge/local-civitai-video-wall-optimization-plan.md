# Local Civitai Video Wall - Codex Optimization Plan

This document is an execution guide for Codex/CodexPro. It captures the agreed product direction, safety boundaries, staged refactor strategy, and concrete task sequence for `local-civitai-video-wall`.

## 0. Current Decision

Use a hybrid workflow:

- ChatGPT: product direction, architecture planning, safety boundaries, task decomposition, review of diffs, and small targeted fixes.
- Codex: local implementation of clearly scoped code changes.
- User: approves each phase before the next phase starts.

Do not treat this as permission to perform a large rewrite. Every task must be small, reviewable, and reversible.

## 1. Project Positioning

The project should remain:

> A local AI image/video asset browser for fast review, screening, marking, and retrieval.

It should not become:

- a second `infinite-image-browsing`
- a cloud album
- a full DAM system
- a general file manager
- a cloud sync product
- a multi-user service

Primary user workflow:

- Browse local AI images and short videos from Civitai, ComfyUI, A1111 / Stable Diffusion WebUI, Wan, Kling, Runway, and similar tools.
- Quickly screen many local assets.
- Favorite, select, reject, tag, rate, and annotate assets.
- Later find assets by prompt, model, LoRA, workflow, source URL, tags, review status, and project/collection.

The app must stay lightweight, Windows-friendly, local-first, and easy to start.

## 2. Current Observed Repository State

At the time this plan was written, the project had existing uncommitted changes:

```text
 M CHANGELOG.md
 M README.md
 M README.zh-CN.md
 M ROADMAP.md
 M static/app.js
 M static/index.html
 M static/style.css
```

The repository was also ahead of `origin/main` by 1 commit.

Codex must not overwrite or discard these changes without explicit user approval.

A zip backup was created before this document:

```text
G:\GitHub\_backups\local-civitai-video-wall_20260630-173643.zip
```

## 3. Safety Rules

These rules are mandatory.

### 3.1 Before Any Code Change

Before modifying files, Codex must report:

- the exact files it plans to modify
- why each file needs to be modified
- whether the change is documentation-only or source-code related
- whether the change affects runtime behavior

### 3.2 Git Rules

- Do not create commits unless the user explicitly asks.
- Do not reset, checkout, stash, clean, or discard changes without explicit user approval.
- Do not assume existing uncommitted changes are safe to overwrite.
- Use diff review after every task.

### 3.3 Deletion Rules

Do not perform batch deletion.

Forbidden commands or equivalents include:

```text
rm -rf
rm -r
rm -R
find ... -delete
xargs rm
git clean -fd
git clean -xdf
del /s
rd /s
rmdir /s
Remove-Item -Recurse
Remove-Item -r
robocopy /MIR
rimraf
npx rimraf
```

If a deletion is truly needed, delete only one explicit file path at a time, after explaining the path and reason. Do not delete directories recursively.

### 3.4 Scope Rules

Default workspace:

```text
G:\GitHub\local-civitai-video-wall
```

Allowed root:

```text
G:\GitHub
```

Do not modify files outside the workspace unless the user explicitly approves a specific path.

### 3.5 Runtime Behavior Rules

Do not introduce changes that:

- require cloud accounts
- require Docker-first distribution
- require a large frontend framework
- require a full backend framework migration
- change the default start flow unexpectedly
- generate thumbnail/video caches by default
- permanently delete media by default
- scan entire drives by default
- hash full large video files by default

## 4. High-Level Roadmap Adjustment

Keep the existing roadmap direction, but insert one important intermediate phase before AI metadata features.

Recommended sequence:

```text
v1.7.x  Maintenance
v1.7.5  Architecture Guardrails
v1.8.0  AI Metadata Preview
v1.9.0  Tags / Rating / Notes / Collections
v2.0.0  SQLite Local Index
v2.1.0  Metadata Search
v2.2.0  Optional Preview Cache
v2.3.0  Packaging
```

The new `v1.7.5 - Architecture Guardrails` phase is mandatory before deeper feature work.

## 5. Architecture Direction

Current project structure is intentionally lightweight, but the main files are becoming large:

```text
app.py          backend entry and many backend behaviors
static/app.js   large frontend controller and UI behavior file
```

Do not perform a large rewrite. Use progressive modularization.

### 5.1 Backend First

Backend modularization is lower-risk and should happen first.

Recommended future modules:

```text
core/
  __init__.py
  json_store.py
  path_utils.py
  file_identity.py

review/
  __init__.py
  schema.py
  store.py

metadata/
  __init__.py
  schema.py
  normalizer.py
  embedded_reader.py
  sidecar_reader.py
  ffprobe_reader.py
```

Initial purpose:

- `core/`: safe JSON read/write, path utilities, future file identity helpers.
- `review/`: review state schema and persistence, including favorite, selected, tags, rating, note, collections.
- `metadata/`: metadata schema and future readers for ComfyUI, A1111, sidecar JSON, ffprobe, ExifTool, MediaInfo.

### 5.2 Keep `app.py` as Entry and Routing Layer

Long-term direction:

`app.py` should gradually become responsible for:

- service startup
- route handling
- request parsing
- response formatting
- calling focused modules

Other modules should handle:

- JSON persistence
- review state logic
- metadata extraction
- file identity
- CSV export logic
- cache/index logic

Do not try to split all of `app.py` in one pass.

### 5.3 Frontend Later

`static/app.js` is large, but do not immediately split it into multiple module files unless the user approves.

First safe step:

- keep one `static/app.js`
- organize functions by clear sections
- add focused functions for metadata UI and review UI
- avoid changing the script loading model

Later possible frontend layout:

```text
static/js/state.js
static/js/api.js
static/js/render.js
static/js/modals.js
static/js/metadata.js
static/js/review.js
static/js/i18n.js
```

Do not introduce React, Vue, Vite, or any bundler without explicit user approval.

## 6. Data Model Direction

### 6.1 Review State

Current short-term storage remains:

```text
review_data.json
```

Before adding tags/rating/notes/collections, introduce a schema version.

Recommended future structure:

```json
{
  "schema_version": 2,
  "items": {
    "file_key": {
      "path": "G:/path/to/file.png",
      "path_norm": "g:/path/to/file.png",
      "size": 123456,
      "mtime": 1710000000,
      "favorite": true,
      "selected": false,
      "review_status": "keep",
      "rating": 4,
      "tags": ["usable", "character"],
      "collections": ["Ningya character pool"],
      "note": ""
    }
  }
}
```

Backward compatibility is required. Old `review_data.json` formats must continue to load.

### 6.2 Review Status vs Tags vs Collections

Do not mix these concepts.

Review status describes workflow state:

```text
unreviewed
keep
featured
pending-edit
published
rejected
```

Tags describe content attributes:

```text
reference
usable
character
style
motion
camera
pose
expression
sfw
nsfw
```

Collections/projects describe grouping:

```text
Ningya character pool
Lingxia character pool
Camellia oil project
Wan video test
ComfyUI workflow test
Civitai downloads
```

### 6.3 File Identity Strategy

Do not rely only on raw path forever.

Plan for:

```text
path_norm
size
mtime
extension
quick_hash optional
last_seen_at
missing
```

Do not hash full large videos by default.

First approach:

- keep path-based behavior for compatibility
- add normalized path and file stats where safe
- add quick hash later only as an opt-in or lightweight index feature

## 7. Metadata Direction

The first metadata implementation should be preview-only, not search-first.

Priority order:

```text
1. Embedded image metadata
2. Same-name sidecar JSON
3. ffprobe / MediaInfo technical metadata
4. Basic filesystem information
```

Initial sources:

- Stable Diffusion WebUI / A1111 PNG `parameters`
- ComfyUI PNG `prompt` and `workflow`
- common PNG / WebP / JPEG embedded text or EXIF fields where practical
- sidecar JSON:
  - `name.json`
  - `name.ext.json`
  - `name.info.json`
  - `name.civitai.json`
- video technical information through `ffprobe` when available

Do not make external tools mandatory in v1.8.0.

Unified metadata fields:

```text
file_path
media_type
width
height
duration
fps
codec
format
prompt
negative_prompt
model
loras
seed
sampler
steps
cfg_scale
source_app
source_url
civitai_model_url
civitai_version_url
workflow
raw_metadata
metadata_sources
metadata_status
```

UI should show metadata mainly in preview/modals, not crowded media grid cards.

Recommended copy actions:

- Copy Prompt
- Copy Negative Prompt
- Copy Model
- Copy Source URL or file path
- Copy Markdown summary
- Copy Raw JSON

## 8. SQLite Direction

SQLite should not be introduced before the review and metadata schemas are stable.

When introduced, SQLite starts as:

- local cache
- local index
- search foundation

Do not immediately replace all JSON state.

Recommended database:

```text
local_civitai_video_wall.db
```

Recommended future tables:

```text
media_files
review_state
tags
media_tags
collections
media_collections
metadata
scan_roots
```

Keep:

- JSON backup/export
- rebuild index
- repair index
- missing file marking
- no silent deletion of records

Search foundation:

- SQLite FTS5 for filename, prompt, negative prompt, model, LoRA, source URL, note, tags, and collections.

## 9. Cache Direction

Preview cache should be optional and later-phase only.

Do not default to generating persistent thumbnail or video cover cache.

Rules:

- cache generation is optional
- do not auto-generate cache for the whole disk
- support current-folder generation
- support video-only or image-only generation
- support cache size limits
- support cleanup and rebuild
- exclude cache files from normal media scans
- do not block the main UI while generating

Cache location should be evaluated later. Avoid polluting source media folders by default.

Possible locations:

- project-managed cache directory
- Windows AppData
- explicitly configured cache path

## 10. Packaging Direction

Packaging is not the next immediate priority, but document the future direction.

Future packaging tasks:

- GitHub Release ZIP
- one-click start path
- background service menu
- Python version check
- port occupation check
- optional `ffmpeg` / `ffprobe` / `exiftool` availability checks
- optional `portable_tools/` support
- one-click open logs
- one-click open config directory
- one-click reset config, after confirmation

Do not add a complex installer or account system.

## 11. Recommended Task Sequence for Codex

### Task 1 - Documentation Plan Only

Allowed files:

```text
ROADMAP.md
CHANGELOG.md
README.md
README.zh-CN.md
.ai-bridge/local-civitai-video-wall-optimization-plan.md
```

Goal:

- update roadmap to include `v1.7.5 - Architecture Guardrails`
- keep README and Chinese README aligned if their roadmap/current-direction sections mention future direction
- update CHANGELOG only if appropriate, under an unreleased/documentation section

Do not change runtime behavior.

Acceptance:

- Roadmap has the new v1.7.5 phase
- The current v1.8+ direction is not removed
- No source-code behavior change
- Diff is documentation-only

### Task 2 - Backend Module Skeleton Only

Allowed files:

```text
core/__init__.py
core/json_store.py
core/path_utils.py
core/file_identity.py
review/__init__.py
review/schema.py
review/store.py
metadata/__init__.py
metadata/schema.py
metadata/normalizer.py
```

Goal:

- create minimal modules with clear docstrings and type hints
- do not wire them deeply into `app.py` yet
- no UI change

Acceptance:

- project still starts
- no existing behavior changes
- modules are importable

### Task 3 - Safe JSON Store

Allowed files:

```text
core/json_store.py
app.py
```

Goal:

- add safe JSON read/write helper
- use temp file then replace for writes
- preserve UTF-8 behavior
- do not change config/review semantics

Acceptance:

- config still loads and saves
- review data still loads and saves
- old files remain compatible

### Task 4 - Review Store Compatibility Layer

Allowed files:

```text
review/schema.py
review/store.py
app.py
```

Goal:

- introduce schema version support in code
- support old review data loading
- prepare fields for tags, rating, notes, collections
- do not expose new UI yet unless explicitly approved

Acceptance:

- favorites and selected marks still work
- existing review data not lost
- old JSON can still be read

### Task 5 - Metadata Schema and Normalizer

Allowed files:

```text
metadata/schema.py
metadata/normalizer.py
metadata/embedded_reader.py
metadata/sidecar_reader.py
metadata/ffprobe_reader.py
app.py
```

Goal:

- implement metadata object schema
- implement robust normalize function
- implement embedded and sidecar readers incrementally
- keep failures non-fatal

Acceptance:

- unsupported files return a safe empty metadata object
- broken metadata does not crash preview
- no mandatory external dependency

### Task 6 - Metadata Preview API

Allowed files:

```text
app.py
metadata/*
```

Goal:

- add a local API endpoint to retrieve metadata for one media item
- validate requested path belongs to current scan roots or allowed project/media path logic
- do not expose arbitrary file reads

Acceptance:

- API returns normalized metadata JSON
- missing metadata returns `metadata_status` safely
- bad path does not crash server

### Task 7 - Metadata Preview UI

Allowed files:

```text
static/app.js
static/index.html
static/style.css
```

Goal:

- show metadata inside image/video preview modal
- add copy actions
- avoid crowding grid cards
- keep existing modal navigation and playback behavior

Acceptance:

- image preview still works
- video preview still works
- slideshow still works
- copy actions work when metadata exists
- no console errors in common paths

### Task 8 - Tags / Rating / Notes / Collections

Do not start until Tasks 1-7 are reviewed and approved.

Goal:

- implement user-defined tags
- implement rating
- implement note
- implement collections/projects
- keep review status separate from tags

Acceptance:

- old favorites/selected still work
- CSV export includes relevant fields
- batch actions are predictable

### Task 9 - SQLite Local Index

Do not start until JSON schemas and metadata format are stable.

Goal:

- introduce SQLite as local cache/index
- keep JSON backup/export
- add rebuild/repair actions

Acceptance:

- repeated scans improve or remain stable
- missing files are marked, not silently deleted
- JSON data can be exported

## 12. Smoke Test Checklist

Run after each meaningful change where practical:

```text
1. Start service
2. Open http://127.0.0.1:8787
3. Scan a small folder
4. Scan a folder with subfolders
5. Open image preview
6. Open slideshow
7. Open video preview
8. Favorite / unfavorite
9. Select / unselect if supported
10. Batch select and clear selection
11. Export CSV
12. Move one test media file to Windows Recycle Bin only after confirmation
13. Open media with default app
14. Check Chinese / English UI toggle
15. Check dark / light theme
```

Do not test destructive actions on important user media. Use a test folder.

## 13. Codex Response Requirements

After each task, Codex must report:

```text
- Files changed
- Summary of changes
- Runtime behavior changed or not
- Backward compatibility notes
- Tests run
- Risks / follow-up items
```

If Codex cannot complete a step safely, it should stop and explain instead of improvising.

## 14. First Next Action

The next recommended action is Task 1:

```text
Documentation Plan Only
```

Do not start source-code modularization until the user confirms the updated roadmap/documentation direction.
