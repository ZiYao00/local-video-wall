# Local Video Wall

[中文说明](README.zh-CN.md)

A Windows-first local AI image/video media wall for fast browsing, screening, metadata review, and safe cleanup.

![Preview](assets/preview01.gif)

Local Video Wall turns a local folder into a browser-based media wall. It is designed for people who generate, download, and review large batches of local AI images and videos.

It is not a cloud album, not a general file manager, and not a ComfyUI plugin. Its target is narrower and more practical: local AI media review, screening, marking, and retrieval.

## Why This Exists

AI media folders grow quickly. A normal file explorer is not ideal when:

- One folder contains hundreds or thousands of short videos and images.
- Videos need to be opened one by one before you know whether they are useful.
- You want to compare many clips visually while several videos play at the same time.
- Good assets, bad assets, references, and unfinished experiments are mixed together.
- Prompt, model, LoRA, and workflow information is hard to inspect after generation.
- You want to review local media without uploading it to a cloud library.
- Direct deletion is risky while you are still screening large batches.

## How It Helps

Local Video Wall turns a local folder into a waterfall-style image/video wall:

- Scan local videos and images and browse them in a responsive grid.
- Autoplay multiple visible wall videos silently at the same time.
- Pause or release off-screen media to reduce browser and disk pressure.
- Search, sort, filter, favorite, batch-select, and export review data.
- Open images in a large preview or fullscreen slideshow.
- Open videos in a larger player with navigation, volume wheel, fullscreen, and playback modes.
- Inspect common AI generation metadata, including Prompt, Negative Prompt, model, LoRA, and ComfyUI workflow data.
- Move unwanted files to the Windows Recycle Bin instead of deleting them permanently by default.

## Typical Workflow

1. Start the app with `start.bat` or `service.bat`.
2. Choose a local media folder, such as a ComfyUI output folder or a Civitai download folder.
3. Set the wall density, for example 6 columns for normal review or 8-9 columns for faster screening.
4. Browse images and videos together in the media wall.
5. Open promising items in the image or video preview.
6. Inspect Prompt, Negative Prompt, model, LoRA, workflow, and file information when metadata exists.
7. Favorite useful assets, batch-select unwanted items, export CSV, or move files to the Windows Recycle Bin.

## Core Capabilities

### Multi-video wall preview

Browse many local videos in one page. Visible videos can autoplay silently at the same time, while off-screen media pauses or releases resources.

### Mixed image/video media wall

Browse downloaded video assets, AI-generated images, ComfyUI outputs, Stable Diffusion WebUI / A1111 images, Wan / Kling / Runway clips, and similar local folders.

### Fast screening and cleanup

Use toolbar filters, search, sorting, favorites, batch selection, CSV export, filename exclusion rules, and safe moves to the Windows Recycle Bin.

### AI generation metadata review

Read common generation metadata when available:

- Stable Diffusion WebUI / A1111 PNG `parameters`
- ComfyUI PNG `prompt` and `workflow`
- Same-name sidecar JSON files
- Prompt and Negative Prompt
- Model and UNET / diffusion model loader names
- LoRA names and strength values when available
- Workflow / generation badges on media cards, with separate states for checking, generation metadata, and workflow-only files
- Optional video container tags through `ffprobe`

For ComfyUI images, prompt extraction prefers the KSampler conditioning chain where possible, reducing noise from disconnected, FaceDetailer, or unused text nodes.

### Windows-first local use

The app runs as a local Python service and stores settings and review data locally. It uses `start.bat` for manual startup and `service.bat` for background service actions.

## Good Fit / Not A Good Fit

| Good fit | Not a good fit |
| --- | --- |
| Browsing many local short videos at once | Streaming online videos |
| Reviewing AI-generated image/video batches | Professional video editing |
| Screening ComfyUI / A1111 / Wan / Kling / Runway outputs | Cloud album or remote sync service |
| Inspecting prompt, model, LoRA, and workflow metadata | Multi-user digital asset management |
| Local favorites, batch selection, CSV export, and Recycle Bin cleanup | Users with no local media folder to browse |

## Project Status

| Area | Status |
| --- | --- |
| GitHub Release | Packaged releases may be older than the `main` branch. |
| Main branch | Contains the latest development features and documentation. |
| Current metadata features | PNG metadata preview and optional `ffprobe` video/container metadata reading are available on the current main branch. |
| Current focus | Metadata stabilization and real-world sample validation. |
| Planned work | Tags, notes, ratings, SQLite indexing, metadata search, and optional preview cache. |

## Requirements

- Windows 10 / Windows 11
- Python 3.10 or later; Python 3.12 is recommended
- Chrome or Edge recommended

This project runs as a local Python service. If Python is not installed, `start.bat` and `service.bat` cannot start the app directly.

### Python checklist for new users

1. Install Python from the official Python website or Microsoft Store.
2. During installation, enable `Add python.exe to PATH` if the installer shows that option.
3. Open Command Prompt or PowerShell and run:

```bash
python --version
```

or:

```bash
py --version
```

If neither command works, Windows cannot find Python and the app will not start from the `.bat` files.

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

### 1. Download

Recommended for normal users:

1. Open the GitHub Releases page.
2. Download the latest `local-video-wall-*.zip` package.
3. Extract it to a normal local folder, for example:

```text
C:\Tools\local-video-wall
```

4. Run `start.bat`.

Developers can also clone the repository and run it from source.

### 2. Start the app

Manual mode:

```text
start.bat
```

The browser opens automatically. A command window stays visible while the app is running. Closing that command window stops the app.

