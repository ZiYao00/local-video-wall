# Roadmap

This roadmap defines the product direction for Local Video Wall.

Local Video Wall should not become a second `infinite-image-browsing`, a cloud album, or a general file manager. Its target is narrower:

> A local AI image/video asset browser for fast review, screening, marking, metadata inspection, and retrieval.

## Product Boundary

### The app should focus on

- Browsing local AI image and video folders.
- Reviewing Civitai-downloaded images and videos.
- Reviewing local outputs from ComfyUI, Stable Diffusion WebUI / A1111, Wan, Kling, Runway, and similar tools.
- Screening many local short videos and generated images quickly.
- Marking, favoriting, rejecting, batch-reviewing, and safely moving unwanted assets to the Windows Recycle Bin.
- Inspecting available generation metadata such as Prompt, Negative Prompt, model, LoRA, seed, workflow, source URL, and technical media information.
- Later, finding assets by prompt, model, LoRA, source URL, tags, notes, rating, and local review status.

### The app should not become

- A cloud album.
- A multi-user DAM system.
- A remote sync service.
- A full video editor.
- A ComfyUI plugin.
- A Docker-first server app.
- A large framework rewrite for its own sake.

## Documentation Direction

The README should be written for daily users first, not only for developers.

Recommended README order:

1. Explain the daily AI-media workflow problem.
2. Explain how Local Video Wall solves that problem.
3. Show a typical usage flow.
4. Summarize core capabilities in a few clear groups.
5. Explain what the tool is good for and not good for.
6. Explain installation, startup, and troubleshooting.
7. Explain local/safety behavior.
8. Explain current status and future roadmap.

Documentation rules:

- Do not describe the project as a ComfyUI plugin.
- Do not describe unfinished features as finished.
- Keep `README.md`, `README.zh-CN.md`, `ROADMAP.md`, and `CHANGELOG.md` synchronized before each GitHub release.
- Clearly distinguish packaged GitHub Releases, the `main` branch, current metadata features, and future roadmap items.
- Keep technical details available, but do not let them hide the user problem and workflow value.

## Development Principles

- Do not build every capability from scratch.
- Prefer mature open-source libraries, CLI tools, or small focused modules.
- Do not merge large external projects wholesale unless the architecture is very close.
- Put third-party integrations behind adapters instead of scattering tool-specific code through the app.
- Keep every release runnable; avoid large rewrites that leave the app half-migrated.
- Keep destructive operations reversible, visible, and clearly confirmed.
- Prioritize Windows local use. Cross-platform behavior is useful, but not the first constraint.
- Avoid mandatory external dependencies for normal browsing.
- Avoid persistent cache generation unless the user opts in.

## Product Pillars

### 1. Fast local media review

The app should make it easy to scan a large folder visually without opening each file one by one.

Key ideas:

- Waterfall-style media wall.
- Multi-video silent autoplay for visible videos.
- Static previews for dense grid modes.
- Pagination and page-size controls for large folders.
- Good default settings for normal browsing and fast screening.

### 2. AI-media context

The app should understand common AI generation metadata when it exists.

Key ideas:

- A1111 PNG `parameters`.
- ComfyUI PNG `prompt` and `workflow`.
- Same-name sidecar JSON.
- Prompt and Negative Prompt.
- Model and LoRA information.
- Optional video container metadata through `ffprobe`.

### 3. Lightweight local review workflow

The app should help users decide what to keep, revisit, export, or remove.

Key ideas:

- Favorites.
- Batch selection.
- CSV export.
- Review state that can later evolve into tags, notes, ratings, and collections.
- Safe move-to-Recycle-Bin behavior.

### 4. Local-first safety

The app should be predictable and private for local media folders.

Key ideas:

- Run locally on `127.0.0.1`.
- Do not upload media files.
- Keep settings and review data local.
- Make local paths visible and understandable.
- Use reversible cleanup behavior whenever possible.

### 5. Small, reviewable architecture

The app should evolve through small backend boundaries, not large rewrites.

Key ideas:

- Keep `app.py` as entry and route layer while extracting small helpers.
- Use adapters for optional metadata tools.
- Keep frontend changes incremental.
- Do not introduce React, Vue, Vite, Docker-first distribution, cloud accounts, or a database until they solve a real product need.

## Completed Milestones

### v1.1.0 - Selection Workflow

Goal: make the video wall useful for reviewing and picking good clips without touching the original files.

Completed:

