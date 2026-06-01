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
- Safe trash actions to `_video_wall_trash`
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

## Future Ideas

These are not commitments. They are possible directions if the tool keeps growing.

- Tag system
- Star rating
- Folder presets
- Contact sheet export
- Release ZIP packaging
- Optional thumbnail cache
- Slideshow drift strength presets
- More keyboard shortcuts
- Better batch review workflow
- Optional media statistics dashboard

## Packaging Ideas

For normal users, a GitHub Release with a ZIP download is probably the best first packaging step.

GitHub Packages may be useful later only if the project grows into a Docker image or a more formal package format. For now, Releases are simpler and easier for non-technical users.