Service mode:

```text
service.bat
```

This opens a menu where you can start the app in the background, stop or restart the background service, install startup, uninstall startup, open the browser, start and open the browser together, or check status.

You can also run:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:8787
```

### 3. If the app does not start

Check these items first:

- If Windows says `python` is not recognized, install Python and make sure it is available in PATH.
- If the browser does not open automatically, manually visit `http://127.0.0.1:8787`.
- If the page cannot be opened, run `service.bat` and choose the status option to check whether the background service is running.
- If port `8787` is already used by another program, close that program or edit `PORT` in `app.py` before starting.
- If Windows SmartScreen, antivirus software, or browser security prompts appear, review them and allow the local script only if you trust the extracted folder.
- If videos do not autoplay with sound, this is normal browser behavior. Wall videos are muted so autoplay is allowed.
- Optional video metadata reading requires `ffprobe` on PATH. The app still works without it; only some video metadata fields will be unavailable.

### 4. Choose a media folder

You can:

- Enter a folder path manually with one-level folder autocomplete, for example `C:\Users\YourName\Videos`.
- Click the sidebar button to open the split-layout folder tree.
- Use the star button inside the path field to favorite the current path.
- Use the history button inside the path field to reopen recent paths or clear path history.
- Click `Choose Folder`.
- Enable `Remember path`.
- Enable `Scan subfolders`.

Choosing a path from the folder panel or Windows folder picker fills the path field and starts scanning automatically. If you type a path manually, press Enter or click `Scan`.

### 5. Browse and review media

- Use the top toolbar to switch between `All`, `Videos`, `Images`, and `Favorites`.
- Use the column selector to change wall density.
- For 2-9 columns, visible videos autoplay up to the wall play limit set in Settings.
- For 10 or more columns, the wall uses static previews.
- Use the page-size input to control how many cards are rendered per page, up to 240.
- Use the top pagination arrows, optional floating pager, or bottom pager when the floating pager is disabled.
- Click an image to open the image preview.
- Use side arrows, keyboard arrows, or mouse wheel to move to the previous / next image.
- Click `Slideshow (Fullscreen)` to enter fullscreen image slideshow.
- Click a video to open the video preview.
- Use side arrows to move to the previous / next video.
- Use the mouse wheel inside the video preview to adjust volume.
- Use the video mode control to switch between loop one, sequential playback, and random playback.
- Click the batch button to select multiple visible items, then favorite / unfavorite, move to Recycle Bin, or export CSV.
- In the preview metadata panel, inspect file information, prompt, negative prompt, model, LoRA list with strength values when available, source/path, and raw metadata actions.
- For ComfyUI images, prompt extraction prefers the KSampler conditioning chain, reducing noise from FaceDetailer, disconnected, or unused text nodes.
- For ComfyUI workflows, use the metadata actions to copy workflow JSON or open your local ComfyUI page.

### 6. Interface options

The top toolbar and Settings menu contain controls for:

- Language: English / Chinese
- Theme: dark / light
- Layout position: center / left / right
- Path history and favorite paths
- Filename exclusion rules
- Large video wall preview behavior
- Wall play limit
- Floating pager
- Interface text size
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

## Local And Safety Notes

- The app runs as a local Python service on `http://127.0.0.1:8787`.
- It does not upload your media files to a cloud service.
- Settings are saved in `config.json`, which may contain local folder paths.
- Review data is saved locally in `review_data.json`.
- Move-to-trash actions use the Windows Recycle Bin, so files can usually be restored from Windows unless the Recycle Bin is disabled or emptied.
- Large videos are not previewed in the wall by default when they are over 500 MB.
- Persistent image thumbnail and video-cover caches are not generated by default.

Browsers usually require videos to be muted before autoplay is allowed, so videos in the wall are muted by default. Videos over 500 MB use a placeholder in the wall by default so large movies or concert files are not loaded accidentally. This can be changed in Settings.

Video embedded generation metadata depends on how the video was created. If `ffprobe` is available on PATH, the app can read MP4/WebM/MOV container tags such as prompt, workflow, comment, description, duration, codec, and resolution. If `ffprobe` is not installed, video metadata reading safely falls back to sidecar JSON and basic file information.

## Configuration

The app stores local settings in:

```text
config.json
```

This file can contain local folder paths, so it should not be uploaded to GitHub. Use `config.example.json` as the shareable example instead.

Settings such as language, theme, font size, columns, page size, wall play limit, floating pager, path history, favorite paths, slideshow interval, slideshow effect, fit mode, and loop mode are also saved locally in `config.json`.

## Future Direction

The app has moved beyond the baseline media wall into AI metadata preview and stabilization work.

Recommended order:

1. Finish `v1.8.x - Metadata Stabilization`: test more ComfyUI node formats, keep metadata UI readable, and validate more real-world video metadata samples.
2. Build `v1.9.0 - Tags & Review Workflow`: add local tags, ratings, notes, and batch tag editing.
3. Build `v2.0.0 - Local Index`: add a lightweight SQLite index for repeated scans and metadata lookup.
4. Build `v2.1.0 - Metadata Search`: search and filter by prompt, model, LoRA, tags, source URL, and review state.
5. Consider `v2.2.0 - Optional Preview Cache`: optional image thumbnails and video covers only after metadata and indexing are stable.
6. Improve `v2.3.0 - Packaging`: release ZIPs, startup checks, optional portable tools, and clearer troubleshooting.

See [ROADMAP.md](ROADMAP.md) for the full plan, including third-party tool reuse rules.

## Project Structure

```text
local-video-wall/
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
