# Local Civitai Video Wall

[中文说明](README.zh-CN.md)

A local media wall for browsing, screening, and organizing AI-generated videos and images on your own Windows machine.

![Preview](assets/preview01.gif)

It is designed for local AI media folders from Civitai, ComfyUI, Stable Diffusion WebUI / A1111, Wan, Kling, Runway, and similar tools. The app helps you scan large folders, preview visible videos without loading everything at once, review images in a fullscreen slideshow, inspect generation metadata, and keep common review actions local and reversible.

The current development direction is AI asset management: embedded generation metadata preview is now available for common PNG workflows, and the next stages focus on tags, notes, ratings, local indexing, and metadata search.

## Features

- Scan a local media folder
- Browse videos and images in one wall
- Start a fullscreen image-only slideshow from an image modal
- Enter a folder path manually with one-level folder autocomplete
- Use a modern Windows folder picker
- Remember the last folder path
- Browse drive roots, recent paths, and favorite paths from a cached split-layout left sidebar
- Scan subfolders up to 2 levels below the selected folder
- Configure filename exclusion keywords, enable or disable them, and apply them to images only or to all media
- Switch between 2-20 grid columns
- Automatically play up to `columns x 2` visible videos for 2-9 columns; 10 columns or more use static wall previews
- Autoplay visible videos silently in a loop
- Pause off-screen videos and release distant resources, including old page resources during pagination, rescans, and modal close
- Load wall images only near the viewport and release distant image resources without creating a disk thumbnail cache
- Show a lightweight placeholder for videos over 500 MB unless large-file wall preview is enabled in Settings
- Render large scan results with an adjustable page-size input, capped at 240 cards per page
- Show lightweight performance stats for scan time, render time, page items, and loaded media
- Show scan counts and review status above the media grid on the right
- Search by filename
- Filter by file size and recent modified date
- Reset search and filters without changing the current folder or review marks
- Sort by modified time, filename, or file size
- Shuffle browsing
- Export the current review list to CSV
- Immersive mode
- Switch between dark and light themes
- Choose small, standard, or large interface text
- Align the main grid and preview layout to the center, left, or right on wide screens
- Keep the folder sidebar and media grid separated when the browser window is resized
- Open a clicked image in a larger preview with previous / next, mouse-wheel navigation, fullscreen slideshow, default-app opening, and auto-hidden viewer controls
- Open a clicked video in a larger overlay player with previous / next, playback mode, volume wheel, fullscreen, default-app opening, and auto-hidden viewer controls
- Use half-width left/right preview modals when the wide-screen layout is aligned left or right
- Show a video file in its folder
- Move files safely to `_video_wall_review` or the Windows Recycle Bin, with optional confirmation
- Video preview playback modes: loop one, sequential playback, and random playback
- Slideshow controls: play / pause, previous / next, 1-15s interval, effect, fit, loop, fullscreen, and auto-hidden controls
- Slideshow effects: none, fade, slide, drift, and random
- English interface by default, with a Chinese toggle in the top toolbar
- Filter directly from the toolbar: all, videos, images, or favorites
- Batch-select visible media for favorite / unfavorite, Recycle Bin move, and CSV export
- Preview AI generation metadata in the image/video viewer
- Read Stable Diffusion WebUI / A1111 PNG `parameters`
- Read ComfyUI PNG `prompt` and `workflow` metadata
- Prefer the ComfyUI KSampler positive / negative conditioning chain when extracting prompts
- Detect LoRA models, including Power Lora Loader / rgthree-style nodes, and show strength values when available
- Read same-name sidecar JSON files such as `name.json`, `name.ext.json`, `name.info.json`, and `name.civitai.json`
- Copy raw metadata or ComfyUI workflow JSON from the metadata panel
- Open the local ComfyUI page from the metadata panel
- Show file information as fields, including path, size, modified date, pixel dimensions, and approximate creative aspect ratio

## Use Cases

- Browse videos and images downloaded from Civitai
- Review AI-generated videos and image batches
- Browse outputs from ComfyUI / Stable Diffusion / Wan / Kling / Runway and similar tools
- Quickly screen large local media folders without importing them into a cloud service
- Use a local folder as a dynamic visual reference wall
- Inspect prompts, models, LoRA usage, and workflow metadata from generated images
- Prepare local assets for future tagging, metadata search, and prompt/model review

## Requirements

- Windows 10 / Windows 11
- Python 3.10 or later. Python 3.12 is recommended.
- Chrome or Edge recommended

This project runs as a local Python service. If Python is not installed, `start.bat` and `service.bat` cannot start the app directly.

## Supported Formats

```text
.mp4
.webm
.mov
.m4v
.jpg
.jpeg
.png
.gif
.webp
.bmp
```

## Usage

### 1. Download or clone

Recommended for normal users:

1. Open the GitHub Releases page.
2. Download the latest `local-civitai-video-wall-*.zip` package.
3. Extract it to a local folder.
4. Run `start.bat`.

Developers can also clone the repository and run it from source.

### 2. Start the app

Manual mode:

Double-click:

```text
start.bat
```

The browser will open automatically. A command window stays visible while the app is running. Closing that command window stops the app.

Service mode:

```text
service.bat
```

This opens an English menu where you can start the app in the background, stop or restart the background service, install startup, uninstall startup, open the browser, start and open the browser together, or check status. Startup uses a stable helper script under your Windows APPDATA folder instead of a temporary file.

