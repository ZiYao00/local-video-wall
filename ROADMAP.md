# Roadmap

This file keeps the original planning trail for the project, plus a short list of ideas that may still be useful later.

The app should stay safe for local media folders. Features that move, rename, delete, or batch-process files should remain reversible, visible, and clearly confirmed by the user.

## Completed Milestones

### v1.1.0 - Selection Workflow

Goal: make the video wall useful for reviewing and picking good clips without touching the original files.

Completed:

- Favorites
- Selected / featured marks
- Filter by all / favorites / selected
- Persist review data locally
- Bilingual UI text for review controls

### v1.2.0 - Library Review Tools

Goal: make larger folders easier to audit and share with other tools.

Completed:

- Export current results to CSV
- More filters, including file size and modified date
- More useful metadata in cards and overlays
- Improved empty states and scan summaries

### v1.3.0 - Mixed Media And Safe File Actions

Goal: expand from video browsing to safer media management.

Completed:

- Mixed image + video browsing
- Safe move actions to `_video_wall_review`
- Safe trash actions, later changed to the Windows Recycle Bin
- Local-only review data
- Safer file handling without permanent deletion by default

### v1.4.0 - Image Slideshow

Goal: add a visual review mode specifically for images.

Completed:

- Image-only fullscreen slideshow from the image modal
- Play / pause
- Previous / next
- Interval controls
- Fade / slide / drift / random effects
- Contain / cover fit modes
- Loop toggle
- Keyboard and mouse-wheel navigation

### v1.5.0 - Slideshow Refinement

Goal: make image viewing feel smoother and more intentional.

Completed:

- 1-15 second slideshow interval choices
- No-effect slideshow option
- Cleaner fade, slide, and drift transitions
- Larger side navigation arrows
- Hide / show controls for image preview and slideshow viewing

### v1.6.0 - Video Preview And Interface Polish

Goal: make video preview closer to the image preview experience.

Completed:

- Previous / next navigation in the video preview modal
- Mouse-wheel volume control for video preview
- Loop one, sequential playback, and random playback modes
- Video fullscreen support
- Overlay toolbar for video controls
- Hide / show controls for cleaner viewing
- Larger mouse-activated media navigation arrows
- Light theme
- Text button / icon button display modes
- Improved fullscreen, close, and playback-mode icons

### v1.7.0 - Path And Large Media Safeguards

Goal: keep routine browsing responsive while making occasional large files and larger folders safer to encounter.

Completed:

- Individual removal for favorite paths and path history
- 500 MB large-video wall placeholder with an opt-in preview setting
- On-demand modal playback for large videos
- Viewport-aware image loading and distant image resource release
- Adjustable page-size input for large mixed-media folders, capped at 240 cards per page
- Configurable filename exclusion rules with editable keywords and image/all-media scope
- No persistent thumbnail cache by default
- 2-20 grid columns
- Automatic wall playback derived from column count
- Static wall previews for 10 or more columns
- Toolbar filters for all / videos / images / favorites
- Reset-filters action
- Batch mode for visible media selection, favorite / unfavorite, Recycle Bin move, and CSV export
- Improved image and video viewer controls with cleaner fullscreen behavior
- Small / standard / large interface font-size settings
- More reliable startup installation with Task Scheduler support, fallback Startup shortcut, and service logging

## Future Ideas

These are not commitments. They are possible directions if the tool keeps growing.

### Near-Term Product Direction

The project can grow from a local media wall into a local AI video asset screener and manager for Civitai / Wan / Kling / Runway / ComfyUI-style generated media.

Recommended priorities:

- Continue code cleanup and performance work before adding heavier cache systems.
- Improve repeated folder switching, path history, and folder sidebar reliability.
- Keep destructive file operations reversible and clearly confirmed.
- Keep image thumbnail cache and video first-frame cache optional future work, not a default requirement.

### Metadata And AI Generation Context

- Read sidecar metadata files, especially same-name `.json` files next to images or videos.
- Extract Prompt, negative prompt, model name, workflow/source app, seed, source URL, Civitai download information, and generation parameters when available.
- Show metadata in the media modal without making the card grid visually crowded.
- Add metadata search and filters after the basic reader is stable.

### Lightweight Index

- Add an optional SQLite index for repeated scans.
- Store file path, modified time, size, media type, hash or fingerprint, scan status, favorite state, review state, tags, and extracted metadata summary.
- Start with scan acceleration and read-only metadata lookup before moving review state fully into SQLite.
- Keep a rebuild / repair index action so users can recover from stale local state.

### Tags And Batch Review

- Add user tags for review workflows, such as reference, usable, reject, published, pending edit, character, style, or project.
- Add stronger batch selection, batch favorite updates, batch tag editing, and batch move actions.
- Keep batch operations previewable and reversible where possible.
- Consider a compact selection mode for large folders.

### Optional Cache Systems

- Optional thumbnail cache for large images.
- Optional video cover cache, such as first frame or a 3-second frame.
- Add cache size limits, cleanup controls, and invalidation rules before enabling persistent caches.
- Avoid scanning generated cache files as normal media.

### Packaging And Documentation

- Keep English and Chinese README files synchronized.
- Add clearer installation, startup, service menu, and troubleshooting sections.
- Publish GitHub Releases with a ZIP package for non-technical users.
- Consider a one-click startup package after the current Python workflow is stable.
- Use GitHub Packages only later if the project becomes a Docker image or formal package.

### Other Ideas

- Star rating
- Folder presets
- Contact sheet export
- Slideshow drift strength presets
- More keyboard shortcuts
- Optional media statistics dashboard

## Packaging Ideas

For normal users, a GitHub Release with a ZIP download is probably the best first packaging step.

GitHub Packages may be useful later only if the project grows into a Docker image or a more formal package format. For now, Releases are simpler and easier for non-technical users.
