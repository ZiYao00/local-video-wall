# Changelog

## 1.7.1 - Unreleased

- Updated the roadmap into a staged AI media asset management plan covering metadata preview, tags, SQLite indexing, metadata search, optional preview cache, and packaging.
- Inserted `v1.7.5 - Architecture Guardrails` before AI metadata work, documenting the small backend module boundaries needed before deeper feature development.
- Clarified the project direction as a local AI image/video asset browser for fast review, screening, marking, and retrieval, rather than a general album or cloud media system.
- Updated English and Chinese README future-direction sections to match the staged roadmap.
- Documented the wide-screen center / left / right layout option and default-app opening behavior in both README files.
- Added half-width left/right image preview behavior to match the existing wide-screen video preview layout, while keeping slideshow behavior unchanged.
- Split the image preview actions into an in-modal Slideshow toggle and a separate Fullscreen slideshow button, so left/right image preview size stays unchanged during quick slideshow playback.
- Added a lightweight Drift animation to the in-modal image slideshow, using the saved slideshow interval while keeping the existing fullscreen slideshow effects separate.
- Added a safe UTF-8 JSON store helper and routed config/review JSON persistence through it using same-directory temporary files before replacing the target file.
- Added a review-data compatibility layer with schema-version normalization while preserving the current favorite/selected UI behavior.
- Added metadata schema and normalizer boundaries for future AI metadata preview work, plus safe embedded, sidecar, and ffprobe reader entry points without making external tools mandatory.
- Started `v1.8.0 - AI Metadata Preview` with dependency-free PNG embedded metadata parsing, sidecar JSON metadata reading, metadata merging, and a scan-root-validated `/api/metadata` endpoint.
- Connected the image/video preview metadata panel to `/api/metadata`, including loading/error states, Prompt, Negative Prompt, Model, LoRA, Source, file info, Raw metadata, and copy actions.
- Improved the metadata panel UX with collapsible Negative Prompt, Source, File Info, and Raw metadata sections; isolated metadata-panel wheel scrolling from image navigation; expanded modal control hover zones; and removed the hidden-toolbar dark gradient residue.
- Improved AI metadata status text and LoRA detection for ComfyUI/custom-node workflows and sidecar JSON variants, while keeping dynamic wildcard prompt reconstruction as a later parser task.
- Expanded ComfyUI prompt extraction to read common custom prompt, wildcard, text, and workflow widget fields, with a conservative CLIPTextEncode fallback for positive/negative prompt pairs.
- Replaced the always-visible Raw metadata text block with compact metadata action buttons for copying Raw metadata, copying ComfyUI workflow JSON, and opening the local ComfyUI page.
- Added preview-window layout controls for Left / Center / Right, aligned the Settings order to Left / Center / Right, hid video metadata in side-preview layouts, and kept navigation arrows visible briefly after Prev / Next clicks.
- Changed ComfyUI prompt extraction to prefer the KSampler positive / negative conditioning chain, so FaceDetailer, disconnected, and fallback text nodes are less likely to pollute the main Prompt field.
- Expanded ComfyUI LoRA extraction for Power Lora Loader / rgthree-style nodes by reading LoRA inputs and workflow widget values while avoiding node-title false positives.
- Added LoRA strength display when model / clip / strength values are available, and changed the metadata panel LoRA section from a comma-separated line into a scrollable per-LoRA list.
- Reworked the metadata panel header so File Info appears first with pixel dimensions and aspect ratio, and made the LoRA and Prompt sections collapsible.
- Changed metadata File Info to a labeled field list, merged Source / Path into it, suppressed successful metadata-source status text, and switched aspect-ratio display to common creative-ratio approximations such as 3:4.

## 1.6.12 - 2026-06-12

- Changed Move to Trash to use the Windows Recycle Bin instead of creating `_video_wall_trash` folders in each scanned directory.
- Added a saved confirmation setting for Recycle Bin moves, including a "Don't ask again" option in the confirmation dialog.
- Added Delete-key support for moving the current modal or slideshow item to the Windows Recycle Bin.
- Added address-bar folder autocomplete for typed paths such as `D:\3`, limited to one parent directory level and 20 folder suggestions.
- Added lightweight performance stats for scan time, render time, current page items, and loaded media.
- Improved media resource cleanup during pagination, rescans, modal close, and slideshow close.
- Added in-memory caching and a refresh action for the folder sidebar tree.
- Updated the roadmap with future AI media management plans, including sidecar metadata, SQLite indexing, tags, batch operations, optional cache systems, and release packaging.
- Improved Recycle Bin action feedback by releasing the current preview media after success and showing the actual backend error message when a file action fails.
- Improved `service.bat` startup installation by replacing the fragile direct Startup `.vbs` entry with a Startup shortcut fallback that launches the hidden helper script, plus service log output for startup diagnostics.
- Changed grid columns to support 2-20 columns and derive wall playback automatically from the selected column count.
- Changed 10 or more columns to static wall previews instead of simultaneous inline video playback.
- Changed page size from a dropdown to a numeric input capped at 240 grid items per page.
- Added a reset-filters toolbar action that clears search and filters without changing the current folder or review marks.
- Improved empty states so scanned folders with no media and filtered views with no matches show different messages.