You can also run:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:8787
```

### 3. Choose a media folder

You can:

- Enter a folder path manually with one-level folder autocomplete, for example `C:\Users\YourName\Videos`
- Click the sidebar button to open the split-layout folder tree
- Use the star button inside the path field to favorite the current path
- Use the history button inside the path field to reopen recent paths or clear path history
- Click `Choose Folder`
- Enable `Remember path`
- Enable `Scan subfolders`

Choosing a path from the folder panel or Windows folder picker fills the path field and starts scanning automatically. If you type a path manually, press Enter or click `Scan`.

### 4. Browse and review media

- Use the top toolbar to switch between `All`, `Videos`, `Images`, and `Favorites`.
- Use the column selector to change wall density. For 2-9 columns, visible videos autoplay up to `columns x 2`; 10 or more columns use static wall previews.
- Use the page-size input to control how many cards are rendered per page, up to 240.
- Click an image to open the image preview.
- Use the side arrows, keyboard arrows, or mouse wheel to move to the previous / next image.
- Click `Slideshow (Fullscreen)` to enter the fullscreen image slideshow.
- In slideshow mode, use play / pause, interval, effect, fit, loop, and fullscreen controls from the top toolbar.
- Click a video to open the video preview.
- Use the side arrows to move to the previous / next video.
- Use the mouse wheel inside the video preview to adjust volume.
- Use the video mode control to switch between loop one, sequential playback, and random playback.
- Viewer controls auto-hide for cleaner image, slideshow, and video viewing. Move the mouse near the top-right control area to show them again.
- Click the batch button to select multiple visible items, then favorite / unfavorite, move to Recycle Bin, or export CSV.
- In the preview metadata panel, inspect file information, prompt, negative prompt, model, LoRA list with strength values when available, source/path, and raw metadata actions.
- For ComfyUI images, prompt extraction prefers the KSampler conditioning chain, reducing noise from FaceDetailer, disconnected, or unused text nodes.
- For ComfyUI workflows, use the metadata actions to copy workflow JSON or open your local ComfyUI page.

### 5. Interface options

The top toolbar and Settings menu contain quick controls for:

- Language: English / Chinese
- Theme: dark / light
- Layout position: center / left / right
- Path history: clear recent paths while keeping favorites
- Remove individual history entries or favorite paths directly from their lists
- Filename exclusion rules: add or remove up to 30 case-insensitive filename keywords; defaults to `fanart` and `thumb` for images
- Large video wall preview: disabled by default for files over 500 MB; clicking a placeholder still opens the video on demand
- Interface text size: small / standard / large
- Grid columns: 2-20
- Page size: 1-240 cards
- Toolbar filters: all / videos / images / favorites

## Recommended Settings

General browsing and preview:

```text
6 columns
Page size 120
```

Detail review:

```text
4 or 5 columns
Page size 80-120
```

Fast screening:

```text
8 or 9 columns for autoplay preview
10-20 columns for static overview
```

## Notes

Browsers usually require videos to be muted before autoplay is allowed, so videos in the wall are muted by default. Videos over 500 MB use a placeholder in the wall by default so large movies or concert files are not loaded accidentally. This can be changed in Settings.

Click a video to open it in a larger player. You can enable audio manually in that player.

Video embedded generation metadata is not fully implemented yet. The app can show sidecar JSON metadata for videos when present, but reading metadata directly from MP4/WebM containers is planned for a later optional `ffprobe` integration.

## Configuration

The app stores local settings in:

```text
config.json
```

This file can contain local folder paths, so it should not be uploaded to GitHub. Use `config.example.json` as the shareable example instead.

Settings such as language, theme, font size, columns, page size, path history, favorite paths, slideshow interval, slideshow effect, fit mode, and loop mode are also saved locally in `config.json`.

## Future Direction

The app has moved beyond the baseline media wall into `v1.8.x` AI metadata preview work. Core embedded PNG metadata preview is implemented; the remaining `v1.8.x` work is stabilization and optional video/container metadata support.

Recommended order:

1. Finish `v1.8.x - Metadata Stabilization`: test more ComfyUI node formats, keep metadata UI readable, and add optional video metadata support later.
2. Build `v1.9.0 - Tags & Review Workflow`: add local tags, ratings, notes, and batch tag editing.
3. Build `v2.0.0 - Local Index`: add a lightweight SQLite index for repeated scans and metadata lookup.
4. Build `v2.1.0 - Metadata Search`: search and filter by prompt, model, LoRA, tags, source URL, and review state.
5. Consider `v2.2.0 - Optional Preview Cache`: optional image thumbnails and video covers only after metadata and indexing are stable.
6. Improve `v2.3.0 - Packaging`: release ZIPs, startup checks, optional portable tools, and clearer troubleshooting.

See [ROADMAP.md](ROADMAP.md) for the full plan, including third-party tool reuse rules.

## Project Structure

```text
local-civitai-video-wall/
├─ app.py
├─ start.bat
├─ service.bat
├─ README.md
├─ README.zh-CN.md
├─ CHANGELOG.md
├─ ROADMAP.md
├─ LICENSE
├─ config.example.json
├─ review_data.json      (local only, ignored by Git)
├─ assets/
│  └─ preview01.gif
└─ static/
   ├─ index.html
   ├─ style.css
   └─ app.js
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for completed milestones and future ideas.

## License

MIT License