- Favorites.
- Selected / featured marks.
- Filter by all / favorites / selected.
- Persist review data locally.
- Bilingual UI text for review controls.

### v1.2.0 - Library Review Tools

Goal: make larger folders easier to audit and share with other tools.

Completed:

- Export current results to CSV.
- More filters, including file size and modified date.
- More useful metadata in cards and overlays.
- Improved empty states and scan summaries.

### v1.3.0 - Mixed Media And Safe File Actions

Goal: expand from video browsing to safer media management.

Completed:

- Mixed image + video browsing.
- Safe move actions to `_video_wall_review`.
- Safe trash actions, later changed to the Windows Recycle Bin.
- Local-only review data.
- Safer file handling without permanent deletion by default.

### v1.4.0 - Image Slideshow

Goal: add a visual review mode specifically for images.

Completed:

- Image-only fullscreen slideshow from the image modal.
- Play / pause.
- Previous / next.
- Interval controls.
- Fade / slide / drift / random effects.
- Contain / cover fit modes.
- Loop toggle.
- Keyboard and mouse-wheel navigation.

### v1.5.0 - Slideshow Refinement

Goal: make image viewing feel smoother and more intentional.

Completed:

- 1-15 second slideshow interval choices.
- No-effect slideshow option.
- Cleaner fade, slide, and drift transitions.
- Larger side navigation arrows.
- Hide / show controls for image preview and slideshow viewing.
- Dense grid options for fast image screening.

### v1.6.0 - Video Preview And Interface Polish

Goal: make video preview closer to the image preview experience.

Completed:

- Previous / next navigation in the video preview modal.
- Mouse-wheel volume control for video preview.
- Loop one, sequential playback, and random playback modes.
- Video fullscreen support.
- Overlay toolbar for video controls.
- Hide / show controls for cleaner viewing.
- Larger mouse-activated media navigation arrows.
- Light theme.
- Icon-first toolbar controls.
- Improved fullscreen, close, and playback-mode icons.

### v1.7.0 - Path, Performance, Batch Review, And Layout

Goal: keep routine browsing responsive while making larger folders, large videos, and repeated path switching easier to handle.

Completed:

- Individual removal for favorite paths and path history.
- Split-layout folder sidebar with drive roots, lazy-loaded folder expansion, recent paths, and favorite paths.
- One-level typed path autocomplete.
- 500 MB large-video wall placeholder with an opt-in preview setting.
- On-demand modal playback for large videos.
- Viewport-aware image loading and distant image resource release.
- Adjustable page-size input for large mixed-media folders, capped at 240 cards per page.
- Configurable filename exclusion rules with editable keywords and image/all-media scope.
- No persistent thumbnail cache by default.
- 2-20 grid columns.
- Automatic wall playback derived from column count.
- Static wall previews for 10 or more columns.
- Toolbar filters for all / videos / images / favorites.
- Reset-filters action.
- Batch mode for visible media selection, favorite / unfavorite, Recycle Bin move, and CSV export.
- More reliable Recycle Bin handling for Chinese paths and locked media files.
- Improved image and video viewer controls with cleaner fullscreen behavior.
- Left / center / right content layout for wide screens.
- Half-width left/right video preview modal.
- Half-width left/right image preview modal, with metadata hidden in side mode.
- Open media with the system default app.
- Small / standard / large interface font-size settings.
- More reliable startup installation with Task Scheduler support, fallback Startup shortcut, and service logging.

### v1.7.5 - Architecture Guardrails

Goal: add small backend boundaries before AI metadata, tags, SQLite, and search work.

Completed:

- Added `core/` package for shared low-level helpers.
- Added `core/json_store.py` with UTF-8 JSON read/write helpers and same-directory temporary-file replacement.
- Added `core/path_utils.py` and `core/file_identity.py` as future path and lightweight identity boundaries.
- Routed config and review JSON persistence through the safe JSON store while preserving existing behavior.
- Added `review/` package with schema-version direction and compatibility normalization.
- Preserved current favorite / selected UI behavior while allowing future review fields such as status, rating, tags, collections, and notes.
- Added `metadata/` package with normalized metadata schema and safe normalizer.
- Added metadata reader entry points for embedded metadata, sidecar JSON, and `ffprobe` without making external tools mandatory.
- Kept `app.py` as the entry and route layer.
- Did not split `static/app.js`, add a frontend framework, or change the script loading model.
- Verified imports, source compilation, local service startup, `/api/config`, and `/api/review`.