- Added per-item removal controls for favorite paths and path history while retaining the clear-all history action.
- Added a saved setting for allowing wall previews of videos over 500 MB.
- Changed videos over 500 MB to lightweight wall placeholders by default while preserving on-demand modal playback.
- Changed image cards to load only near the viewport and release distant image resources without creating a disk thumbnail cache.
- Added 120-item grid pagination to keep folders with 1,000 or more media files from overwhelming the browser.
- Replaced the fixed cover-image exclusion option with configurable filename keywords, an enable switch, removable keyword chips, and image-only or all-media scope.
- Added excluded-item counts to scan completion feedback.
- Limited recursive scans to 2 subfolder levels to prevent unexpectedly deep directory traversal.
- Moved scan counts and review status from the bottom-left floating bar to the right side above the media grid, hidden until a scan is available.
- Fixed the folder sidebar being covered by the media grid around the 1280 CSS-pixel responsive breakpoint.
- Added saved small, standard, and large interface text-size options under Settings > Interface.
- Updated English and Chinese documentation for the new path and media-loading behavior.

## 1.6.11 - 2026-06-01

- Removed the top logo text to give the main toolbar more horizontal room.
- Moved the media count / favorite / selected status into a fixed bottom-left status bar. This was later replaced in 1.6.12 by an inline status above the media grid.
- Merged the second toolbar into the main toolbar and changed grid columns from segmented buttons to a dropdown.
- Highlighted the Choose Folder button so the main folder entry action is easier to find.
- Reordered hidden slideshow fullscreen actions to Exit Fullscreen, Show UI, and Back.
- Removed the obsolete button-style switch from Settings, moved Immersive to the main toolbar, and reordered hidden video fullscreen actions to Exit Fullscreen, Show UI, and Close.
- Aligned video Hide UI / Show UI fullscreen controls to the same top-right control tray with a subtle slide-in transition.
- Added a left-side folder browser with drive roots, lazy-loaded folder expansion, recent paths, and favorite paths.
- Added click-to-scan behavior for folder browser selections and automatic recent-path saving after successful scans.
- Added a Settings action to clear path history while keeping favorite paths.
- Changed the folder browser from a floating panel to a split-layout sidebar and added in-path favorite/history controls.
- Fixed sidebar layout bugs by removing the empty startup prompt, making the default shell single-column, removing per-folder favorite buttons, and keeping the sidebar open after selecting a folder.
- Reworked `service.bat` for reliable start / stop / restart testing, no-admin Startup-folder autostart, stable CRLF batch labels, and cleaner hidden Python launch commands.
- Updated `start.bat` to use an absolute app path and input-safe browser launch delay.
- Fixed saved grid column persistence so 12-column and 16-column layouts can be retained.
- Made clear modal, slideshow, card, and playback actions icon-first with tooltip labels while keeping text for menu settings and select controls.
- Reorganized the top toolbar with an icon Settings menu for lower-frequency interface, scan, playback, filter, and export controls.
- Improved `service.bat` with a stable APPDATA helper script, clearer service/startup status, Python checks, and a start-and-open option.
- Improved responsive layout for non-maximized browser windows, including the top toolbar, control panel, modal toolbar, and slideshow toolbar.
- Added 6 and 8 to the simultaneous wall playback limit options.
- Added a saved Auto play wall setting for disabling inline wall playback while keeping modal playback available.
- Added a saved Pause inactive setting for optionally pausing wall videos, modal video, and slideshow playback when the page is inactive.
- Added scan-session media URLs so multiple browser windows can scan different folders without breaking each other's video or image playback.
- Changed CSV export so `relative_path` contains the full local file path.
- Removed the `modified_time` column from CSV export.
- Fixed hidden video overlay controls so Show UI, Exit Fullscreen, and Close stay aligned in the top-right action group.
- Fixed video loop / sequence / random icons in icon-button mode for both dark and light themes.
- Updated English and Chinese README usage notes for image previews, slideshow controls, video preview controls, themes, and icon buttons.
- Updated the example config with theme and button-style defaults.

## 1.6.10 - 2026-06-01

- Fixed media overlay toolbar click areas so the full button surface is clickable.
- Added icon-mode support for video loop / sequence / random controls.
- Replaced duplicate fullscreen-exit and close icons with distinct SVG icons.
- Improved slideshow, icon-mode toggle, and fullscreen icon choices.
- Fixed dark-theme slideshow dropdown colors.

## 1.6.9 - 2026-06-01

- Added three direct top-right SVG controls for language, light / dark theme, and text / icon button style.
- Added a light theme while keeping the dark theme as the default.
- Added an icon button mode for common actions with tooltips and accessible labels.
- Persisted theme and button style preferences locally and in app settings.
- Aligned saved slideshow interval and effect settings with the existing UI options.

## 1.6.8 - 2026-06-01

- Restored the highlighted primary background for the slideshow play / pause button.
- Improved Drift slideshow transitions so the outgoing image fades away cleanly.
- Moved the image preview Hide UI button next to Close.

