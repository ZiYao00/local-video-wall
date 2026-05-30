# Roadmap

This roadmap keeps future work grouped into small, testable releases. The app should stay safe for local media folders: features that change files should arrive later and require clear confirmation.

## v1.1.0 - Selection Workflow - Done

Goal: make the video wall useful for reviewing and picking good clips without touching the original files.

- Favorites
- Selected / featured marks
- Filter by all / favorites / selected
- Persist review data locally
- Bilingual UI text for the new controls

Acceptance checks:

- A marked video stays marked after restart.
- Favorites and selected filters can be toggled without rescanning.
- Marking data does not modify or rename the original videos.

## v1.2.0 - Library Review Tools - Done

Goal: make larger folders easier to audit and share with other tools.

- Export current results to CSV
- Export favorites / selected clips to CSV
- Add more filters, such as file size and modified date
- Show more useful metadata in each card or modal
- Improve empty states and scan summaries

Acceptance checks:

- Exported CSV opens cleanly in Excel.
- Exports respect the current search/filter state.
- Large folders remain responsive while browsing.

## v1.3.0 - Mixed Media And Safe File Actions - Done

Goal: expand from video browsing to safer media management.

- Mixed image + video browsing
- Safer move action
- Safer delete action, preferably moving files to a review/trash folder first
- Batch actions only after clear confirmation
- Operation log for file actions

Acceptance checks:

- File actions never permanently delete media without confirmation.
- Move/delete actions can be audited from a local log.
- Image and video cards remain visually consistent.

## v1.4.0 - Image Slideshow - Done

Goal: add a visual review mode specifically for images.

- Image-only fullscreen slideshow from the image modal
- Play / pause
- Previous / next
- Interval controls
- Fade / slide / drift / random effects
- Contain / cover fit modes
- Loop toggle
- Keyboard controls

Acceptance checks:

- Slideshow button only appears for images.
- Slideshow starts from the current image.
- Slideshow uses the current filtered image list.
- Drift effect slowly pans and zooms the image.

## Later Ideas

- Tag system
- Star rating
- Folder presets
- Contact sheet export
- Slideshow drift strength presets
- Slideshow thumbnail strip
- Release ZIP packaging
- Optional thumbnail cache