## Current Phase - v1.8.0 Metadata Stabilization And Recycle Workflow

Recommended version: `v1.8.0 - AI Metadata Preview / Metadata Stabilization`

Status: core image metadata preview is implemented; optional `ffprobe` video/container metadata reading is implemented when `ffprobe` is available; the recoverable recycle workflow and responsive media-wall fixes are implemented. Remaining work is metadata stabilization against more real-world samples.

Completed in the current phase:

- Recoverable `_video_wall_trash` workflow with restore and optional handoff to the Windows Recycle Bin.
- Static recycle media cards, video/image filtering, card-click multi-selection, and per-card restore or system-recycle actions.
- Stable top filter-toolbar geometry when filtering changes scrollbar visibility.
- Responsive media-card footer actions, including a narrow-card More menu.
- Local verification with a 63-file mixed-media test folder; the test folder is ignored by Git.

Goal: show AI generation information inside image and video previews without turning the grid into a crowded database UI.

### Metadata priority

1. Embedded image/video metadata.
2. Same-name sidecar JSON.
3. `ffprobe` / MediaInfo technical metadata.
4. Basic filesystem information.

Reason: ComfyUI and Stable Diffusion WebUI images often already contain prompt, workflow, or parameter metadata in the image file itself. Sidecar JSON remains important, but should not be the only first-class source.

### Implemented metadata sources

- Stable Diffusion WebUI / A1111 PNG `parameters`.
- ComfyUI `prompt` and `workflow`.
- Same-name sidecar JSON:
  - `name.json`
  - `name.ext.json`
  - `name.info.json`
  - `name.civitai.json`
- Basic filesystem information.
- Optional video container tags and technical information through `ffprobe` when available on PATH.

### Implemented ComfyUI behavior

- KSampler positive / negative conditioning chain is preferred when extracting prompts.
- Disconnected, FaceDetailer, and unused text nodes are less likely to pollute the main Prompt field.
- LoRA detection supports standard LoRA loader fields and Power Lora Loader / rgthree-style workflow values.
- LoRA strength is displayed when model / clip / strength values are available.

### Implemented preview UI

- File Info as labeled fields:
  - path
  - type
  - size
  - modified date
  - pixel dimensions
  - approximate creative aspect ratio
- Prompt.
- Negative Prompt.
- Model.
- LoRA as a scrollable list.
- Raw metadata actions:
  - Copy raw metadata.
  - Copy ComfyUI workflow JSON.
  - Open local ComfyUI page.

### Remaining stabilization work

- Test more real ComfyUI PNG samples, especially custom prompt, string, wildcard, and LoRA loader nodes.
- Keep the metadata panel readable with many LoRA entries and long prompts.
- Validate optional `ffprobe` video-container metadata with more real MP4/WebM/MOV samples.
- Keep unsupported or broken metadata non-fatal by returning normalized empty or partial metadata objects.
- Test WebP / JPEG embedded metadata where practical.
- Consider optional MediaInfo support only if `ffprobe` proves insufficient.
- Handle workflows that only store runtime-generated prompt output outside the PNG metadata.

Not planned for this phase:

- SQLite.
- Full-text search.
- AI summarization.
- Automatic tagging.
- Mandatory external tools.

## Phase 3 - Tags And Review Workflow

Recommended version: `v1.9.0 - Tags & Review Workflow`

Goal: make the app useful for organizing assets, not only previewing them.

First implementation:

- User-defined tags.
- Built-in starter tags:
  - `reference`
  - `usable`
  - `reject`
  - `published`
  - `pending-edit`
  - `character`
  - `style`
  - `project`
  - `motion`
  - `camera`
  - `pose`
  - `expression`
  - `nsfw`
  - `sfw`
- Chinese UI labels for built-in tags.
- Single-item tag add/remove.
- Batch add/remove tags.
- Tag filter.
- Tag search.
- Recently used tags.
- Tag counts.
- CSV export with `tags`, `note`, and `rating`.

Short-term storage:

- Continue using `review_data.json`.
- Keep the structure migration-friendly for SQLite later.

Reference only:

- TagSpaces local tag ideas.
- digiKam rating/tag/filter ideas.

Not planned for this phase:

- Cloud sync.
- Multi-user permissions.
- Full DAM system.

## Phase 4 - SQLite Lightweight Index

Recommended version: `v2.0.0 - Local Index`

