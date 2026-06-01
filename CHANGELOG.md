# Changelog

## 1.6.11 - 2026-06-01

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
- Move to trash now sends files to `_video_wall_trash` instead of permanent deletion.
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
