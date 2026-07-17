# Local Video Wall

[中文说明](README.zh-CN.md)

[![Latest Release](https://img.shields.io/github/v/release/ZiYao00/local-video-wall?display_name=tag&sort=semver)](https://github.com/ZiYao00/local-video-wall/releases/latest)
[![License](https://img.shields.io/github/license/ZiYao00/local-video-wall)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D4)](#requirements)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB)](#requirements)

**A Windows-first, local-first AI image and video media wall for fast browsing, screening, metadata review, and safe cleanup.**

![Local Video Wall preview](assets/preview01.gif)

Local Video Wall turns a local folder into a browser-based media wall. It is designed for people who generate, download, compare, and organize large batches of local AI images and videos.

It is **not** a cloud album, a professional video editor, a general-purpose file manager, or a ComfyUI plugin. Its focus is narrower: helping you review local AI media quickly without uploading it anywhere.

## Why Use It?

Normal file explorers are inconvenient when a folder contains hundreds or thousands of generated images and short videos:

- Videos must usually be opened one at a time before you know what they contain.
- Images, videos, references, failed generations, and unfinished experiments become mixed together.
- Prompt, model, LoRA, and workflow information can be difficult to retrieve later.
- Directly deleting files during a large review session is risky.

Local Video Wall provides one place to browse, compare, inspect, mark, export, and safely clean up those files.

## Highlights

### Multi-video media wall

- Browse local videos and images together in a responsive media grid.
- Autoplay multiple visible videos silently at the same time.
- Pause or release off-screen media to reduce browser and disk pressure.
- Switch between 2-20 columns depending on whether you are reviewing details or scanning quickly.
- Use static previews automatically from 10 columns onward.

<!-- Optional future GIF: assets/demo-overview.gif -->

### Fast review workflow

- Filter by **All**, **Videos**, **Images**, or **Favorites**.
- Search, sort, favorite, and batch-select media.
- Export selected review data to CSV.
- Use filename exclusion rules to hide unwanted categories during scanning.
- Save recent paths and favorite folders for quicker access.

### Image and video preview

- Open images in a large preview or fullscreen slideshow.
- Open videos in a larger player with previous/next navigation, fullscreen, playback modes, and mouse-wheel volume control.
- Adjust fit mode, slideshow interval, loop behavior, and other viewing options.

### AI generation metadata

When metadata is available, Local Video Wall can display:

- Prompt and Negative Prompt
- Model, UNET, or diffusion model loader names
- LoRA names and strength values
- ComfyUI workflow data
- Basic file information and source path
- Same-name sidecar JSON metadata
- Optional video/container metadata through `ffprobe`

Supported common sources include:

| Source | Metadata |
| --- | --- |
| Stable Diffusion WebUI / A1111 PNG | `parameters` |
| ComfyUI PNG | `prompt` and `workflow` |
| Sidecar files | Same-name JSON files |
| MP4 / WebM / MOV | Optional container tags through `ffprobe` |

For ComfyUI images, prompt extraction prefers the KSampler conditioning chain when possible, reducing noise from disconnected, unused, or FaceDetailer-related text nodes.

<!-- Optional future GIF: assets/demo-metadata.gif -->

### Recoverable cleanup

Files are not immediately sent to permanent deletion during the first cleanup step.

1. Selected files are moved into `_video_wall_trash` inside the scanned folder.
2. The recycle view lets you filter, multi-select, restore, or continue processing those files.
3. Files can then be moved to the Windows Recycle Bin when you are sure they are no longer needed.

Recycled videos remain paused on a static frame, and the app does not generate a persistent preview cache by default.

<!-- Optional future GIF: assets/demo-review.gif -->

## Quick Start

### Requirements

- Windows 10 or Windows 11
- Python 3.10 or later; Python 3.12 is recommended
- Chrome or Edge recommended
- Optional: `ffprobe` on `PATH` for additional video metadata

Check that Python is available:

```powershell
python --version
```

or:

```powershell
py --version
```

### Download and run

1. Open the [latest release](https://github.com/ZiYao00/local-video-wall/releases/latest).
2. In the release assets, download **Source code (zip)**. A dedicated `local-video-wall-*.zip` package will be listed here when one is published.
3. Extract it to a normal local folder, for example:

   ```text
   C:\Tools\local-video-wall
   ```

4. Double-click `start.bat`.
5. Choose a local image/video folder and start scanning.

`start.bat` runs the app in a visible command window. Closing that window stops the app.

For background service controls, run:

```text
service.bat
```

Developers can also run:

```powershell
python app.py
```

Then open:

```text
http://127.0.0.1:8787
```

## Typical Workflow

1. Select a ComfyUI output folder, download folder, or another local media directory.
2. Enable subfolder scanning when needed.
3. Choose a comfortable wall density:
   - 4-5 columns for closer review
   - 6 columns for general browsing
   - 8-9 columns for fast autoplay screening
   - 10-20 columns for a static overview
4. Browse images and videos together.
5. Open promising items and inspect generation metadata.
6. Favorite useful assets or batch-select unwanted items.
7. Export CSV data, move files to the recoverable recycle folder, or restore them later.

## Supported Formats

**Video**

```text
.mp4  .webm  .mov  .m4v
```

**Image**

```text
.jpg  .jpeg  .png  .gif  .webp  .bmp
```

## Local-first and Safety Notes

- The app runs locally at `http://127.0.0.1:8787`.
- Media files are not uploaded to a cloud service.
- Settings are stored locally in `config.json`.
- Favorite and selection marks are stored locally in `review_data.json`.
- `config.json` may contain local folder paths and should not be committed to GitHub.
- Files first move to `_video_wall_trash`; they can be restored before being sent to the Windows Recycle Bin.
- Persistent image-thumbnail and video-cover caches are not generated by default.
- Videos larger than 500 MB use a placeholder in the wall by default to avoid accidental heavy loading. This behavior can be changed in Settings.
- Wall videos are muted by default because browsers commonly require muted playback for autoplay.

## Important Limitations

- This project is optimized for local Windows use rather than cloud deployment or multi-user asset management.
- It is a review and screening tool, not a professional editing application.
- Video generation metadata depends on how the source video was created and may not exist.
- Without `ffprobe`, the app falls back to sidecar JSON and basic file information for video metadata.
- The latest `main` branch may contain changes newer than the release. Normal users should prefer the [Releases](https://github.com/ZiYao00/local-video-wall/releases) page.

## Good Fit / Not a Good Fit

| Good fit | Not a good fit |
| --- | --- |
| Browsing many local short videos at once | Streaming online videos |
| Reviewing AI-generated image/video batches | Professional video editing |
| Screening ComfyUI, A1111, Wan, Kling, or Runway outputs | Cloud album or remote sync |
| Inspecting prompt, model, LoRA, and workflow metadata | Multi-user digital asset management |
| Local favorites, batch review, CSV export, and recoverable cleanup | Users without a local media folder |

## Troubleshooting

- **`python` is not recognized:** install Python and enable **Add Python to PATH** during installation.
- **The browser did not open:** visit `http://127.0.0.1:8787` manually.
- **The page cannot be reached:** run `service.bat` and check the service status.
- **Port 8787 is already in use:** close the conflicting program or change `PORT` in `app.py`.
- **Videos do not autoplay with sound:** this is expected browser behavior; wall videos are muted for autoplay.
- **Some video metadata is missing:** install `ffprobe` and make sure it is available on `PATH`.

## Project Documents

- [Changelog](CHANGELOG.md)
- [Roadmap](ROADMAP.md)
- [Chinese README](README.zh-CN.md)

## License

[MIT License](LICENSE)