Goal: speed up repeated scans and prepare for metadata search.

Principles:

- SQLite starts as a local cache and index.
- Do not immediately replace all JSON state.
- Keep rebuild and repair actions available.
- Mark missing files as missing instead of silently deleting records.
- Keep JSON backup/export available.

Suggested database:

```text
local_video_wall.db
```

Suggested tables:

```text
media_files
review_state
tags
media_tags
metadata
scan_roots
```

Core fields:

```text
path
path_norm
name
extension
media_type
size
mtime
ctime
width
height
duration
fps
codec
hash_quick
scan_root
last_seen_at
missing
favorite
selected
rating
note
tags
prompt
negative_prompt
model
loras_json
source_app
source_url
workflow_json
raw_json
```

Search foundation:

- SQLite FTS5 for filename, prompt, negative prompt, model, LoRA, source URL, note, and tags.

Not planned for this phase:

- Remote database.
- Multi-user service.
- Embedding semantic search.
- Complex sync.

## Phase 5 - Metadata Search And Advanced Filters

Recommended version: `v2.1.0 - Metadata Search`

Goal: find assets by AI generation context and review state.

Search:

- filename
- prompt
- negative prompt
- model
- LoRA
- source URL
- tags
- notes

Filters:

- has prompt
- has sidecar JSON
- has source URL
- has tags
- favorite
- selected / review state
- rated
- unreviewed
- missing file
- videos / images
- large files
- recent modified date

UI direction:

- Keep one simple search field for normal use.
- Put advanced filters behind a collapsible panel or settings-style drawer.

Not planned for this phase:

- Natural-language AI search.
- Automatic classification.
- Online search.

## Phase 6 - Optional Preview Cache

Recommended version: `v2.2.0 - Optional Preview Cache`

Goal: improve static high-column previews without forcing persistent cache behavior on every user.

Possible tools:

- `ffmpeg` for video first-frame or 3-second cover generation.
- Pillow for image thumbnails.

Cache layout:

```text
.cache/
  thumbnails/
  video_covers/
```

Rules:

- Cache generation is optional.
- Do not auto-generate cache for the whole disk.
- Support current-folder generation.
- Support video-only or image-only generation.
- Support cache size limits.
- Support cleanup and rebuild.
- Exclude cache files from normal media scans.
- Do not block the main UI while generating.

## Phase 7 - Packaging And Installation Experience

Recommended version: `v2.3.0 - Packaging`

Goal: make the app easier for non-technical users to download, start, and troubleshoot.

Tasks:

- GitHub Release ZIP.
- One-click start path.
- Background service menu.
- Python version check.
- Port occupation check.
- Optional `ffmpeg` / `ffprobe` / `exiftool` availability checks.
- Optional `portable_tools/` support.

Optional structure:

```text
portable_tools/
  exiftool/
  ffmpeg/
  mediainfo/
```

Not planned:

- Complex installer.
- Docker-first distribution.
- Account system.
- Cloud sync.

## Open-Source Reuse Strategy

Good candidates for direct integration through adapters:

- Pillow.
- `ffprobe`.
- ExifTool.
- MediaInfo.
- SQLite FTS5.

Projects to study, not merge wholesale:

- `infinite-image-browsing`.
- TagSpaces.
- digiKam.
- Immich.

External code can be copied or adapted only when:

- The license is compatible.
- The module is small and focused.
- It does not force a large framework change.
- It can be tested independently.
- Original copyright notices are kept.
- `THIRD_PARTY_NOTICES.md` is updated.
- A minimal demo is tested before integration.

## Recommended Next Step

The next feature step should be:

```text
v1.8.0 - Metadata Stabilization
```

Recommended stabilization batch:

1. Test more real ComfyUI PNG samples, especially custom prompt, string, wildcard, and LoRA loader nodes.
2. Keep the metadata panel readable with many LoRA entries and long prompts.
3. Validate optional `ffprobe` video-container metadata with more real MP4/WebM/MOV samples.
4. Keep unsupported or broken metadata non-fatal by returning normalized empty or partial metadata objects.
5. Keep README, Chinese README, ROADMAP, and CHANGELOG synchronized before each GitHub release.

After that, the next major feature step should be:

```text
v1.9.0 - Tags & Review Workflow
```

Still deferred:

- Tags / rating / notes UI.
- SQLite index.
- Metadata search.
- Thumbnail or video cover cache.
- Mandatory ExifTool / ffprobe dependency.