## 1.6.7 - 2026-06-01

- Restored the slideshow toolbar to a horizontal layout.
- Smoothed slideshow slide transitions with a longer animation and outgoing image fade.
- Added visible hidden-control actions for returning from slideshow and closing video previews.
- Renamed image and slideshow fullscreen controls for clearer behavior.
- Moved random ordering into the sort dropdown and clarified the simultaneous playback label.

## 1.6.6 - 2026-06-01

- Changed the image modal entry from Slideshow to Fullscreen while reusing the slideshow viewer.
- Merged slideshow playback controls into the top toolbar.
- Added mouse-wheel previous / next navigation in slideshow mode.
- Kept an Exit Fullscreen button available when slideshow controls are hidden in native fullscreen.

## 1.6.5 - 2026-06-01

- Increased media previous / next arrow size for image, slideshow, and video viewers.
- Kept media arrows hidden by default until mouse movement.
- Reduced media arrow idle time so arrows begin fading out after about one second.

## 1.6.4 - 2026-06-01

- Added hide / show controls to the image preview modal.
- Moved slideshow hide UI control into the top-right slideshow toolbar.
- Aligned image modal, slideshow, and video modal UI hiding behavior.

## 1.6.3 - 2026-06-01

- Merged video playback mode, fullscreen, and hide UI controls into the top video overlay toolbar.
- Removed the separate bottom custom video control bar so the native video controls remain visually separate.
- Shortened video mode labels for a more compact toolbar.

## 1.6.2 - 2026-06-01

- Updated media navigation arrows to fade in only during mouse activity.
- Restyled previous / next arrows with a larger borderless shadowed design.
- Moved video overlay controls higher so they do not overlap the browser's native video controls.

## 1.6.1 - 2026-06-01

- Changed the video preview modal header and video controls to overlay the video instead of reducing the viewing area.
- Added hide / show controls to the video preview modal.
- Added an exit-fullscreen state to the video fullscreen button.
- Added native fullscreen support to the image slideshow.

## 1.6.0 - 2026-06-01

- Added previous / next navigation to the video preview modal.
- Added mouse-wheel volume control while previewing a video.
- Added video playback modes for loop one, sequential playback, and random playback.
- Added a fullscreen button to the video preview modal.

## 1.5.1 - 2026-06-01

- Fixed slideshow fade transitions so the outgoing image fades out while the incoming image fades in.
- Expanded slideshow interval choices from 1 second to 15 seconds.
- Added a no-effect slideshow option.
- Made slide transitions faster and less fade-heavy.

## 1.5.0 - 2026-06-01

- Moved remember path and scan subfolders controls next to the folder path row.
- Added 12-column and 16-column dense grid options for faster visual browsing.
- Added a compact dense-grid card layout for high-column browsing.

## 1.4.3 - 2026-06-01

- Added a restart option to `service.bat` for stopping and starting the background service from the menu.

## 1.4.2 - 2026-05-31

- Added previous / next navigation to the image preview modal.
- Added arrow-key and mouse-wheel image browsing in the image preview modal.
- Added side navigation buttons to fullscreen slideshow.
- Removed the slideshow filename overlay and added a show / hide control button for the bottom controls.

## 1.4.1 - 2026-05-31

- Replaced the Windows folder picker button with the modern folder selection dialog, with the old dialog kept as a fallback.

## 1.4.0 - 2026-05-30

- Added image-only fullscreen slideshow from the image modal.
- Added slideshow controls for play / pause, previous / next, interval, effect, fit, and loop.
- Added keyboard controls: Esc, Space, Left, and Right.
- Added fade, slide, drift, and random slideshow effects.
- Added persistent slideshow settings in `config.json`.

## 1.3.0 - 2026-05-30

- Added `service.bat` for background start, stop, startup install, startup uninstall, browser open, and status checks.
- Added mixed video and image browsing.
- Added media type filters for all / videos / images.
- Added safe file actions from the modal.
- Move to review now sends files to `_video_wall_review`.
- Move to trash now sends files to the Windows Recycle Bin instead of permanent deletion or per-folder `_video_wall_trash` folders.
- Added local file action logging.

## 1.2.0 - 2026-05-30

- Added CSV export for the current visible list.
- Added file size filters.
- Added recent modified date filters.
- Improved review summary counts.
- Updated bilingual UI labels for export and filters.

## 1.1.0 - 2026-05-30

- Added favorite marks.
- Added selected / featured marks.
- Added review filters for all / favorites / selected.
- Added local `review_data.json` persistence for review marks.
- Added bilingual labels for the new review controls.
- Ignored `review_data.json` from Git.

## 0.1.0 - 2026-05-13

- Initial local release.
- Added local video folder scanning.
- Added Windows folder picker.
- Added remembered path settings.
- Added recursive scan option.
- Added adjustable grid columns.
- Added playback limit controls.
- Added filename search and sorting.
- Added shuffle browsing.
- Added immersive mode.
- Added modal video playback.
- Added open-in-folder action.
