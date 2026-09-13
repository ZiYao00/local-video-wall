import { createApiClient } from "./js/api-client.js";
import { createDragOutController } from "./js/drag-out-controller.js";
import { createGridController } from "./js/grid-controller.js";
import { escapeCssIdent, escapeHtml, fmtBytes } from "./js/media-utils.js";
import { createMetadataPanel } from "./js/metadata-panel.js";
import { createModalViewer } from "./js/modal-viewer.js";
import { createPlaybackController } from "./js/playback-controller.js";
import { createSlideshowController } from "./js/slideshow-controller.js";
import { createWorkflowStatusController } from "./js/workflow-status.js";

const apiClient = createApiClient();

const state = {
  all: [],
  view: [],
  playingEnabled: true,
  wallAutoplay: true,
  previewLargeVideos: false,
  pauseWhenInactive: false,
  floatingPagerEnabled: false,
  confirmTrash: true,
  currentModalItem: null,
  columns: 6,
  pageSize: 120,
  playLimit: 8,
  recursive: false,
  filenameExcludeEnabled: true,
  filenameExcludeKeywords: ["fanart", "thumb"],
  filenameExcludeScope: "image",
  blockedScanPaths: [],
  minScanVolumeGb: 1,
  lastExcludedCount: 0,
  rememberPath: false,
  sortMode: "mtime_desc",
  reviewFilter: "all",
  batchMode: false,
  batchSelected: new Set(),
  batchBusy: false,
  showTrash: false,
  trashItems: [],
  trashSelected: new Set(),
  trashBusy: false,
  mediaNeedsRender: false,
  backendCompatible: false,
  backendVersion: 0,
  backendCapabilities: new Set(),
  sizeFilter: "all",
  dateFilter: "all",
  mediaType: "all",
  immersive: false,
  language: "en",
  theme: "dark",
  fontSize: "standard",
  contentAlign: "center",
  buttonStyle: "text",
  modalSlideshowPlaying: false,
  modalSlideshowTimer: null,
  slideshowItems: [],
  slideshowIndex: 0,
  slideshowPlaying: true,
  slideshowTimer: null,
  slideshowCleanupTimer: null,
  slideshowActiveLayer: 0,
  slideshowInterval: 5,
  slideshowEffect: "drift",
  slideshowFit: "contain",
  slideshowLoop: true,
  slideshowControlsHidden: false,
  videoMode: "loop",
  modalMuted: false,
  modalVolume: 1,
  modalControlsHidden: false,
  modalWheelTime: 0,
  modalWheelBurst: 0,
  modalToolbarTimer: null,
  slideshowWheelTime: 0,
  slideshowWheelBurst: 0,
  slideshowToolbarTimer: null,
  mediaNavTimer: null,
  scannedPath: "",
  scanId: "",
  pathHistory: [],
  pathFavorites: [],
  dragRoots: [],
  dragAuthBusy: false,
  dragAuthRoot: "",
  perf: { scanMs: 0, renderMs: 0, schedulerMs: 0, pageItems: 0, loadedMedia: 0, warmVideos: 0, activeVideos: 0 },
  loadedStatTimer: null,
  floatingPagerTimer: null,
  floatingPagerHover: false,
  folderCache: new Map(),
  gridPage: 0,
  folderRootsLoaded: false,
  pausedForInactive: false,
  wasModalVideoPlayingBeforeHidden: false,
  wasSlideshowPlayingBeforeHidden: false,
  slideshowReturnAfterFullscreenExit: false,
};

const COLUMN_WIDTHS = { 2: 420, 3: 350, 4: 300, 5: 260, 6: 220, 7: 190, 8: 165, 9: 145, 10: 120, 11: 108, 12: 94, 13: 86, 14: 80, 15: 72, 16: 66, 17: 62, 18: 58, 19: 54, 20: 50 };
const COLUMN_GAPS = { 2: 18, 3: 18, 4: 18, 5: 18, 6: 18, 7: 16, 8: 14, 9: 12, 10: 10, 11: 9, 12: 8, 13: 7, 14: 7, 15: 6, 16: 6, 17: 5, 18: 5, 19: 5, 20: 5 };
const COLUMN_OPTIONS = Object.keys(COLUMN_WIDTHS).map(Number);
const LARGE_VIDEO_MB = 500;
const COMFYUI_URL = "http://127.0.0.1:8188/";
const EXPECTED_API_VERSION = 3;
const REQUIRED_BACKEND_CAPABILITIES = ["local_trash", "batch_trash", "trash_restore", "system_trash", "drag_out_roots", "drag_root_verify"];

async function fetchBootstrap() {
  if (!apiClient) throw new Error("API client not initialized");
  return apiClient.bootstrap();
}

// Wrapper that adds the X-App-Token header to write/dangerous requests.
// Read-only endpoints (GET) and unauthenticated probes (/health) still work
// because the server only requires the token on POST write/dangerous paths.
async function apiFetch(url, options = {}) {
  if (!apiClient) throw new Error("API client not initialized");
  return apiClient.request(url, options);
}

const ICONS = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/><path d="M9 12h11"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  checkbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>',
  checkboxChecked: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect class="check-bg" x="5" y="5" width="14" height="14" rx="4"/><path class="check-mark" d="M8.5 12.2l2.4 2.4 4.8-5.2"/></svg>',
  copyPath: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>',
  doubleCheck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12l3 3L21 5"/><path d="M3 12l3 3 5-5"/></svg>',
  multiSelect: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="7" height="7" rx="2"/><path d="M6 8.5l1.4 1.4L10 7"/><rect x="13" y="5" width="7" height="7" rx="2"/><rect x="4" y="14" width="7" height="7" rx="2"/><path d="M14 17.5l1.4 1.4L19 16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  externalOpen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"/><path d="M9.9 4.3A10.6 10.6 0 0 1 12 4c6 0 10 8 10 8a17.8 17.8 0 0 1-3.1 4.3"/><path d="M6.2 6.5C3.5 8.3 2 12 2 12s4 8 10 8a10 10 0 0 0 5-1.4"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2"/></svg>',
  folderPlus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2"/><path d="M14 13h5"/><path d="M16.5 10.5v5"/></svg>',
  folderCheck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2"/><path d="M13.5 14.5l2 2 4-4"/></svg>',
  folderSync: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2"/><path d="M13 13a4 4 0 0 1 6.2-1.3"/><path d="M19 9.5v3h-3"/><path d="M20 15a4 4 0 0 1-6.2 1.3"/><path d="M14 18.5v-3h3"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
  film: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M21 16v5h-5"/><path d="M8 21H3v-5"/></svg>',
  fullscreenExit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v6H3"/><path d="M15 3v6h6"/><path d="M15 21v-6h6"/><path d="M9 21v-6H3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/></svg>',
  alignCenter: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M12 4v16"/></svg>',
  iconMode: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="12" r="1.6"/><path d="M13 10h4"/><path d="M13 14h4"/></svg>',
  image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M21 16l-5-5L5 19"/></svg>',
  language: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h9"/><path d="M9 3v2"/><path d="M6 5c.8 3 2.8 5.4 6 7"/><path d="M12 5c-.8 3-2.8 5.4-6 7"/><path d="M14 21l4-9 4 9"/><path d="M15.4 18h5.2"/></svg>',
  list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14"/><path d="M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h3"/><path d="M17 4h3v3"/><path d="M20 17v3h-3"/><path d="M7 20H4v-3"/><path d="M7 12h10"/></svg>',
  searchIcon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="M15 15l5 5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>',
  sidebar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M6 8h.01"/><path d="M6 12h.01"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 7h3c4 0 5 10 9 10h5"/><path d="M16 21h5v-5"/><path d="M4 17h3c1.7 0 2.9-1.8 4-4"/><path d="M14 7c.8-.7 1.8-1 3-1h4"/></svg>',
  slideshow: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M10 8v5l4-2.5z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/></svg>',
  starFilled: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/></svg>',
  workflow: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="7" height="5.5" rx="1.6"/><rect x="13.5" y="5" width="7" height="5.5" rx="1.6"/><rect x="8.5" y="14" width="7" height="5.5" rx="1.6"/><path d="M10.5 7.8h3"/><path d="M7 10.5v2.2c0 .9.6 1.3 1.5 1.3H12"/><path d="M17 10.5v2.2c0 .9-.6 1.3-1.5 1.3H12"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  textMode: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18h14"/><path d="M8 18l4-12 4 12"/><path d="M9.5 13h5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></svg>',
  archiveTray: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v5H4z"/><path d="M4 9l2 11h12l2-11"/><path d="M9 14h6"/><path d="M8 4l1.5-2h5L16 4"/></svg>',
  restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
  files: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8l4 4v13H8z"/><path d="M16 3v5h5"/><path d="M4 7v14h12"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
};

const i18n = {
  en: {
    htmlLang: "en",
    chooseFolder: "Choose Folder",
    scan: "Scan",
    scanning: "Scanning...",
    expand: "Expand",
    rememberPath: "Remember path",
    recursive: "Scan subfolders (max 2 levels)",
    excludeRules: "Filename exclusion rules",
    excludeEnabled: "Enable filename exclusion",
    excludeKeywordPlaceholder: "Keyword, for example fanart",
    excludeAdd: "Add",
    excludeScope: "Apply to",
    excludeImagesOnly: "Images only",
    excludeAllMedia: "Images and videos",
    excludeNote: "Rules match the filename only and apply on the next scan.",
    excludeSave: "Save",
    excludeCancel: "Cancel",
    excludeSaved: "Filename exclusion rules saved.",
    excludeEmpty: "No exclusion keywords.",
    excludeDuplicate: "This keyword already exists.",
    excludeRemove: "Remove keyword",
    scanProtection: "Scan protection",
    scanProtectionPathPlaceholder: "Path, for example H:\\",
    scanProtectionAdd: "Add",
    scanProtectionCapacity: "Minimum drive capacity",
    scanProtectionNoLimit: "No limit",
    scanProtectionNote: "Blocked paths and drives below the capacity limit cannot be scanned.",
    scanProtectionEmpty: "No blocked scan paths.",
    scanProtectionDuplicate: "This path already exists.",
    scanProtectionRemove: "Remove path",
    scanProtectionSaved: "Scan protection saved.",
    scanBlockedPath: "Scan blocked",
    scanBlockedCapacity: "Below capacity limit",
    search: "Search filename...",
    reviewTitle: "Review filter",
    all: "All",
    favorites: "Favorites",
    sizeFilterTitle: "File size",
    anySize: "Any size",
    smallFiles: "Under 10 MB",
    mediumFiles: "10-50 MB",
    largeFiles: "Over 50 MB",
    dateFilterTitle: "Modified date",
    anyDate: "Any date",
    lastDay: "Last 24h",
    lastWeek: "Last 7d",
    lastMonth: "Last 30d",
    mediaTypeTitle: "Media type",
    allMedia: "All",
    videosOnly: "Videos",
    imagesOnly: "Images",
    favorite: "Favorite",
    favorited: "Favorited",
    workflowBadge: "Contains workflow metadata",
    workflowChecking: "Checking workflow metadata...",
    workflowGeneration: "Contains generation parameters",
    workflowOnly: "Workflow found, but no prompt/model/LoRA detected",
    copyFullPath: "Copy full path",
    moreActions: "More actions",
    pathCopied: "Full path copied.",
    metadataTitle: "Generation info",
    metadataModel: "Model",
    metadataLora: "LoRA",
    metadataPrompt: "Prompt",
    metadataNegative: "Negative prompt",
    metadataSource: "Source / path",
    metadataBasic: "File info",
    metadataPath: "Path",
    metadataSize: "Size",
    metadataDate: "Date",
    metadataDimensions: "Dimensions",
    metadataRatio: "Ratio",
    metadataDuration: "Duration",
    metadataFormat: "Format",
    metadataCodec: "Codec",
    metadataPending: "No generation metadata detected yet.",
    metadataLoading: "Reading metadata...",
    metadataDetected: "Generation metadata loaded",
    metadataPartial: "Basic media metadata loaded; no AI prompt fields detected.",
    metadataEmpty: "No AI generation parameters detected.",
    metadataRaw: "Raw metadata",
    metadataActions: "Metadata actions",
    metadataCopyRaw: "Copy raw",
    metadataCopyWorkflow: "Copy workflow",
    metadataOpenComfy: "Open ComfyUI",
    metadataError: "Metadata read failed.",
    copy: "Copy",
    copied: "Copied.",
    sortTitle: "Sort",
    columnsTitle: "Grid columns",
  pageSizeTitle: "Items per page",
    pageSizeLabelText: "Per page",
    wallAutoplay: "Auto play wall",
    wallPlayLimit: "Wall play limit",
    playLimitOptions: {
      4: "4 · Ultra low", 6: "6 · Low-power", 8: "8 · Balanced low-power",
      12: "12 · Balanced", 18: "18 · Performance", 24: "24 · High performance",
      36: "36 · Legacy high", 48: "48 · Very high", 72: "72 · Maximum load",
    },
    columnsAutoplay: "Autoplay · 2-9 cols",
    columnsStatic: "Static preview · 10-20 cols",
    previewLargeVideos: "Preview videos over 500 MB in the wall",
    largeVideoTitle: "Large video",
    largeVideoHint: "Click to play on demand",
    pauseWhenInactive: "Pause inactive",
    settings: "Settings",
    folders: "Folders",
    folderPanelTitle: "Folders",
    folderFavorites: "Favorites",
    folderDrives: "Drives",
    folderEmpty: "No saved paths.",
    folderLoadFail: "Could not load folders.",
    folderRefresh: "Refresh",
    addFavorite: "Add favorite",
    removeFavorite: "Remove favorite",
    dragOutSettings: "Drag out",
    dragAuthorize: "Authorize drag-out",
    dragReady: "Drag-out ready",
    dragRefresh: "Refresh drag authorization",
    dragCoveredBy: root => `Covered by ${root}`,
    dragRootEmpty: "No drag roots configured.",
    dragAuthorizeCurrent: "Authorize current path",
    dragSettingsNote: "Authorize a high-level media folder once. Clicking authorize copies the target path first so you can paste it into Chrome's folder picker. Chrome may call this 'upload'; Local Video Wall does not upload these files to the network.",
    dragAuthorizationCancelled: "Drag authorization cancelled.",
    dragAuthorizationFailed: "Drag authorization did not complete.",
    dragAuthorizing: "Authorizing drag root...",
    dragAuthorizationBusy: "Another drag root authorization is already in progress.",
    dragVerificationFailed: (root, error) => `The selected folder could not be verified against ${root}. ${error || "Please select the exact target folder."}`,
    dragRootReadyMeta: (total, media, ms) => `${total} files · ${media} media · index ${ms}ms`,
    dragRootRestoreMeta: "Configured root · authorization must be restored for this browser session",
    dragRootStaleMeta: "New or changed files detected · refresh this root",
    dragRefreshAction: "Refresh authorization",
    dragRemoveAction: "Remove drag root",
    dragChooseRoot: root => `Target path copied: ${root}. Paste it into the browser folder picker, then confirm that folder.`,
    dragChooseRootCopyFail: root => `Confirm this drag root in the browser folder picker: ${root}`,
    dragFolderMismatch: (expected, selected) => `The selected folder does not match this authorization target. Target: ${expected}. Selected folder: ${selected || "unknown"}. Please choose the target folder again.`,
    dragAuthorized: (root, total, media, ms) => `Drag-out ready: ${root} · ${total} files · ${media} media · index ${ms}ms`,
    dragRootRemoved: "Drag root removed.",
    dragNeedsAuthorize: "This media is not covered by a drag root. Authorize a parent folder first.",
    dragNeedsRefresh: "This drag root needs to be restored or refreshed before dragging.",
    dragUnsupported: "This browser cannot authorize folders for drag-out.",
    pathHistory: "Path history",
    noHistory: "No path history.",
    noPathSuggestions: "No folder matches.",
    interfaceSettings: "Interface",
    fontSize: "Text size",
    fontSizeSmall: "Small",
    fontSizeStandard: "Standard",
    fontSizeLarge: "Large",
    contentAlign: "Layout position",
    contentAlignCenter: "Center",
    contentAlignLeft: "Left",
    contentAlignRight: "Right",
    scanSettings: "Scan",
    playbackSettings: "Playback",
    filterSettings: "Filters",
    actionSettings: "Actions",
    confirmTrashSetting: "Confirm before moving media to recycle folder",
    trashConfirmTitle: "Move to recycle folder?",
    trashConfirmMessage: "Move this file to this folder's recycle folder?",
    trashConfirmDontAsk: "Don't ask again",
    trashConfirmMove: "Move",
    backendRestartRequired: "The page and service versions do not match. Restart Local Video Wall, then reload this page.",
    clearHistory: "Clear Path History",
    historyCleared: "Path history cleared.",
    removeHistory: "Remove from history",
    historyRemoved: "Path removed from history.",
    pagePrevious: "Previous",
    pageNext: "Next",
    pageFirst: "First",
    pageLast: "Last",
    pageStatus: (page, pages) => `Page ${page} / ${pages}`,
    pageInfo: (page, pages, count) => `Page ${page} / ${pages} · ${count} items`,
    pageSizeLabel: n => `${n} / page`,
    floatingPager: "Floating pager",
    resetFilters: "Reset filters",
    filtersReset: "Filters reset.",
    batch: "Batch actions",
    batchExit: "Exit batch",
    batchInfo: n => `${n} selected`,
    batchSelectPage: "Select all",
    batchSelectPageTitle: "Select all items on the current page",
    batchClear: "Clear",
    batchFavorite: "Favorite",
    batchUnfavorite: "Unfavorite",
    batchTrash: "Move to recycle folder",
    batchExport: "Export CSV",
    batchSelectItem: "Select",
    batchSelectedItem: "Selected",
    batchNoSelection: "Select at least one item first.",
    batchDone: n => `Batch action finished: ${n} item(s).`,
    batchWorking: "Batch action in progress...",
    batchFailed: reason => `Batch action failed: ${reason}`,
    batchPartial: (done, failed, reason) => `Batch action finished: ${done} succeeded, ${failed} failed. ${reason}`,
    batchTrashConfirm: n => `Move ${n} selected item(s) to this folder's recycle folder?`,
    shuffle: "Shuffle",
    exportCsv: "Export CSV",
    exportEmpty: "No visible items to export.",
    exportDone: n => `Exported ${n} rows to CSV.`,
    pauseAll: "Pause All",
    resume: "Resume",
    immersive: "Immersive",
    exitImmersive: "Exit Immersive",
    showInFolder: "Show in Folder",
    openDefaultApp: "Open in Default App",
    openDefaultDone: "Opened in default app.",
    openDefaultFail: "Could not open the file in the default app.",
    close: "Close",
    slideshow: "Slideshow",
    prev: "Prev",
    next: "Next",
    play: "Play",
    pause: "Pause",
    loop: "Loop",
    none: "None",
    fade: "Fade",
    slide: "Slide",
    drift: "Drift",
    random: "Random",
    contain: "Contain",
    cover: "Cover",
    hideUi: "Hide UI",
    showUi: "Show UI",
    loopOne: "Loop",
    sequential: "Seq",
    randomPlay: "Random",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    volumeLabel: "Volume",
    noImages: "No images in the current filtered list.",
    location: "Folder",
    langToggle: "中文",
    emptyTitle: "Choose a video folder",
    emptyBody: "Enter a folder path manually, or click Choose Folder. After scanning, visible videos will autoplay silently in a loop.",
    pathPlaceholder: "Enter a video folder path, for example C:\\Users\\YourName\\Videos",
    noPath: "No folder selected",
    subChoose: "Choose a video folder",
    videos: "videos",
    cols: "cols",
    playLimit: "play limit",
    items: "videos",
    noMatchTitle: "No matching videos",
    noMatchBody: "Try another keyword, clear filters, or switch back to All.",
    noMediaTitle: "No supported media found",
    noMediaBody: "This folder has no supported video or image files. Try enabling Scan subfolders or choosing another folder.",
    openFail: "Could not open the folder.",
    chooseOpening: "Opening the Windows folder picker. It may appear behind the browser.",
    choosing: "Choosing...",
    chosen: "Folder selected. Click Scan to load videos.",
    pathSelectedScanning: "Path selected. Scanning...",
    notChosen: "No folder selected.",
    chooseFail: "Could not open the folder picker. You can enter the path manually.",
    needPath: "Please enter or choose a video folder first.",
    scanProgress: "Scanning...",
    scanFail: "Scan failed",
    unknown: "Unknown error",
    noVideosTitle: "No videos found",
    noVideosBody: "Currently supports video and image files. Try enabling Scan subfolders.",
    reviewSaved: "Review mark saved.",
    reviewFail: "Could not save review mark.",
    moveReview: "Move to Review Folder",
    moveTrash: "Move to recycle folder",
    confirmReview: "Move this file to _video_wall_review? The original file path will change.",
    fileActionDone: "File moved. The current list was updated.",
    recycleFolder: "Recycle folder",
    showRecycleFolder: "Show recycle folder",
    showMediaWall: "Back to media wall",
    recycleEmpty: "The recycle folder is empty.",
    recycleItems: n => `${n} item(s) in this folder's recycle folder`,
    recycleSelectAll: "Select all",
    recycleRestore: "Restore",
    recycleSystemTrash: "Move to system recycle bin",
    recycleRestoreTitle: "Restore to the original path. A new name is used if that path already exists.",
    recycleSystemTitle: "Move to the Windows system recycle bin",
    recycleOriginalPath: "Original path",
    recycleDeletedAt: "Moved",
    recycleActionDone: n => `${n} recycle folder item(s) processed.`,
    recycleActionFailed: reason => `Recycle folder action failed: ${reason}`,
    recycleSystemConfirm: n => `Move ${n} item(s) to the Windows system recycle bin?`,
    fileActionFail: "File action failed.",
    perfInfo: stats => `scan ${stats.scanMs}ms · render ${stats.renderMs}ms · scheduler ${stats.schedulerMs}ms · active ${stats.activeVideos} · warm ${stats.warmVideos} · loaded ${stats.loadedMedia}`,
    scanDone: (n, excluded = 0) => excluded > 0
      ? `Scan complete: ${n} media items · ${excluded} excluded`
      : `Scan complete: ${n} media items`,
    configFail: "Could not load settings.",
    sortOptions: {
      mtime_desc: "Newest modified",
      mtime_asc: "Oldest modified",
      name_asc: "Filename A-Z",
      name_desc: "Filename Z-A",
      path_asc: "Path A-Z",
      path_desc: "Path Z-A",
      size_desc: "Size large-small",
      size_asc: "Size small-large",
      random: "Random order",
    },
    colLabel: n => `${n} cols`,
    pageSizeOption: n => `${n} / page`,
  },
  zh: {
    htmlLang: "zh-CN",
    chooseFolder: "选择文件夹",
    scan: "扫描",
    scanning: "扫描中...",
    expand: "展开",
    rememberPath: "记住路径",
    recursive: "扫描子文件夹（最多 2 层）",
    excludeRules: "文件名排除规则",
    excludeEnabled: "启用文件名排除",
    excludeKeywordPlaceholder: "输入关键词，例如 fanart",
    excludeAdd: "添加",
    excludeScope: "应用范围",
    excludeImagesOnly: "仅图片",
    excludeAllMedia: "图片和视频",
    excludeNote: "仅匹配文件名，并从下一次扫描开始生效。",
    excludeSave: "保存",
    excludeCancel: "取消",
    excludeSaved: "文件名排除规则已保存。",
    excludeEmpty: "暂无排除关键词。",
    excludeDuplicate: "这个关键词已经存在。",
    excludeRemove: "删除关键词",
    scanProtection: "扫描保护",
    scanProtectionPathPlaceholder: "输入路径，例如 H:\\",
    scanProtectionAdd: "添加",
    scanProtectionCapacity: "最低磁盘总容量",
    scanProtectionNoLimit: "不限制",
    scanProtectionNote: "禁止扫描的位置，以及总容量低于该阈值的磁盘，均无法扫描。",
    scanProtectionEmpty: "暂无禁止扫描的位置。",
    scanProtectionDuplicate: "这个路径已经存在。",
    scanProtectionRemove: "删除路径",
    scanProtectionSaved: "扫描保护已保存。",
    scanBlockedPath: "已禁止扫描",
    scanBlockedCapacity: "低于容量阈值",
    search: "搜索文件名...",
    reviewTitle: "审核筛选",
    all: "全部",
    favorites: "收藏",
    sizeFilterTitle: "文件大小",
    anySize: "任意大小",
    smallFiles: "小于 10 MB",
    mediumFiles: "10-50 MB",
    largeFiles: "大于 50 MB",
    dateFilterTitle: "修改时间",
    anyDate: "任意时间",
    lastDay: "最近 24 小时",
    lastWeek: "最近 7 天",
    lastMonth: "最近 30 天",
    mediaTypeTitle: "媒体类型",
    allMedia: "全部",
    videosOnly: "视频",
    imagesOnly: "图片",
    favorite: "收藏",
    favorited: "已收藏",
    workflowBadge: "含有工作流数据",
    workflowChecking: "正在检测工作流数据...",
    workflowGeneration: "含有生成参数",
    workflowOnly: "含有工作流，但未检测到 Prompt / 模型 / LoRA",
    copyFullPath: "复制完整路径",
    moreActions: "更多操作",
    pathCopied: "已复制完整路径。",
    metadataTitle: "生成信息",
    metadataModel: "大模型",
    metadataLora: "LoRA",
    metadataPrompt: "正面提示词",
    metadataNegative: "负面提示词",
    metadataSource: "来源 / 路径",
    metadataBasic: "文件信息",
    metadataPath: "路径",
    metadataSize: "大小",
    metadataDate: "日期",
    metadataDimensions: "尺寸",
    metadataRatio: "比例",
    metadataDuration: "时长",
    metadataFormat: "格式",
    metadataCodec: "编码",
    metadataPending: "暂未读取到生成元数据。",
    metadataLoading: "正在读取元数据...",
    metadataDetected: "已读取生成元数据",
    metadataPartial: "已读取基础媒体信息，未检测到 AI 提示词字段。",
    metadataEmpty: "未检测到 AI 生成参数。",
    metadataRaw: "原始元数据",
    metadataActions: "元数据操作",
    metadataCopyRaw: "复制原始数据",
    metadataCopyWorkflow: "复制工作流",
    metadataOpenComfy: "打开 ComfyUI",
    metadataError: "元数据读取失败。",
    copy: "复制",
    copied: "已复制。",
    sortTitle: "排序",
    columnsTitle: "卡片列数",
  pageSizeTitle: "每页数量",
    pageSizeLabelText: "每页",
    wallAutoplay: "墙内自动播放",
    wallPlayLimit: "墙内播放上限",
    playLimitOptions: {
      4: "4 · 超低负载", 6: "6 · 低配", 8: "8 · 低配均衡",
      12: "12 · 均衡", 18: "18 · 性能", 24: "24 · 高性能",
      36: "36 · 旧版高负载", 48: "48 · 很高负载", 72: "72 · 极限负载",
    },
    columnsAutoplay: "自动播放 · 2-9 列",
    columnsStatic: "静态预览 · 10-20 列",
    previewLargeVideos: "允许墙内预览 500MB 以上视频",
    largeVideoTitle: "大文件视频",
    largeVideoHint: "点击后按需播放",
    pauseWhenInactive: "后台暂停播放",
    settings: "设置",
    folders: "文件夹",
    folderPanelTitle: "文件夹",
    folderFavorites: "收藏路径",
    folderDrives: "磁盘",
    folderEmpty: "暂无保存路径。",
    folderLoadFail: "文件夹加载失败。",
    folderRefresh: "刷新",
    addFavorite: "添加收藏",
    removeFavorite: "取消收藏",
    dragOutSettings: "拖拽授权",
    dragAuthorize: "授权拖拽",
    dragReady: "拖拽已授权",
    dragRefresh: "刷新拖拽授权",
    dragCoveredBy: root => `已由 ${root} 覆盖`,
    dragRootEmpty: "暂无拖拽根目录。",
    dragAuthorizeCurrent: "授权当前路径",
    dragSettingsNote: "只需授权高层素材目录一次。点击授权会先复制目标路径，可直接粘贴到 Chrome 的目录选择器中。Chrome 可能把目录授权显示为“上传文件”，但 Local Video Wall 不会把这些文件上传到网络。",
    dragAuthorizationCancelled: "已取消拖拽授权。",
    dragAuthorizationFailed: "拖拽授权未完成。",
    dragAuthorizing: "正在授权拖拽根目录...",
    dragAuthorizationBusy: "已有另一个拖拽根目录正在授权，请稍候。",
    dragVerificationFailed: (root, error) => `所选文件夹无法验证为目标根目录：${root}。${error || "请确认选择的是这个准确目录。"}`,
    dragRootReadyMeta: (total, media, ms) => `${total} 个文件 · ${media} 个媒体 · 建索引 ${ms}ms`,
    dragRootRestoreMeta: "已配置根目录 · 本次浏览器会话需要恢复授权",
    dragRootStaleMeta: "检测到新增或变更文件 · 需要刷新该根目录",
    dragRefreshAction: "刷新授权",
    dragRemoveAction: "移除拖拽根目录",
    dragChooseRoot: root => `目标路径已复制：${root}。请在 Chrome 目录选择器的地址栏粘贴该路径，并确认这个文件夹。`,
    dragChooseRootCopyFail: root => `请在 Chrome 目录选择器中确认拖拽根目录：${root}`,
    dragFolderMismatch: (expected, selected) => `选择的文件夹不是当前授权目标。目标：${expected}。当前选择：${selected || "未知"}。请重新选择目标文件夹。`,
    dragAuthorized: (root, total, media, ms) => `拖拽授权成功：${root} · ${total} 个文件 · ${media} 个媒体 · 建索引 ${ms}ms`,
    dragRootRemoved: "已移除拖拽根目录。",
    dragNeedsAuthorize: "这个媒体不在任何拖拽根目录内，请先授权它的上级目录。",
    dragNeedsRefresh: "这个拖拽根目录需要恢复或刷新授权后才能拖拽。",
    dragUnsupported: "当前浏览器不支持目录拖拽授权。",
    pathHistory: "路径历史",
    noHistory: "暂无路径历史。",
    noPathSuggestions: "没有匹配的文件夹。",
    interfaceSettings: "界面",
    fontSize: "字体大小",
    fontSizeSmall: "小",
    fontSizeStandard: "标准",
    fontSizeLarge: "大",
    contentAlign: "布局位置",
    contentAlignCenter: "居中",
    contentAlignLeft: "左侧",
    contentAlignRight: "右侧",
    scanSettings: "扫描",
    playbackSettings: "播放",
    filterSettings: "筛选",
    actionSettings: "操作",
    confirmTrashSetting: "移到回收文件夹前确认",
    trashConfirmTitle: "移到回收文件夹？",
    trashConfirmMessage: "要把这个文件移动到当前目录的回收文件夹吗？",
    trashConfirmDontAsk: "以后不再提示",
    trashConfirmMove: "移动",
    backendRestartRequired: "页面与后台服务版本不一致，请重启 Local Video Wall 后刷新页面。",
    clearHistory: "清空路径历史",
    historyCleared: "路径历史已清空。",
    removeHistory: "删除这条历史记录",
    historyRemoved: "已删除这条路径历史。",
    pagePrevious: "上一页",
    pageNext: "下一页",
    pageFirst: "首页",
    pageLast: "末页",
    pageStatus: (page, pages) => `第 ${page} / ${pages} 页`,
    pageInfo: (page, pages, count) => `第 ${page} / ${pages} 页 · ${count} 项`,
    pageSizeLabel: n => `每页 ${n}`,
    floatingPager: "悬浮分页条",
    resetFilters: "重置筛选",
    filtersReset: "筛选已重置。",
    batch: "批量操作",
    batchExit: "退出批量",
    batchInfo: n => `已选择 ${n} 个`,
    batchSelectPage: "全选",
    batchSelectPageTitle: "全选当前页的项目",
    batchClear: "清空",
    batchFavorite: "收藏",
    batchUnfavorite: "取消收藏",
    batchTrash: "移到回收文件夹",
    batchExport: "导出 CSV",
    batchSelectItem: "选择",
    batchSelectedItem: "已选择",
    batchNoSelection: "请先选择至少一个项目。",
    batchDone: n => `批量操作完成：${n} 个项目。`,
    batchWorking: "正在执行批量操作...",
    batchFailed: reason => `批量操作失败：${reason}`,
    batchPartial: (done, failed, reason) => `批量操作完成：成功 ${done} 个，失败 ${failed} 个。${reason}`,
    batchTrashConfirm: n => `要把已选择的 ${n} 个项目移到当前目录的回收文件夹吗？`,
    shuffle: "随机",
    exportCsv: "导出 CSV",
    exportEmpty: "当前没有可导出的项目。",
    exportDone: n => `已导出 ${n} 行 CSV。`,
    pauseAll: "暂停全部",
    resume: "继续播放",
    immersive: "沉浸",
    exitImmersive: "退出沉浸",
    showInFolder: "打开所在位置",
    openDefaultApp: "默认应用打开",
    openDefaultDone: "已用默认应用打开。",
    openDefaultFail: "无法用默认应用打开这个文件。",
    close: "关闭",
    slideshow: "幻灯片",
    prev: "上一张",
    next: "下一张",
    play: "播放",
    pause: "暂停",
    loop: "循环",
    none: "无",
    fade: "淡入淡出",
    slide: "滑动",
    drift: "动态漂移",
    random: "随机",
    contain: "完整显示",
    cover: "填满屏幕",
    hideUi: "隐藏控制",
    showUi: "显示控制",
    loopOne: "循环",
    sequential: "顺序",
    randomPlay: "随机",
    fullscreen: "全屏",
    exitFullscreen: "退出全屏",
    volumeLabel: "音量",
    noImages: "当前筛选结果里没有图片。",
    location: "位置",
    langToggle: "English",
    emptyTitle: "请选择视频文件夹",
    emptyBody: "你可以手动输入路径，也可以点击“选择文件夹”。扫描后，当前屏幕内的视频会自动静音循环播放。",
    pathPlaceholder: "输入视频文件夹路径，例如 C:\\Users\\你的用户名\\Videos",
    noPath: "未选择路径",
    subChoose: "请选择视频文件夹",
    videos: "个视频",
    cols: "列",
    playLimit: "播放上限",
    items: "个视频",
    noMatchTitle: "没有匹配的视频",
    noMatchBody: "请换一个搜索词、清空筛选，或切回“全部”。",
    noMediaTitle: "没有找到支持的媒体",
    noMediaBody: "这个文件夹里没有支持的视频或图片文件。可以尝试开启扫描子文件夹，或选择其它文件夹。",
    openFail: "打开位置失败",
    chooseOpening: "正在打开 Windows 文件夹选择框，可能会出现在浏览器后面。",
    choosing: "选择中...",
    chosen: "已选择文件夹，点击“扫描”开始加载。",
    pathSelectedScanning: "已选择路径，正在扫描...",
    notChosen: "未选择文件夹。",
    chooseFail: "打开文件夹选择框失败，可以手动输入路径。",
    needPath: "请先输入或选择一个视频文件夹。",
    scanProgress: "正在扫描...",
    scanFail: "扫描失败",
    unknown: "未知错误",
    noVideosTitle: "没有找到视频",
    noVideosBody: "当前支持常见视频和图片格式。可以尝试勾选“扫描子文件夹”。",
    reviewSaved: "标记已保存。",
    reviewFail: "标记保存失败。",
    moveReview: "移到整理夹",
    moveTrash: "移到回收文件夹",
    confirmReview: "要把这个文件移动到 _video_wall_review 整理夹吗？原文件路径会变化。",
    fileActionDone: "文件已移动，当前列表已更新。",
    recycleFolder: "回收文件夹",
    showRecycleFolder: "打开回收文件夹",
    showMediaWall: "返回媒体墙",
    recycleEmpty: "回收文件夹为空。",
    recycleItems: n => `当前目录的回收文件夹内有 ${n} 项`,
    recycleSelectAll: "全选",
    recycleRestore: "恢复",
    recycleSystemTrash: "移到系统回收站",
    recycleRestoreTitle: "恢复到原路径；若已有同名文件，则自动使用新名称保留两者。",
    recycleSystemTitle: "移到 Windows 系统回收站",
    recycleOriginalPath: "原路径",
    recycleDeletedAt: "移入时间",
    recycleActionDone: n => `已处理 ${n} 个回收文件夹项目。`,
    recycleActionFailed: reason => `回收文件夹操作失败：${reason}`,
    recycleSystemConfirm: n => `要把 ${n} 个项目移到 Windows 系统回收站吗？`,
    fileActionFail: "文件操作失败。",
    perfInfo: stats => `扫描 ${stats.scanMs}ms · 渲染 ${stats.renderMs}ms · 调度 ${stats.schedulerMs}ms · 播放 ${stats.activeVideos} · 预热 ${stats.warmVideos} · 已加载 ${stats.loadedMedia}`,
    scanDone: (n, excluded = 0) => excluded > 0
      ? `扫描完成：显示 ${n} 项 · 已排除 ${excluded} 项`
      : `扫描完成：${n} 个媒体文件`,
    configFail: "配置加载失败。",
    sortOptions: {
      mtime_desc: "最新修改",
      mtime_asc: "最早修改",
      name_asc: "文件名 A-Z",
      name_desc: "文件名 Z-A",
      path_asc: "路径 A-Z",
      path_desc: "路径 Z-A",
      size_desc: "文件大-小",
      size_asc: "文件小-大",
      random: "随机顺序",
    },
    colLabel: n => `${n}列`,
    pageSizeOption: n => `每页${n}`,
  },
};

const $ = s => document.querySelector(s);
const mainArea = $("#mainArea");
const grid = $("#grid");
const gridPager = $("#gridPager");
const topPager = $("#topPager");
const topPagePrev = $("#topPagePrev");
const topPageNext = $("#topPageNext");
const floatingPager = $("#floatingPager");
const subInfo = $("#subInfo");
const pathInput = $("#pathInput");
const folderPanelToggle = $("#folderPanelToggle");
const favoritePathBtn = $("#favoritePathBtn");
const dragPathBtn = $("#dragPathBtn");
const pathHistoryToggle = $("#pathHistoryToggle");
const pathHistoryMenu = $("#pathHistoryMenu");
const pathSuggestMenu = $("#pathSuggestMenu");
const pathCombo = pathInput.closest(".path-combo");
const folderPanel = $("#folderPanel");
const folderPanelClose = $("#folderPanelClose");
const folderPanelRefresh = $("#folderPanelRefresh");
const folderFavorites = $("#folderFavorites");
const folderTree = $("#folderTree");
const chooseFolderBtn = $("#chooseFolderBtn");
const scanBtn = $("#scanBtn");
const rememberPath = $("#rememberPath");
const recursiveScan = $("#recursiveScan");
const excludeRulesOpen = $("#excludeRulesOpen");
const excludeRulesCount = $("#excludeRulesCount");
const excludeRulesDialog = $("#excludeRulesDialog");
const excludeRulesClose = $("#excludeRulesClose");
const excludeRulesCancel = $("#excludeRulesCancel");
const excludeRulesSave = $("#excludeRulesSave");
const excludeRulesEnabled = $("#excludeRulesEnabled");
const excludeKeywordInput = $("#excludeKeywordInput");
const excludeKeywordAdd = $("#excludeKeywordAdd");
const excludeKeywordList = $("#excludeKeywordList");
const excludeScopeSeg = $("#excludeScopeSeg");
const scanProtectionOpen = $("#scanProtectionOpen");
const scanProtectionCount = $("#scanProtectionCount");
const scanProtectionDialog = $("#scanProtectionDialog");
const scanProtectionClose = $("#scanProtectionClose");
const scanProtectionCancel = $("#scanProtectionCancel");
const scanProtectionSave = $("#scanProtectionSave");
const blockedScanPathInput = $("#blockedScanPathInput");
const blockedScanPathAdd = $("#blockedScanPathAdd");
const blockedScanPathList = $("#blockedScanPathList");
const minScanVolumeSelect = $("#minScanVolumeSelect");
const dragSettingsSection = $("#dragSettingsSection");
const dragRootList = $("#dragRootList");
const dragAuthorizeCurrentBtn = $("#dragAuthorizeCurrentBtn");
const dragAuthorizeCurrentLabel = $("#dragAuthorizeCurrentLabel");
const dragRootCount = $("#dragRootCount");
const dragSettingsNote = $("#dragSettingsNote");
const searchInput = $("#searchInput");
const sizeFilterSelect = $("#sizeFilterSelect");
const dateFilterSelect = $("#dateFilterSelect");
const mediaFilterSeg = $("#mediaFilterSeg");
const sortSelect = $("#sortSelect");
const pageSizeInput = $("#pageSizeInput");
const wallAutoplay = $("#wallAutoplay");
const playLimitSelect = $("#playLimitSelect");
const previewLargeVideos = $("#previewLargeVideos");
const pauseWhenInactive = $("#pauseWhenInactive");
const floatingPagerEnabled = $("#floatingPagerEnabled");
const confirmTrash = $("#confirmTrash");
const columnsSelect = $("#columnsSelect");
const exportCsvBtn = $("#exportCsvBtn");
const clearHistoryBtn = $("#clearHistoryBtn");
const pauseBtn = $("#pauseBtn");
const resetFiltersBtn = $("#resetFiltersBtn");
const batchToggleBtn = $("#batchToggleBtn");
const batchBar = $("#batchBar");
const batchInfo = $("#batchInfo");
const batchSelectPageBtn = $("#batchSelectPageBtn");
const batchClearBtn = $("#batchClearBtn");
const batchFavoriteBtn = $("#batchFavoriteBtn");
const batchUnfavoriteBtn = $("#batchUnfavoriteBtn");
const batchTrashBtn = $("#batchTrashBtn");
const batchExportBtn = $("#batchExportBtn");
const batchExitBtn = $("#batchExitBtn");
const immersiveBtn = $("#immersiveBtn");
const expandBtn = $("#expandBtn");
const trashToggle = $("#trashToggle");
const trashView = $("#trashView");
const trashViewTitle = $("#trashViewTitle");
const trashViewInfo = $("#trashViewInfo");
const trashList = $("#trashList");
const trashSelectAllBtn = $("#trashSelectAllBtn");
const trashRestoreBtn = $("#trashRestoreBtn");
const trashSystemBtn = $("#trashSystemBtn");
const settingsToggle = $("#settingsToggle");
const settingsMenu = $("#settingsMenu");
const langToggle = $("#langToggle");
const themeToggle = $("#themeToggle");
const fontSizeSeg = $("#fontSizeSeg");
const contentAlignSeg = $("#contentAlignSeg");
const modalContentAlignSeg = $("#modalContentAlignSeg");
const emptyState = $("#emptyState");
const toast = $("#toast");
const trashConfirmDialog = $("#trashConfirmDialog");
const trashConfirmTitle = $("#trashConfirmTitle");
const trashConfirmMessage = $("#trashConfirmMessage");
const trashConfirmDontAsk = $("#trashConfirmDontAsk");
const trashConfirmDontAskLabel = $("#trashConfirmDontAskLabel");
const trashConfirmCancel = $("#trashConfirmCancel");
const trashConfirmOk = $("#trashConfirmOk");
let trashConfirmResolve = null;
let trashConfirmAllowDontAsk = true;
const trashConfirmDontAskWrap = trashConfirmDontAsk.closest("label");
const modal = $("#modal");
const modalContent = $(".modal-content");
const modalVideo = $("#modalVideo");
const modalImage = $("#modalImage");
const modalMetadata = $("#modalMetadata");
const modalName = $("#modalName");
const modalMeta = $("#modalMeta");
const modalClose = $("#modalClose");
const modalOpenDefault = $("#modalOpenDefault");
const modalOpenFolder = $("#modalOpenFolder");
const modalFavorite = $("#modalFavorite");
const modalMoveTrash = $("#modalMoveTrash");
const modalSlideshow = $("#modalSlideshow");
const modalSlideshowFullscreen = $("#modalSlideshowFullscreen");
const modalImageUiToggle = $("#modalImageUiToggle");
const modalPrev = $("#modalPrev");
const modalNext = $("#modalNext");
const modalVideoControls = $("#modalVideoControls");
const modalVideoModeSeg = $("#modalVideoModeSeg");
const modalFullscreen = $("#modalFullscreen");
const modalVideoUiToggle = $("#modalVideoUiToggle");
const modalHiddenActions = $("#modalHiddenActions");
const modalUiShow = $("#modalUiShow");
const modalHiddenExitFullscreen = $("#modalHiddenExitFullscreen");
const modalHiddenClose = $("#modalHiddenClose");
const slideshow = $("#slideshow");
const slideshowImageA = $("#slideshowImageA");
const slideshowImageB = $("#slideshowImageB");
const slideshowName = $("#slideshowName");
const slideshowCounter = $("#slideshowCounter");
const slideshowClose = $("#slideshowClose");
const slideshowPrev = $("#slideshowPrev");
const slideshowPlay = $("#slideshowPlay");
const slideshowNext = $("#slideshowNext");
const slideshowMoveTrash = $("#slideshowMoveTrash");
const slideshowSidePrev = $("#slideshowSidePrev");
const slideshowSideNext = $("#slideshowSideNext");
const slideshowInterval = $("#slideshowInterval");
const slideshowEffect = $("#slideshowEffect");
const slideshowFit = $("#slideshowFit");
const slideshowLoop = $("#slideshowLoop");
const slideshowLoopLabel = $("#slideshowLoopLabel");
const slideshowFullscreen = $("#slideshowFullscreen");
const slideshowUiToggle = $("#slideshowUiToggle");
const slideshowHiddenActions = $("#slideshowHiddenActions");
const slideshowUiShow = $("#slideshowUiShow");
const slideshowExitFullscreen = $("#slideshowExitFullscreen");
const slideshowBackToPreview = $("#slideshowBackToPreview");
let excludeRulesDraft = null;
let scanProtectionDraft = null;

const dragOutController = createDragOutController({
  onChange: () => {
    updateDragAuthorizationUi();
    renderDragRootSettings();
  },
  verifySelection: verifyDragRootSelection,
});

const playbackController = createPlaybackController({
  state,
  modal,
  slideshow,
  onMediaLoadChanged: () => syncLoadedMediaStat(),
});

const workflowStatusController = createWorkflowStatusController({
  getScanId: () => state.scanId,
  getText: () => t(),
  icons: { searchIcon: ICONS.searchIcon, workflow: ICONS.workflow },
  escapeCssIdent,
});

const gridController = createGridController({
  state,
  elements: {
    grid,
    gridPager,
    floatingPager,
    topPager,
    topPagePrev,
    topPageNext,
    emptyState,
    mainArea,
  },
  getText: () => t(),
  icons: { play: ICONS.play, workflow: ICONS.workflow },
  largeVideoMb: LARGE_VIDEO_MB,
  escapeHtml,
  fmtBytes,
  isModalOpen: modalIsOpen,
  beforeRender: () => {
    destroyObservers();
    releaseGridMedia();
  },
  afterCardsRendered: () => {
    updateReviewButtons();
    setupObservers();
  },
  updateSubInfo,
  applyActionButtons,
  applyWorkflowStatusToCard,
  onOpenItem: openModal,
  onToggleBatchItem: toggleBatchItem,
  onCardAction: handleCardAction,
  onDragItem: handleMediaDragStart,
});

const metadataPanel = createMetadataPanel({
  state,
  elements: {
    modal,
    modalImage,
    modalVideo,
    modalMetadata,
  },
  getText: () => t(),
  escapeHtml,
  fmtBytes,
  syncWorkflowStatusFromFullMetadata,
});

const modalViewer = createModalViewer({
  state,
  elements: {
    modal,
    modalContent,
    modalVideo,
    modalImage,
    modalMetadata,
    modalName,
    modalMeta,
    modalPrev,
    modalNext,
    modalVideoControls,
    modalVideoModeSeg,
    modalSlideshow,
    modalSlideshowFullscreen,
    modalImageUiToggle,
    modalVideoUiToggle,
    modalHiddenActions,
    modalHiddenExitFullscreen,
  },
  getText: () => t(),
  fmtBytes,
  setButtonLabel,
  getImageItems: currentImageItems,
  getVideoItems: currentVideoItems,
  hideFloatingPager,
  pauseInlinePlayback: pauseAllInline,
  resumeInlinePlayback: resumeVisibleInline,
  releaseMediaElement,
  updateGridPager,
  applyActionButtons,
  setControlsHidden: setModalControlsHidden,
  scheduleAutoHideControls,
  stopModalSlideshow: () => setModalSlideshowPlaying(false),
  loadMetadata: item => metadataPanel.load(item),
  showToast,
});

const slideshowController = createSlideshowController({
  state,
  elements: {
    modal,
    modalContent,
    modalImage,
    slideshow,
    slideshowImageA,
    slideshowImageB,
    slideshowName,
    slideshowCounter,
    slideshowInterval,
    slideshowEffect,
    slideshowFit,
    slideshowLoop,
    slideshowHiddenActions,
    slideshowUiToggle,
    slideshowUiShow,
    slideshowExitFullscreen,
  },
  getText: () => t(),
  getImageItems: currentImageItems,
  showModalImage,
  openModal,
  closeModal,
  hideFloatingPager,
  pauseInlinePlayback: pauseAllInline,
  resumeInlinePlayback: resumeVisibleInline,
  releaseMediaElement,
  updateGridPager,
  applyActionButtons,
  applyLanguage,
  scheduleAutoHideControls,
  compactText,
  labelText,
  showToast,
  updateFullscreenLabels,
});

function t() {
  return i18n[state.language] || i18n.en;
}

function labelText(key, en, zh) {
  return t()[key] || (state.language === "zh" ? zh : en);
}

function compactText(key, en) {
  const tx = t();
  return state.language === "en" ? en : (tx[key] || en);
}

function iconSvg(name) {
  return ICONS[name] || "";
}

function setButtonLabel(button, text, iconName, options = {}) {
  if (!button) return;
  const title = options.title || text;
  const iconOnly = options.iconOnly ?? state.buttonStyle === "icons";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.classList.toggle("icon-only", iconOnly);
  button.classList.toggle("icon-text", !!options.iconText);
  button.classList.toggle("filled-icon", iconName === "starFilled");
  if (options.iconText && iconName) {
    button.innerHTML = `${iconSvg(iconName)}<span>${escapeHtml(text)}</span>`;
    return;
  }
  if (iconOnly && iconName) {
    button.innerHTML = iconSvg(iconName);
  } else {
    button.textContent = text;
  }
}

function applyTheme() {
  document.body.classList.toggle("theme-light", state.theme === "light");
}

function applyFontSize() {
  document.body.classList.remove("font-size-small", "font-size-standard", "font-size-large");
  if (state.fontSize === "small") document.body.classList.add("font-size-small");
  if (state.fontSize === "standard") document.body.classList.add("font-size-standard");
  if (state.fontSize === "large") document.body.classList.add("font-size-large");
  fontSizeSeg.querySelectorAll("button").forEach(button => {
    button.classList.toggle("active", button.dataset.fontSize === state.fontSize);
  });
}

function updateContentAlignLabels() {
  const tx = t();
  const labels = {
    left: [tx.contentAlignLeft, "left"],
    center: [tx.contentAlignCenter, "alignCenter"],
    right: [tx.contentAlignRight, "right"],
  };
  [contentAlignSeg, modalContentAlignSeg].forEach(seg => {
    seg?.querySelectorAll("button[data-content-align]").forEach(button => {
      const [label, icon] = labels[button.dataset.contentAlign] || [button.textContent, "alignCenter"];
      setButtonLabel(button, label, icon, { iconOnly: seg === modalContentAlignSeg });
    });
  });
}

function applyContentAlign() {
  const align = ["left", "center", "right"].includes(state.contentAlign) ? state.contentAlign : "center";
  const sidebarWidth = document.body.classList.contains("sidebar-open") ? folderPanel.getBoundingClientRect().width : 0;
  const modalSideLayoutAvailable = window.innerWidth >= 1400;
  document.documentElement.style.setProperty("--sidebar-panel-width", `${Math.round(sidebarWidth)}px`);
  document.body.classList.remove("content-align-left", "content-align-center", "content-align-right");
  document.body.classList.add(`content-align-${align}`);
  contentAlignSeg.querySelectorAll("button[data-content-align]").forEach(button => {
    button.classList.toggle("active", button.dataset.contentAlign === align);
  });
  modalContentAlignSeg?.querySelectorAll("button[data-content-align]").forEach(button => {
    const sideButton = button.dataset.contentAlign !== "center";
    button.disabled = sideButton && !modalSideLayoutAvailable;
    button.classList.toggle("active", button.dataset.contentAlign === (modalSideLayoutAvailable ? align : "center"));
  });
}

function isModalFullscreen() {
  return document.fullscreenElement === modalContent;
}

function isSlideshowFullscreen() {
  return slideshowController.isFullscreen();
}

function updateFullscreenLabels() {
  const tx = t();
  const fullScreenText = labelText("fullScreen", "Full Screen", "完整屏幕");
  const exitFullScreenText = labelText("exitFullScreen", "Exit Full Screen", "退出完整屏幕");
  setButtonLabel(modalFullscreen, isModalFullscreen() ? tx.exitFullscreen : tx.fullscreen, isModalFullscreen() ? "fullscreenExit" : "fullscreen", { iconOnly: true });
  setButtonLabel(slideshowFullscreen, isSlideshowFullscreen() ? exitFullScreenText : fullScreenText, isSlideshowFullscreen() ? "fullscreenExit" : "fullscreen", { iconOnly: true });
  setButtonLabel(modalHiddenExitFullscreen, exitFullScreenText, "fullscreenExit", { iconOnly: true });
  modalHiddenExitFullscreen.classList.add("hidden");
  setButtonLabel(modalHiddenClose, tx.close, "close", { iconOnly: true });
  modalHiddenActions.classList.add("hidden");
  setButtonLabel(slideshowExitFullscreen, exitFullScreenText, "fullscreenExit", { iconOnly: true });
  slideshowExitFullscreen.classList.add("hidden");
  setButtonLabel(slideshowBackToPreview, labelText("backToPreview", "Back", "返回"), "back", { iconOnly: true });
  slideshowHiddenActions.classList.add("hidden");
}

function applyActionButtons() {
  const tx = t();
  const switchLanguageTitle = state.language === "en" ? "Switch to Chinese" : "切换到英文";
  const themeText = state.theme === "dark" ? labelText("lightTheme", "Light Theme", "亮色主题") : labelText("darkTheme", "Dark Theme", "暗色主题");
  document.body.classList.add("icon-buttons");
  setButtonLabel(settingsToggle, tx.settings, "settings", { iconOnly: true });
  setButtonLabel(trashToggle, state.showTrash ? tx.showMediaWall : tx.showRecycleFolder, "archiveTray", { iconOnly: true });
  trashToggle.classList.toggle("active", state.showTrash);
  setButtonLabel(folderPanelToggle, tx.folders, "sidebar", { iconOnly: true });
  setButtonLabel(pathHistoryToggle, tx.pathHistory, "list", { iconOnly: true });
  setButtonLabel(langToggle, tx.langToggle, "language", { iconOnly: false, iconText: true, title: switchLanguageTitle });
  setButtonLabel(themeToggle, themeText, state.theme === "dark" ? "sun" : "moon", { iconOnly: false, iconText: true });
  setButtonLabel(chooseFolderBtn, tx.chooseFolder, "folder", { iconOnly: true });
  setButtonLabel(scanBtn, tx.scan, "scan", { iconOnly: true });
  setButtonLabel(expandBtn, tx.expand, "fullscreen");
  setButtonLabel(exportCsvBtn, tx.exportCsv, "download", { iconOnly: false, iconText: true });
  setButtonLabel(clearHistoryBtn, tx.clearHistory, "trash", { iconOnly: false, iconText: true });
  setButtonLabel(pauseBtn, state.playingEnabled ? tx.pauseAll : tx.resume, state.playingEnabled ? "pause" : "play", { iconOnly: true });
  setButtonLabel(resetFiltersBtn, tx.resetFilters, "reset", { iconOnly: true });
  setButtonLabel(mediaFilterSeg.querySelector('[data-media-filter="all"]'), tx.allMedia, "grid", { iconOnly: true });
  setButtonLabel(mediaFilterSeg.querySelector('[data-media-filter="video"]'), tx.videosOnly, "film", { iconOnly: true });
  setButtonLabel(mediaFilterSeg.querySelector('[data-media-filter="image"]'), tx.imagesOnly, "image", { iconOnly: true });
  setButtonLabel(mediaFilterSeg.querySelector('[data-media-filter="favorites"]'), tx.favorites, state.mediaType === "favorites" ? "starFilled" : "star", { iconOnly: true });
  setButtonLabel(batchToggleBtn, state.batchMode ? tx.batchExit : tx.batch, "multiSelect", { iconOnly: true });
  setButtonLabel(batchSelectPageBtn, tx.batchSelectPage, "check", { iconOnly: false, title: tx.batchSelectPageTitle });
  setButtonLabel(batchClearBtn, tx.batchClear, "close", { iconOnly: false });
  setButtonLabel(batchFavoriteBtn, tx.batchFavorite, "starFilled", { iconOnly: true });
  setButtonLabel(batchUnfavoriteBtn, tx.batchUnfavorite, "star", { iconOnly: true });
  setButtonLabel(batchTrashBtn, tx.batchTrash, "trash", { iconOnly: true });
  setButtonLabel(batchExportBtn, tx.batchExport, "download", { iconOnly: true });
  setButtonLabel(batchExitBtn, tx.batchExit, "close", { iconOnly: true });
  setButtonLabel(topPagePrev, tx.pagePrevious, "left", { iconOnly: true });
  setButtonLabel(topPageNext, tx.pageNext, "right", { iconOnly: true });
  setButtonLabel(immersiveBtn, state.immersive ? tx.exitImmersive : tx.immersive, state.immersive ? "close" : "fullscreen", { iconOnly: true });
  updateContentAlignLabels();
  setButtonLabel(modalSlideshow, state.modalSlideshowPlaying ? tx.pause : tx.slideshow, state.modalSlideshowPlaying ? "pause" : "slideshow", { iconOnly: true });
  modalSlideshow.classList.toggle("primary", state.modalSlideshowPlaying);
  setButtonLabel(modalSlideshowFullscreen, tx.fullscreen, "fullscreen", { iconOnly: true });
  const modalItemFavorite = !!state.currentModalItem?.favorite;
  setButtonLabel(modalFavorite, modalItemFavorite ? tx.favorited : tx.favorite, modalItemFavorite ? "starFilled" : "star", { iconOnly: true });
  setButtonLabel(modalMoveTrash, tx.moveTrash, "trash", { iconOnly: true });
  setButtonLabel(modalOpenDefault, tx.openDefaultApp, "externalOpen", { iconOnly: true });
  setButtonLabel(modalOpenFolder, tx.showInFolder, "folder", { iconOnly: true });
  modalImageUiToggle.classList.add("hidden");
  modalVideoUiToggle.classList.add("hidden");
  setButtonLabel(modalUiShow, labelText("showUi", "Show UI", "显示控制"), "eye", { iconOnly: true });
  setButtonLabel(modalClose, tx.close, "close", { iconOnly: true });
  updateVideoModeUI();
  setButtonLabel(slideshowPrev, tx.prev, "left", { iconOnly: true });
  setButtonLabel(slideshowNext, tx.next, "right", { iconOnly: true });
  setButtonLabel(slideshowMoveTrash, tx.moveTrash, "trash", { iconOnly: true });
  setButtonLabel(slideshowPlay, state.slideshowPlaying ? tx.pause : tx.play, state.slideshowPlaying ? "pause" : "play", { iconOnly: true });
  slideshowUiToggle.classList.add("hidden");
  setButtonLabel(slideshowUiShow, labelText("showUi", "Show UI", "显示控制"), "eye", { iconOnly: true });
  setButtonLabel(slideshowClose, tx.close, "close", { iconOnly: true });
  document.querySelectorAll(".tiny-btn").forEach(btn => setButtonLabel(btn, tx.location, "folder", { iconOnly: true }));
  updateFavoritePathButton();
  updateDragAuthorizationUi();
  updateFullscreenLabels();
}

function showToast(message, ms = 2600) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), ms);
}

async function checkBackendCompatibility(showError = false) {
  try {
    const response = await fetch("/health", { cache: "no-store" });
    const data = await response.json();
    state.backendVersion = Number(data.api_version || 0);
    state.backendCapabilities = new Set(Array.isArray(data.capabilities) ? data.capabilities : []);
    state.backendCompatible = response.ok
      && data.ok === true
      && state.backendVersion === EXPECTED_API_VERSION
      && REQUIRED_BACKEND_CAPABILITIES.every(capability => state.backendCapabilities.has(capability));
  } catch {
    state.backendCompatible = false;
  }
  if (!state.backendCompatible && showError) showToast(t().backendRestartRequired, 7000);
  return state.backendCompatible;
}

async function ensureTrashBackend() {
  if (state.backendCompatible) return true;
  return checkBackendCompatibility(true);
}

function setBusy(isBusy) {
  scanBtn.disabled = isBusy;
  chooseFolderBtn.disabled = isBusy;
  setButtonLabel(scanBtn, isBusy ? t().scanning : t().scan, "scan", { iconOnly: true });
}

function applyLanguage() {
  const tx = t();
  document.documentElement.lang = tx.htmlLang;
  pathInput.placeholder = tx.pathPlaceholder;
  $("#folderPanelTitle").textContent = tx.folderPanelTitle;
  $("#folderFavoritesTitle").textContent = tx.folderFavorites;
  $("#folderDrivesTitle").textContent = tx.folderDrives;
  folderPanelClose.textContent = tx.close;
  folderPanelRefresh.textContent = tx.folderRefresh;
  chooseFolderBtn.textContent = tx.chooseFolder;
  scanBtn.textContent = tx.scan;
  expandBtn.textContent = tx.expand;
  langToggle.textContent = tx.langToggle;
  $("#rememberPathLabel").textContent = tx.rememberPath;
  $("#recursiveScanLabel").textContent = tx.recursive;
  $("#excludeRulesOpenLabel").textContent = tx.excludeRules;
  $("#excludeRulesTitle").textContent = tx.excludeRules;
  $("#excludeRulesEnabledLabel").textContent = tx.excludeEnabled;
  excludeKeywordInput.placeholder = tx.excludeKeywordPlaceholder;
  excludeKeywordAdd.textContent = tx.excludeAdd;
  $("#excludeScopeLabel").textContent = tx.excludeScope;
  excludeScopeSeg.querySelector('[data-exclude-scope="image"]').textContent = tx.excludeImagesOnly;
  excludeScopeSeg.querySelector('[data-exclude-scope="all"]').textContent = tx.excludeAllMedia;
  $("#excludeRulesNote").textContent = tx.excludeNote;
  excludeRulesSave.textContent = tx.excludeSave;
  excludeRulesCancel.textContent = tx.excludeCancel;
  excludeRulesClose.textContent = tx.close;
  $("#scanProtectionOpenLabel").textContent = tx.scanProtection;
  $("#scanProtectionTitle").textContent = tx.scanProtection;
  blockedScanPathInput.placeholder = tx.scanProtectionPathPlaceholder;
  blockedScanPathAdd.textContent = tx.scanProtectionAdd;
  $("#minScanVolumeLabel").textContent = tx.scanProtectionCapacity;
  minScanVolumeSelect.querySelector('[value="0"]').textContent = tx.scanProtectionNoLimit;
  $("#scanProtectionNote").textContent = tx.scanProtectionNote;
  scanProtectionSave.textContent = tx.excludeSave;
  scanProtectionCancel.textContent = tx.excludeCancel;
  scanProtectionClose.textContent = tx.close;
  searchInput.placeholder = tx.search;
  sizeFilterSelect.title = tx.sizeFilterTitle;
  sizeFilterSelect.querySelector('[value="all"]').textContent = tx.anySize;
  sizeFilterSelect.querySelector('[value="small"]').textContent = tx.smallFiles;
  sizeFilterSelect.querySelector('[value="medium"]').textContent = tx.mediumFiles;
  sizeFilterSelect.querySelector('[value="large"]').textContent = tx.largeFiles;
  dateFilterSelect.title = tx.dateFilterTitle;
  dateFilterSelect.querySelector('[value="all"]').textContent = tx.anyDate;
  dateFilterSelect.querySelector('[value="day"]').textContent = tx.lastDay;
  dateFilterSelect.querySelector('[value="week"]').textContent = tx.lastWeek;
  dateFilterSelect.querySelector('[value="month"]').textContent = tx.lastMonth;
  mediaFilterSeg.title = tx.mediaTypeTitle;
  mediaFilterSeg.querySelector('[data-media-filter="all"]').textContent = tx.allMedia;
  mediaFilterSeg.querySelector('[data-media-filter="video"]').textContent = tx.videosOnly;
  mediaFilterSeg.querySelector('[data-media-filter="image"]').textContent = tx.imagesOnly;
  mediaFilterSeg.querySelector('[data-media-filter="favorites"]').textContent = tx.favorites;
  sortSelect.title = tx.sortTitle;
  columnsSelect.title = tx.columnsTitle;
  pageSizeInput.title = tx.pageSizeTitle;
  $("#pageSizeLabel").textContent = tx.pageSizeLabelText;
  $("#wallAutoplayLabel").textContent = tx.wallAutoplay;
  $("#playLimitLabel").textContent = tx.wallPlayLimit;
  playLimitSelect.title = tx.wallPlayLimit;
  $("#previewLargeVideosLabel").textContent = tx.previewLargeVideos;
  $("#pauseWhenInactiveLabel").textContent = tx.pauseWhenInactive;
  $("#floatingPagerLabel").textContent = tx.floatingPager;
  $("#confirmTrashLabel").textContent = tx.confirmTrashSetting;
  trashConfirmTitle.textContent = tx.trashConfirmTitle;
  trashConfirmMessage.textContent = tx.trashConfirmMessage;
  trashConfirmDontAskLabel.textContent = tx.trashConfirmDontAsk;
  trashConfirmCancel.textContent = tx.close;
  trashConfirmOk.textContent = tx.trashConfirmMove;
  $("#settingsInterfaceTitle").textContent = tx.interfaceSettings;
  $("#fontSizeLabel").textContent = tx.fontSize;
  fontSizeSeg.title = tx.fontSize;
  fontSizeSeg.querySelector('[data-font-size="small"]').textContent = tx.fontSizeSmall;
  fontSizeSeg.querySelector('[data-font-size="standard"]').textContent = tx.fontSizeStandard;
  fontSizeSeg.querySelector('[data-font-size="large"]').textContent = tx.fontSizeLarge;
  $("#contentAlignLabel").textContent = tx.contentAlign;
  contentAlignSeg.title = tx.contentAlign;
  modalContentAlignSeg.title = tx.contentAlign;
  contentAlignSeg.querySelector('[data-content-align="center"]').textContent = tx.contentAlignCenter;
  contentAlignSeg.querySelector('[data-content-align="left"]').textContent = tx.contentAlignLeft;
  contentAlignSeg.querySelector('[data-content-align="right"]').textContent = tx.contentAlignRight;
  $("#settingsScanTitle").textContent = tx.scanSettings;
  $("#settingsDragTitle").textContent = tx.dragOutSettings;
  dragAuthorizeCurrentLabel.textContent = tx.dragAuthorizeCurrent;
  dragSettingsNote.textContent = tx.dragSettingsNote;
  $("#settingsPlaybackTitle").textContent = tx.playbackSettings;
  $("#settingsFiltersTitle").textContent = tx.filterSettings;
  $("#settingsActionsTitle").textContent = tx.actionSettings;
  exportCsvBtn.textContent = tx.exportCsv;
  pauseBtn.textContent = state.playingEnabled ? tx.pauseAll : tx.resume;
  immersiveBtn.textContent = state.immersive ? tx.exitImmersive : tx.immersive;
  modalSlideshow.textContent = state.modalSlideshowPlaying ? tx.pause : tx.slideshow;
  modalSlideshow.classList.toggle("primary", state.modalSlideshowPlaying);
  modalSlideshowFullscreen.textContent = tx.fullscreen;
  modalFavorite.textContent = tx.favorite;
  modalMoveTrash.textContent = tx.moveTrash;
  modalOpenDefault.textContent = tx.openDefaultApp;
  modalOpenFolder.textContent = tx.showInFolder;
  modalClose.textContent = tx.close;
  modalImageUiToggle.textContent = labelText("hideUi", "Hide UI", "隐藏控制");
  modalVideoModeSeg.querySelector('[data-video-mode="loop"]').textContent = tx.loopOne;
  modalVideoModeSeg.querySelector('[data-video-mode="sequence"]').textContent = tx.sequential;
  modalVideoModeSeg.querySelector('[data-video-mode="random"]').textContent = tx.randomPlay;
  applyActionButtons();
  modalVideoUiToggle.textContent = labelText("hideUi", "Hide UI", "隐藏控制");
  modalUiShow.textContent = labelText("showUi", "Show UI", "显示控制");
  slideshowClose.textContent = tx.close;
  slideshowPrev.textContent = tx.prev;
  slideshowNext.textContent = tx.next;
  slideshowMoveTrash.textContent = tx.moveTrash;
  slideshowPlay.textContent = state.slideshowPlaying ? tx.pause : tx.play;
  slideshowLoopLabel.textContent = tx.loop;
  updateFullscreenLabels();
  slideshowUiToggle.textContent = compactText("hideUi", "Hide");
  slideshowUiShow.textContent = labelText("showUi", "Show UI", "显示控制");
  slideshowEffect.querySelector('[value="none"]').textContent = tx.none;
  slideshowEffect.querySelector('[value="fade"]').textContent = tx.fade;
  slideshowEffect.querySelector('[value="slide"]').textContent = tx.slide;
  slideshowEffect.querySelector('[value="drift"]').textContent = tx.drift;
  slideshowEffect.querySelector('[value="random"]').textContent = tx.random;
  slideshowFit.querySelector('[value="contain"]').textContent = tx.contain;
  slideshowFit.querySelector('[value="cover"]').textContent = tx.cover;
  for (const opt of sortSelect.options) {
    opt.textContent = tx.sortOptions[opt.value] || opt.textContent;
  }
  [...columnsSelect.options].forEach(opt => {
    opt.textContent = tx.colLabel(opt.value);
  });
  $("#columnsAutoplayGroup").label = tx.columnsAutoplay;
  $("#columnsStaticGroup").label = tx.columnsStatic;
  [...playLimitSelect.options].forEach(opt => {
    opt.textContent = tx.playLimitOptions?.[opt.value] || opt.value;
  });
  trashViewTitle.textContent = tx.recycleFolder;
  trashSelectAllBtn.textContent = tx.recycleSelectAll;
  trashRestoreBtn.textContent = tx.recycleRestore;
  trashSystemBtn.textContent = tx.recycleSystemTrash;
  pageSizeInput.setAttribute("aria-label", tx.pageSizeTitle);
  updateMediaFilterUI();
  document.querySelectorAll(".tiny-btn").forEach(btn => btn.textContent = tx.location);
  applyTheme();
  applyContentAlign();
  applyActionButtons();
  updateReviewButtons();
  updateSubInfo();
  updateGridPager();
  updateExcludeRulesSummary();
  updateScanProtectionSummary();
  renderDragRootSettings();
  updateDragAuthorizationUi();
  if (!excludeRulesDialog.classList.contains("hidden")) renderExcludeRulesDraft();
  if (state.currentModalItem) refreshModalMetadataPanel();
}

function applyLayout() {
  const cols = Number(state.columns) || 6;
  const gap = COLUMN_GAPS[cols] || 18;
  const contentWidth = getContentWidthRule();
  const actionSize = Math.max(18, Math.min(32, Math.round((COLUMN_WIDTHS[cols] || 220) * 0.16)));
  applyContentAlign();
  document.documentElement.style.setProperty("--columns", cols);
  document.documentElement.style.setProperty("--gap", `${gap}px`);
  document.documentElement.style.setProperty("--content-width", contentWidth);
  document.documentElement.style.setProperty("--card-action-size", `${actionSize}px`);
  document.body.classList.toggle("dense-grid", cols >= 10);
  columnsSelect.value = String(cols);
  pageSizeInput.value = String(state.pageSize);
  playLimitSelect.value = String(state.playLimit);
  updateSubInfo();
  scheduleUpdatePlaying();
}

function getContentWidthRule() {
  if (document.body.classList.contains("sidebar-open")) return "calc(100% - 24px)";
  const width = window.innerWidth || 1600;
  if (state.contentAlign !== "center" && width >= 1400) return "calc(50vw - 42px)";
  if (width >= 2400) return "75vw";
  if (width >= 1600) return "86vw";
  return "calc(100% - 24px)";
}

function setSettingsMenuOpen(open) {
  settingsMenu.classList.toggle("hidden", !open);
  settingsToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleSettingsMenu() {
  setSettingsMenuOpen(settingsMenu.classList.contains("hidden"));
}

function cleanExcludeKeywords(keywords) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(keywords) ? keywords : []) {
    const keyword = String(value || "").trim().slice(0, 80);
    const key = keyword.toLocaleLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    result.push(keyword);
    if (result.length >= 30) break;
  }
  return result;
}

function updateExcludeRulesSummary() {
  const count = state.filenameExcludeKeywords.length;
  excludeRulesCount.textContent = String(count);
  excludeRulesOpen.classList.toggle("inactive", !state.filenameExcludeEnabled);
}

function renderExcludeRulesDraft() {
  if (!excludeRulesDraft) return;
  excludeRulesEnabled.checked = excludeRulesDraft.enabled;
  excludeKeywordList.innerHTML = "";
  if (!excludeRulesDraft.keywords.length) {
    const empty = document.createElement("div");
    empty.className = "exclude-keyword-empty";
    empty.textContent = t().excludeEmpty;
    excludeKeywordList.appendChild(empty);
  } else {
    for (const keyword of excludeRulesDraft.keywords) {
      const chip = document.createElement("span");
      chip.className = "exclude-keyword-chip";
      const text = document.createElement("span");
      text.textContent = keyword;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.innerHTML = ICONS.close;
      remove.title = t().excludeRemove;
      remove.setAttribute("aria-label", t().excludeRemove);
      remove.addEventListener("click", () => {
        excludeRulesDraft.keywords = excludeRulesDraft.keywords.filter(item => item !== keyword);
        renderExcludeRulesDraft();
      });
      chip.append(text, remove);
      excludeKeywordList.appendChild(chip);
    }
  }
  excludeScopeSeg.querySelectorAll("button[data-exclude-scope]").forEach(button => {
    button.classList.toggle("active", button.dataset.excludeScope === excludeRulesDraft.scope);
  });
  excludeKeywordInput.disabled = !excludeRulesDraft.enabled;
  excludeKeywordAdd.disabled = !excludeRulesDraft.enabled;
  excludeScopeSeg.classList.toggle("disabled", !excludeRulesDraft.enabled);
}

function openExcludeRulesDialog() {
  excludeRulesDraft = {
    enabled: state.filenameExcludeEnabled,
    keywords: [...state.filenameExcludeKeywords],
    scope: state.filenameExcludeScope,
  };
  excludeKeywordInput.value = "";
  setSettingsMenuOpen(false);
  excludeRulesDialog.classList.remove("hidden");
  renderExcludeRulesDraft();
  setTimeout(() => excludeKeywordInput.focus(), 0);
}

function closeExcludeRulesDialog() {
  excludeRulesDialog.classList.add("hidden");
  excludeRulesDraft = null;
}

function addExcludeKeyword() {
  if (!excludeRulesDraft || !excludeRulesDraft.enabled) return;
  const keyword = excludeKeywordInput.value.trim().slice(0, 80);
  if (!keyword) return;
  const duplicate = excludeRulesDraft.keywords.some(item => item.toLocaleLowerCase() === keyword.toLocaleLowerCase());
  if (duplicate) {
    showToast(t().excludeDuplicate, 1800);
    return;
  }
  if (excludeRulesDraft.keywords.length >= 30) return;
  excludeRulesDraft.keywords.push(keyword);
  excludeKeywordInput.value = "";
  renderExcludeRulesDraft();
  excludeKeywordInput.focus();
}

async function saveExcludeRules() {
  if (!excludeRulesDraft) return;
  const previous = {
    enabled: state.filenameExcludeEnabled,
    keywords: state.filenameExcludeKeywords,
    scope: state.filenameExcludeScope,
  };
  state.filenameExcludeEnabled = excludeRulesDraft.enabled;
  state.filenameExcludeKeywords = cleanExcludeKeywords(excludeRulesDraft.keywords);
  state.filenameExcludeScope = excludeRulesDraft.scope === "all" ? "all" : "image";
  if (!await saveSettingsSoft()) {
    state.filenameExcludeEnabled = previous.enabled;
    state.filenameExcludeKeywords = previous.keywords;
    state.filenameExcludeScope = previous.scope;
    showToast(t().configFail, 2600);
    return;
  }
  closeExcludeRulesDialog();
  updateExcludeRulesSummary();
  showToast(t().excludeSaved, 2200);
}

function cleanBlockedScanPaths(paths) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(paths) ? paths : []) {
    const path = normalizePathText(String(value || "")).trim().slice(0, 260);
    const key = path.toLocaleLowerCase();
    if (!path || seen.has(key)) continue;
    seen.add(key);
    result.push(path);
    if (result.length >= 30) break;
  }
  return result;
}

function updateScanProtectionSummary() {
  const pathCount = state.blockedScanPaths.length;
  const capacity = state.minScanVolumeGb > 0 ? `${state.minScanVolumeGb} GB` : t().scanProtectionNoLimit;
  scanProtectionCount.textContent = pathCount ? `${pathCount} · ${capacity}` : capacity;
}

function renderScanProtectionDraft() {
  if (!scanProtectionDraft) return;
  blockedScanPathList.innerHTML = "";
  if (!scanProtectionDraft.paths.length) {
    const empty = document.createElement("div");
    empty.className = "exclude-keyword-empty";
    empty.textContent = t().scanProtectionEmpty;
    blockedScanPathList.appendChild(empty);
  } else {
    for (const path of scanProtectionDraft.paths) {
      const chip = document.createElement("span");
      chip.className = "exclude-keyword-chip";
      const text = document.createElement("span");
      text.textContent = path;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.innerHTML = ICONS.close;
      remove.title = t().scanProtectionRemove;
      remove.setAttribute("aria-label", t().scanProtectionRemove);
      remove.addEventListener("click", () => {
        scanProtectionDraft.paths = scanProtectionDraft.paths.filter(item => item !== path);
        renderScanProtectionDraft();
      });
      chip.append(text, remove);
      blockedScanPathList.appendChild(chip);
    }
  }
  minScanVolumeSelect.value = String(scanProtectionDraft.minVolumeGb);
}

function openScanProtectionDialog() {
  scanProtectionDraft = {
    paths: [...state.blockedScanPaths],
    minVolumeGb: state.minScanVolumeGb,
  };
  blockedScanPathInput.value = "";
  setSettingsMenuOpen(false);
  scanProtectionDialog.classList.remove("hidden");
  renderScanProtectionDraft();
  setTimeout(() => blockedScanPathInput.focus(), 0);
}

function closeScanProtectionDialog() {
  scanProtectionDialog.classList.add("hidden");
  scanProtectionDraft = null;
}

function addBlockedScanPath() {
  if (!scanProtectionDraft) return;
  const path = normalizePathText(blockedScanPathInput.value).trim().slice(0, 260);
  if (!path) return;
  if (scanProtectionDraft.paths.some(item => item.toLocaleLowerCase() === path.toLocaleLowerCase())) {
    showToast(t().scanProtectionDuplicate, 1800);
    return;
  }
  if (scanProtectionDraft.paths.length >= 30) return;
  scanProtectionDraft.paths.push(path);
  blockedScanPathInput.value = "";
  renderScanProtectionDraft();
  blockedScanPathInput.focus();
}

async function saveScanProtection() {
  if (!scanProtectionDraft) return;
  const previousPaths = state.blockedScanPaths;
  const previousCapacity = state.minScanVolumeGb;
  state.blockedScanPaths = cleanBlockedScanPaths(scanProtectionDraft.paths);
  state.minScanVolumeGb = Math.max(0, Math.min(1024, Number(scanProtectionDraft.minVolumeGb) || 0));
  if (!await saveSettingsSoft()) {
    state.blockedScanPaths = previousPaths;
    state.minScanVolumeGb = previousCapacity;
    showToast(t().configFail, 2600);
    return;
  }
  closeScanProtectionDialog();
  updateScanProtectionSummary();
  showToast(t().scanProtectionSaved, 2200);
}

function updateSubInfo() {
  const tx = t();
  if (state.showTrash) {
    subInfo.classList.add("hidden");
    subInfo.textContent = "";
    return;
  }
  if (!state.all.length && !state.scannedPath) {
    subInfo.classList.add("hidden");
    subInfo.textContent = "";
    return;
  }
  subInfo.classList.remove("hidden");
  const favCount = state.all.filter(item => item.favorite).length;
  const pages = gridPageCount();
  const pageText = pages > 1 ? ` · ${t().pageStatus(state.gridPage + 1, pages)}` : "";
  const excludedText = state.lastExcludedCount > 0 ? ` · ${state.lastExcludedCount} ${state.language === "zh" ? "项已排除" : "excluded"}` : "";
  const perfText = state.perf ? ` · ${tx.perfInfo(state.perf)}` : "";
  subInfo.textContent = `${state.view.length} / ${state.all.length} ${tx.items}${pageText} · ${tx.favorites} ${favCount}${excludedText}${perfText}`;
}

function sortItems(items, mode) {
  if (mode === "random") return shuffle(items);
  const arr = [...items];
  const locale = state.language === "zh" ? "zh-CN" : "en";
  if (mode === "mtime_desc") arr.sort((a, b) => b.mtime - a.mtime);
  if (mode === "mtime_asc") arr.sort((a, b) => a.mtime - b.mtime);
  if (mode === "name_asc") arr.sort((a, b) => a.name.localeCompare(b.name, locale));
  if (mode === "name_desc") arr.sort((a, b) => b.name.localeCompare(a.name, locale));
  if (mode === "path_asc") arr.sort((a, b) => String(a.rel || a.name).localeCompare(String(b.rel || b.name), locale));
  if (mode === "path_desc") arr.sort((a, b) => String(b.rel || b.name).localeCompare(String(a.rel || a.name), locale));
  if (mode === "size_desc") arr.sort((a, b) => b.size_mb - a.size_mb);
  if (mode === "size_asc") arr.sort((a, b) => a.size_mb - b.size_mb);
  return arr;
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function applyFilters(resetPage = true) {
  const q = searchInput.value.trim().toLowerCase();
  let items = state.all;
  if (q) items = items.filter(v => v.name.toLowerCase().includes(q) || v.rel.toLowerCase().includes(q));
  if (state.mediaType === "favorites") items = items.filter(v => v.favorite);
  if (state.sizeFilter === "small") items = items.filter(v => Number(v.size_mb) < 10);
  if (state.sizeFilter === "medium") items = items.filter(v => Number(v.size_mb) >= 10 && Number(v.size_mb) < 50);
  if (state.sizeFilter === "large") items = items.filter(v => Number(v.size_mb) >= 50);
  const now = Date.now() / 1000;
  if (state.dateFilter === "day") items = items.filter(v => now - Number(v.mtime) <= 86400);
  if (state.dateFilter === "week") items = items.filter(v => now - Number(v.mtime) <= 86400 * 7);
  if (state.dateFilter === "month") items = items.filter(v => now - Number(v.mtime) <= 86400 * 30);
  if (state.mediaType !== "all" && state.mediaType !== "favorites") items = items.filter(v => v.type === state.mediaType);
  state.view = sortItems(items, sortSelect.value);
  if (resetPage) state.gridPage = 0;
  renderGrid();
  saveSettingsSoft();
}

function resetFilters() {
  searchInput.value = "";
  state.reviewFilter = "all";
  state.sizeFilter = "all";
  state.dateFilter = "all";
  state.mediaType = "all";
  sizeFilterSelect.value = "all";
  dateFilterSelect.value = "all";
  updateMediaFilterUI();
  applyFilters();
  showToast(t().filtersReset);
}

function gridPageCount() {
  return gridController.pageCount();
}

function shouldShowPager() {
  return gridController.shouldShowPager();
}

function modalIsOpen() {
  return !modal.classList.contains("hidden") || !slideshow.classList.contains("hidden");
}

function positionFloatingPager() {
  gridController.positionFloatingPager();
}

function showFloatingPagerTemporarily(ms = 1700) {
  gridController.showFloatingPagerTemporarily(ms);
}

function hideFloatingPager() {
  gridController.hideFloatingPager();
}

function updateGridPager() {
  gridController.updatePager();
}

function setGridPage(page) {
  gridController.setPage(page);
}

function renderEmptyState() {
  gridController.renderEmptyState();
}

function renderGrid() {
  gridController.render();
}

function updateReviewButtons() {
  const tx = t();
  document.querySelectorAll(".video-card").forEach(card => {
    const item = card._mediaItem || state.all.find(v => v.key === card.dataset.key);
    if (!item) return;
    const favoriteBtn = card.querySelector('[data-card-action="favorite"]');
    const copyPathBtn = card.querySelector('[data-card-action="copy-path"]');
    const openFolderBtn = card.querySelector('[data-card-action="open-folder"]');
    const trashBtn = card.querySelector('[data-card-action="trash"]');
    const batchBtn = card.querySelector("[data-batch-select]");
    const moreToggle = card.querySelector(".card-more-toggle");
    const moreCopyPathBtn = card.querySelector('.card-more-menu [data-card-action="copy-path"]');
    const moreOpenFolderBtn = card.querySelector('.card-more-menu [data-card-action="open-folder"]');
    if (favoriteBtn) {
      setButtonLabel(favoriteBtn, item.favorite ? tx.favorited : tx.favorite, item.favorite ? "starFilled" : "star", { iconOnly: true });
      favoriteBtn.classList.toggle("active", !!item.favorite);
    }
    if (copyPathBtn) setButtonLabel(copyPathBtn, tx.copyFullPath, "copyPath", { iconOnly: true });
    if (openFolderBtn) setButtonLabel(openFolderBtn, tx.showInFolder, "folder", { iconOnly: true });
    if (trashBtn) setButtonLabel(trashBtn, tx.moveTrash, "trash", { iconOnly: true });
    if (moreToggle) setButtonLabel(moreToggle, tx.moreActions, "more", { iconOnly: true });
    if (moreCopyPathBtn) setButtonLabel(moreCopyPathBtn, tx.copyFullPath, "copyPath", { iconOnly: true });
    if (moreOpenFolderBtn) setButtonLabel(moreOpenFolderBtn, tx.showInFolder, "folder", { iconOnly: true });
    if (batchBtn) {
      setButtonLabel(batchBtn, state.batchSelected.has(item.key) ? tx.batchSelectedItem : tx.batchSelectItem, state.batchSelected.has(item.key) ? "checkboxChecked" : "checkbox", { iconOnly: true });
      batchBtn.classList.toggle("active", state.batchSelected.has(item.key));
    }
    card.classList.toggle("is-batch-selected", state.batchSelected.has(item.key));
  });
  updateBatchUI();
}

function updateMediaFilterUI() {
  if (state.reviewFilter === "selected") state.reviewFilter = "all";
  if (!["all", "video", "image", "favorites"].includes(state.mediaType)) state.mediaType = "all";
  mediaFilterSeg.querySelectorAll("button[data-media-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mediaFilter === state.mediaType);
  });
  setButtonLabel(
    mediaFilterSeg.querySelector('[data-media-filter="favorites"]'),
    t().favorites,
    state.mediaType === "favorites" ? "starFilled" : "star",
    { iconOnly: true },
  );
}

function currentPageItems() {
  return gridController.currentPageItems();
}

function selectedBatchItems() {
  return state.all.filter(item => state.batchSelected.has(item.key));
}

function setBatchMode(enabled) {
  state.batchMode = !!enabled;
  document.body.classList.toggle("batch-mode", state.batchMode);
  if (!state.batchMode) state.batchSelected.clear();
  updateBatchUI();
  updateReviewButtons();
  applyActionButtons();
}

function updateBatchUI() {
  const count = state.batchSelected.size;
  batchBar.classList.toggle("hidden", !state.batchMode);
  batchInfo.textContent = t().batchInfo(count);
  batchToggleBtn.classList.toggle("active", state.batchMode);
  batchSelectPageBtn.disabled = state.batchBusy || !state.batchMode || !state.view.length;
  batchClearBtn.disabled = state.batchBusy || !count;
  batchFavoriteBtn.disabled = state.batchBusy || !count;
  batchUnfavoriteBtn.disabled = state.batchBusy || !count;
  batchTrashBtn.disabled = state.batchBusy || !count;
  batchExportBtn.disabled = state.batchBusy || !count;
  batchExitBtn.disabled = state.batchBusy;
}

function toggleBatchItem(key) {
  if (!state.batchMode) return;
  if (state.batchSelected.has(key)) state.batchSelected.delete(key);
  else state.batchSelected.add(key);
  updateReviewButtons();
}

function selectCurrentPageForBatch() {
  if (state.batchBusy) return;
  if (!state.batchMode) setBatchMode(true);
  currentPageItems().forEach(item => state.batchSelected.add(item.key));
  updateReviewButtons();
}

function clearBatchSelection() {
  if (state.batchBusy) return;
  state.batchSelected.clear();
  updateReviewButtons();
}

function syncReviewItemState(item, review) {
  item.favorite = !!review.favorite;
  item.selected = !!review.selected;
}

function refreshAfterFavoriteChange(forceFilter = false) {
  if (forceFilter || state.mediaType === "favorites") {
    applyFilters(false);
    return;
  }
  updateReviewButtons();
  updateSubInfo();
  updateBatchUI();
}

async function setBatchFavorite(value) {
  if (state.batchBusy) return;
  const items = selectedBatchItems();
  if (!items.length) {
    showToast(t().batchNoSelection);
    return;
  }
  let done = 0;
  const errors = [];
  state.batchBusy = true;
  updateBatchUI();
  showToast(t().batchWorking, 1800);
  try {
    for (const item of items) {
      try {
        const res = await apiFetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: item.key, favorite: value }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || t().reviewFail);
        const nextReview = {
          favorite: !!data.review.favorite,
          selected: !!data.review.selected,
        };
        item.favorite = nextReview.favorite;
        item.selected = nextReview.selected;
        done += 1;
      } catch (err) {
        console.error(err);
        errors.push(err.message || t().reviewFail);
      }
    }
  } finally {
    state.batchBusy = false;
  }
  refreshAfterFavoriteChange();
  if (errors.length && done) showToast(t().batchPartial(done, errors.length, errors[0]), 6200);
  else if (errors.length) showToast(t().batchFailed(errors[0]), 6200);
  else showToast(t().batchDone(done));
}

async function moveBatchToTrash() {
  if (state.batchBusy) return;
  const items = selectedBatchItems();
  if (!items.length) {
    showToast(t().batchNoSelection);
    return;
  }
  if (!(await ensureTrashBackend())) return;
  if (!(await requestTrashConfirmation(items.length))) return;
  let done = 0;
  const errors = [];
  state.batchBusy = true;
  updateBatchUI();
  showToast(t().batchWorking, 1800);
  const batchStart = performance.now();
  try {
    const releaseTimings = await releaseMediaBeforeBatchAction(items);
    const res = await apiFetch("/api/file-actions/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "move_trash",
        rels: items.map(item => item.rel),
        scan_id: state.scanId || "",
        confirm: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().fileActionFail);
    const successRels = new Set((data.results || []).filter(result => result.ok).map(result => result.rel));
    const succeeded = items.filter(item => successRels.has(item.rel));
    done = succeeded.length;
    mergeTrashItems((data.results || []).filter(result => result.ok).map(result => result.item));
    (data.results || []).filter(result => !result.ok).forEach(result => errors.push(result.error || t().fileActionFail));
    if (succeeded.length) removeItemsFromState(succeeded);
    if (errors.length) renderGrid();
    console.info("[delete-perf] batch release", releaseTimings);
  } catch (err) {
    console.error(err);
    errors.push(err.message || t().fileActionFail);
  } finally {
    setPlaybackBlocked(items, false);
    state.batchBusy = false;
  }
  console.info("[delete-perf] batch summary", {
    count: items.length,
    done,
    failed: errors.length,
    total_ms: Math.round(performance.now() - batchStart),
    ui_refresh: "patched-visible-cards",
  });
  updateBatchUI();
  if (errors.length && done) showToast(t().batchPartial(done, errors.length, errors[0]), 6200);
  else if (errors.length) showToast(t().batchFailed(errors[0]), 6200);
  else showToast(t().batchDone(done));
}

function formatTrashBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function mergeTrashItems(items) {
  const next = new Map(state.trashItems.map(item => [item.id, item]));
  items.filter(item => item?.id).forEach(item => next.set(item.id, item));
  state.trashItems = [...next.values()].sort((a, b) => String(b.deleted_at || "").localeCompare(String(a.deleted_at || "")));
  if (state.showTrash) renderTrashView();
}

function renderTrashView() {
  const tx = t();
  const validIds = new Set(state.trashItems.map(item => item.id));
  const visibleItems = ["video", "image"].includes(state.mediaType)
    ? state.trashItems.filter(item => item.type === state.mediaType)
    : state.trashItems;
  state.trashSelected = new Set([...state.trashSelected].filter(id => validIds.has(id)));
  trashViewInfo.textContent = visibleItems.length ? tx.recycleItems(visibleItems.length) : tx.recycleEmpty;
  trashSelectAllBtn.disabled = state.trashBusy || !visibleItems.length;
  trashRestoreBtn.disabled = state.trashBusy || !state.trashSelected.size;
  trashSystemBtn.disabled = state.trashBusy || !state.trashSelected.size;
  trashSelectAllBtn.classList.toggle("active", visibleItems.length > 0 && visibleItems.every(item => state.trashSelected.has(item.id)));
  trashList.replaceChildren();
  if (!visibleItems.length) {
    const empty = document.createElement("div");
    empty.className = "trash-empty";
    empty.textContent = tx.recycleEmpty;
    trashList.append(empty);
    return;
  }
  for (const item of visibleItems) {
    const card = document.createElement("article");
    card.className = "trash-card";
    card.classList.toggle("is-selected", state.trashSelected.has(item.id));
    const media = document.createElement("div");
    media.className = "trash-card-media";
    const trashPath = `_video_wall_trash/${item.trash_rel || ""}`;
    const mediaUrl = `/media?scan_id=${encodeURIComponent(state.scanId || "")}&path=${encodeURIComponent(trashPath)}`;
    const type = document.createElement("span");
    type.className = "trash-card-type";
    type.textContent = item.type === "video" ? tx.videosOnly : tx.imagesOnly;
    if (item.type === "video") {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = mediaUrl;
      video.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.1, video.duration / 20);
      });
      video.addEventListener("play", () => video.pause());
      media.append(video);
    } else {
      const image = document.createElement("img");
      image.src = mediaUrl;
      image.alt = item.name || item.id;
      image.loading = "lazy";
      image.decoding = "async";
      media.append(image);
    }
    const select = document.createElement("input");
    select.className = "trash-card-select";
    select.type = "checkbox";
    select.checked = state.trashSelected.has(item.id);
    select.setAttribute("aria-label", item.name || item.id);
    select.addEventListener("click", event => event.stopPropagation());
    select.addEventListener("change", () => {
      if (select.checked) state.trashSelected.add(item.id);
      else state.trashSelected.delete(item.id);
      renderTrashView();
    });
    media.append(type, select);
    const info = document.createElement("div");
    info.className = "trash-card-info";
    const name = document.createElement("strong");
    name.title = item.name || item.id;
    name.textContent = item.name || item.id;
    info.append(name);
    const actions = document.createElement("div");
    actions.className = "trash-card-actions";
    const restore = document.createElement("button");
    restore.className = "btn ghost";
    restore.disabled = state.trashBusy;
    setButtonLabel(restore, tx.recycleRestore, "restore", { iconOnly: true, title: tx.recycleRestoreTitle });
    restore.addEventListener("click", event => {
      event.stopPropagation();
      runTrashAction("restore", [item.id]);
    });
    const systemTrash = document.createElement("button");
    systemTrash.className = "btn ghost danger";
    systemTrash.disabled = state.trashBusy;
    setButtonLabel(systemTrash, tx.recycleSystemTrash, "trash", { iconOnly: true, title: tx.recycleSystemTitle });
    systemTrash.addEventListener("click", event => {
      event.stopPropagation();
      runTrashAction("system_trash", [item.id]);
    });
    actions.append(restore, systemTrash);
    info.append(actions);
    card.append(media, info);
    card.addEventListener("click", () => {
      if (state.trashSelected.has(item.id)) state.trashSelected.delete(item.id);
      else state.trashSelected.add(item.id);
      renderTrashView();
    });
    trashList.append(card);
  }
}

async function loadTrashView() {
  if (!state.scanId && !state.scannedPath) return;
  if (!(await ensureTrashBackend())) return;
  try {
    const res = await fetch(`/api/trash/list?scan_id=${encodeURIComponent(state.scanId || "")}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().recycleActionFailed(t().unknown));
    state.trashItems = Array.isArray(data.items) ? data.items : [];
    renderTrashView();
  } catch (err) {
    console.error(err);
    showToast(err.message || t().recycleActionFailed(t().unknown), 5200);
  }
}

function setTrashView(visible) {
  if (visible && !state.scannedPath) {
    showToast(t().needPath);
    return;
  }
  state.showTrash = !!visible;
  if (state.showTrash) {
    pauseAllInline();
    setBatchMode(false);
    batchBar.classList.add("hidden");
    [grid, gridPager, floatingPager, emptyState, subInfo].forEach(node => node.classList.add("hidden"));
    trashView.classList.remove("hidden");
    loadTrashView();
  } else {
    trashView.classList.add("hidden");
    grid.classList.remove("hidden");
    subInfo.classList.toggle("hidden", !state.scannedPath);
    if (state.mediaNeedsRender) {
      state.mediaNeedsRender = false;
      applyFilters(false);
    } else {
      updateGridPager();
      updateSubInfo();
      if (!state.view.length) renderEmptyState();
      scheduleUpdatePlaying();
    }
  }
  applyActionButtons();
}

async function runTrashAction(action, ids) {
  const selected = [...new Set(ids)].filter(Boolean);
  if (!selected.length || state.trashBusy) return;
  if (!(await ensureTrashBackend())) return;
  if (action === "system_trash" && !(await requestTrashConfirmation(selected.length, {
    title: t().recycleSystemTitle,
    message: t().recycleSystemConfirm(selected.length),
    confirmText: t().recycleSystemTrash,
    allowDontAsk: false,
  }))) return;
  state.trashBusy = true;
  renderTrashView();
  try {
    const res = await apiFetch("/api/trash/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: selected, scan_id: state.scanId || "" }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().recycleActionFailed(t().unknown));
    const successes = (data.results || []).filter(result => result.ok);
    const removedIds = new Set(successes.map(result => result.id));
    if (action === "restore") {
      successes.map(result => result.item?.media).filter(Boolean).forEach(media => state.all.push(media));
      if (successes.length) state.mediaNeedsRender = true;
    }
    state.trashItems = state.trashItems.filter(item => !removedIds.has(item.id));
    removedIds.forEach(id => state.trashSelected.delete(id));
    const errors = (data.results || []).filter(result => !result.ok);
    if (errors.length) showToast(t().recycleActionFailed(errors[0].error || t().unknown), 5200);
    else showToast(t().recycleActionDone(successes.length));
  } catch (err) {
    console.error(err);
    showToast(err.message || t().recycleActionFailed(t().unknown), 5200);
  } finally {
    state.trashBusy = false;
    renderTrashView();
  }
}

async function toggleReview(item, field) {
  const nextValue = !item[field];
  const payload = { key: item.key, [field]: nextValue };
  try {
    const res = await apiFetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().reviewFail);
    syncReviewItemState(item, data.review);
    refreshAfterFavoriteChange();
    showToast(t().reviewSaved);
  } catch (err) {
    console.error(err);
    showToast(t().reviewFail, 3600);
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportCsv(items = state.view, prefix = "video-wall-export") {
  if (!items.length) {
    showToast(t().exportEmpty);
    return;
  }
  const headers = ["name", "type", "relative_path", "size_mb", "favorite", "selected"];
  const rows = items.map(item => [
    item.name,
    item.type || "video",
    item.full_path || item.key || item.rel,
    Number(item.size_mb).toFixed(2),
    item.favorite ? "yes" : "no",
    item.selected ? "yes" : "no",
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prefix}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(t().exportDone(rows.length));
}

function exportBatchCsv() {
  if (state.batchBusy) return;
  const items = selectedBatchItems();
  if (!items.length) {
    showToast(t().batchNoSelection);
    return;
  }
  exportCsv(items, "video-wall-batch-export");
}

let loadObserver = null;
let workflowObserver = null;

function resetWorkflowStatusState() {
  workflowStatusController?.reset();
}

function applyWorkflowStatusToCard(card, item) {
  workflowStatusController?.applyToCard(card, item);
}

function queueWorkflowStatusForCard(card) {
  workflowStatusController?.queueCard(card);
}

function syncWorkflowStatusFromFullMetadata(item, metadata) {
  workflowStatusController?.syncFromFullMetadata(item, metadata);
}

function destroyObservers() {
  if (loadObserver) loadObserver.disconnect();
  if (workflowObserver) workflowObserver.disconnect();
  loadObserver = null;
  workflowObserver = null;
  playbackController?.destroyObservers();
}

function releaseMediaElement(media) {
  if (!media) return;
  if (media.tagName === "VIDEO") media.pause();
  if (media.getAttribute("src")) {
    media.removeAttribute("src");
    if (media.tagName === "VIDEO") media.load();
  }
}

function releaseGridMedia() {
  document.querySelectorAll(".video-wrap img.media-image").forEach(releaseMediaElement);
  if (playbackController) playbackController.releaseGridMedia();
  else document.querySelectorAll(".video-wrap video").forEach(releaseMediaElement);
  state.perf.loadedMedia = 0;
  state.perf.warmVideos = 0;
  state.perf.activeVideos = 0;
}

function setupObservers() {
  const images = [...document.querySelectorAll(".video-wrap img.media-image")];
  const videos = [...document.querySelectorAll(".video-wrap video")];
  const cards = [...document.querySelectorAll(".video-card")];

  workflowObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      queueWorkflowStatusForCard(entry.target);
      workflowObserver.unobserve(entry.target);
    }
  }, { root: null, rootMargin: "420px 0px", threshold: .01 });

  loadObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const image = entry.target;
      if (entry.isIntersecting) ensureSrc(image);
      else pauseAndRelease(image);
    }
  }, { root: null, rootMargin: "320px 0px", threshold: .01 });

  for (const image of images) loadObserver.observe(image);
  for (const card of cards) workflowObserver.observe(card);
  playbackController?.observe(videos);
}

function countLoadedMedia() {
  return document.querySelectorAll(".video-wrap video[src], .video-wrap img.media-image[src]").length;
}

function syncLoadedMediaStat() {
  if (state.loadedStatTimer) return;
  state.loadedStatTimer = requestAnimationFrame(() => {
    state.loadedStatTimer = null;
    state.perf.loadedMedia = countLoadedMedia();
    updateSubInfo();
  });
}

function syncLoadedMediaStatNow() {
  if (state.loadedStatTimer) {
    cancelAnimationFrame(state.loadedStatTimer);
    state.loadedStatTimer = null;
  }
  state.perf.loadedMedia = countLoadedMedia();
  updateSubInfo();
}

function ensureSrc(media) {
  if (!media.getAttribute("src") && media.dataset.src) {
    media.src = media.dataset.src;
    if (media.tagName === "VIDEO") media.load();
    syncLoadedMediaStat();
  }
}

function pauseAndRelease(media) {
  releaseMediaElement(media);
  syncLoadedMediaStat();
}

function effectiveWallPlayLimit() {
  return playbackController?.effectiveWallPlayLimit()
    ?? (state.columns >= 10 ? 0 : Math.max(4, Math.min(72, Number(state.playLimit) || 8)));
}

function isWallPreviewStatic() {
  return playbackController?.isWallPreviewStatic() ?? (!state.wallAutoplay || effectiveWallPlayLimit() <= 0);
}

function scheduleUpdatePlaying() {
  playbackController?.scheduleUpdate();
}

function pauseAllInline() {
  if (playbackController) playbackController.pauseAll();
  else document.querySelectorAll(".video-wrap video").forEach(video => video.pause());
}

function resumeVisibleInline() {
  playbackController?.resume();
}

function pauseActiveViewForInactive() {
  if (state.pausedForInactive) return;
  state.pausedForInactive = true;
  state.wasModalVideoPlayingBeforeHidden = !modal.classList.contains("hidden") && !modalVideo.paused;
  state.wasSlideshowPlayingBeforeHidden = !slideshow.classList.contains("hidden") && state.slideshowPlaying;
  pauseAllInline();
  modalVideo.pause();
  if (state.wasSlideshowPlayingBeforeHidden) {
    slideshowController.setPlaying(false);
  }
}

function resumeActiveViewAfterInactive() {
  if (!state.pausedForInactive) return;
  state.pausedForInactive = false;
  if (!isWallPreviewStatic() && state.playingEnabled && modal.classList.contains("hidden")) {
    resumeVisibleInline();
  }
  if (state.wasModalVideoPlayingBeforeHidden && !modal.classList.contains("hidden")) {
    playModalVideoSoon();
  }
  if (state.wasSlideshowPlayingBeforeHidden && !slideshow.classList.contains("hidden")) {
    slideshowController.setPlaying(true);
  }
  state.wasModalVideoPlayingBeforeHidden = false;
  state.wasSlideshowPlayingBeforeHidden = false;
}

function updateVideoModeUI() {
  modalViewer.updateVideoModeUI();
}

function updateModalNav() {
  modalViewer.updateNav();
}

function refreshModalMetadataPanel() {
  metadataPanel.refresh();
}

function renderModalItem(item) {
  modalViewer.renderItem(item);
}

function openModal(item) {
  modalViewer.open(item);
}

function closeModal() {
  modalViewer.close();
}

function currentImageItems() {
  return state.view.filter(item => item.type === "image");
}

function currentVideoItems() {
  return state.view.filter(item => item.type === "video");
}

function showModalImage(direction = 1, options = {}) {
  const current = state.currentModalItem;
  if (!current || current.type !== "image") return;
  const images = currentImageItems();
  if (images.length < 2) return;
  let index = images.findIndex(item => item.key === current.key);
  if (index < 0) index = 0;
  let next = index + direction;
  if (next >= images.length) {
    if (!state.slideshowLoop) {
      setModalSlideshowPlaying(false);
      return;
    }
    next = 0;
  }
  if (next < 0) {
    if (!state.slideshowLoop) {
      setModalSlideshowPlaying(false);
      return;
    }
    next = images.length - 1;
  }
  renderModalItem(images[next]);
  if (state.modalSlideshowPlaying) applyModalDriftAnimation();
  if (state.modalSlideshowPlaying && !options.fromTimer) scheduleModalSlideshow();
}

function playModalVideoSoon() {
  modalViewer.playVideoSoon();
}

function showModalVideo(direction = 1) {
  modalViewer.showVideo(direction);
}

function adjustModalVideoVolume(delta) {
  modalViewer.adjustVideoVolume(delta);
}

function getWheelJump(kind) {
  const now = Date.now();
  const timeKey = kind === "slideshow" ? "slideshowWheelTime" : "modalWheelTime";
  const burstKey = kind === "slideshow" ? "slideshowWheelBurst" : "modalWheelBurst";
  const gap = now - state[timeKey];
  state[burstKey] = gap < 220 ? state[burstKey] + 1 : 1;
  state[timeKey] = now;
  if (gap < 90 && state[burstKey] >= 5) return 5;
  if (gap < 180 && state[burstKey] >= 3) return 3;
  return 1;
}

function renderSlideshow(direction = 1) {
  slideshowController.render(direction);
}

function scheduleSlideshow() {
  slideshowController.schedule();
}

function showNextSlide(direction = 1) {
  slideshowController.showNext(direction);
}

function openSlideshowFromCurrent(options = {}) {
  slideshowController.openFromCurrent(options);
}

function openFullscreenSlideshowFromCurrent() {
  slideshowController.openFullscreenFromCurrent();
}

function scheduleModalSlideshow() {
  slideshowController.scheduleModal();
}

function applyModalDriftAnimation() {
  slideshowController.applyModalDrift();
}

function clearModalDriftAnimation() {
  slideshowController.clearModalDrift();
}

function setModalSlideshowPlaying(playing) {
  slideshowController.setModalPlaying(playing);
}

function toggleModalSlideshow() {
  slideshowController.toggleModal();
}

function closeSlideshow(options = {}) {
  slideshowController.close(options);
}

function returnSlideshowToModal() {
  slideshowController.returnToModal();
}

function setSlideshowControlsHidden(hidden) {
  slideshowController.setControlsHidden(hidden);
}

function setModalControlsHidden(hidden) {
  state.modalControlsHidden = hidden;
  modalContent.classList.toggle("controls-hidden", hidden);
  modalHiddenActions.classList.add("hidden");
  modalImageUiToggle.textContent = labelText("hideUi", "Hide UI", "隐藏控制");
  modalVideoUiToggle.textContent = labelText("hideUi", "Hide UI", "隐藏控制");
  modalUiShow.textContent = labelText("showUi", "Show UI", "显示控制");
  if (hidden) {
    modalContent.classList.remove("nav-active");
  }
  applyActionButtons();
}

function isInTopRightHotspot(event, root) {
  const rect = root.getBoundingClientRect();
  const width = Math.min(520, Math.max(360, rect.width * 0.24));
  const height = Math.min(140, Math.max(96, rect.height * 0.14));
  return event.clientX >= rect.right - width && event.clientY <= rect.top + height;
}

function isInModalControlHotspot(event, root) {
  const rect = root.getBoundingClientRect();
  const topHeight = Math.min(150, Math.max(96, rect.height * 0.18));
  const sideWidth = Math.min(190, Math.max(96, rect.width * 0.12));
  return (
    event.clientY <= rect.top + topHeight
    || event.clientX <= rect.left + sideWidth
    || event.clientX >= rect.right - sideWidth
    || !!event.target.closest(".modal-metadata")
  );
}

function scheduleAutoHideControls(kind, delay = 1200, reset = false) {
  const timerKey = kind === "slideshow" ? "slideshowToolbarTimer" : "modalToolbarTimer";
  if (reset) {
    clearTimeout(state[timerKey]);
    state[timerKey] = null;
  }
  if (state[timerKey]) return;
  state[timerKey] = setTimeout(() => {
    if (kind === "slideshow" && !slideshow.classList.contains("hidden")) setSlideshowControlsHidden(true);
    if (kind === "modal" && !modal.classList.contains("hidden")) setModalControlsHidden(true);
    state[timerKey] = null;
  }, delay);
}

function handleAutoControls(kind, event) {
  const root = kind === "slideshow" ? slideshow : modalContent;
  const toolbarSelector = kind === "slideshow"
    ? ".slideshow-top, .slideshow-controls, .slideshow-hidden-actions"
    : ".modal-header, .modal-actions, .modal-hidden-actions";
  const timerKey = kind === "slideshow" ? "slideshowToolbarTimer" : "modalToolbarTimer";
  const inHotspot = kind === "modal" ? isInModalControlHotspot(event, root) : isInTopRightHotspot(event, root);
  if (inHotspot || event.target.closest(toolbarSelector)) {
    clearTimeout(state[timerKey]);
    state[timerKey] = null;
    if (kind === "slideshow") {
      if (state.slideshowControlsHidden) setSlideshowControlsHidden(false);
    } else if (state.modalControlsHidden) {
      setModalControlsHidden(false);
    }
    return;
  }
  scheduleAutoHideControls(kind);
}

function pulseMediaNav(container, delay = 1000) {
  if (!container || container.classList.contains("controls-hidden")) return;
  container.classList.add("nav-active");
  clearTimeout(state.mediaNavTimer);
  state.mediaNavTimer = setTimeout(() => {
    container.classList.remove("nav-active");
  }, delay);
}

function toggleModalFullscreen() {
  if (isModalFullscreen()) {
    document.exitFullscreen?.();
  } else {
    modalContent.requestFullscreen?.().catch(() => {});
  }
}

function toggleSlideshowFullscreen() {
  slideshowController.toggleFullscreen();
}

function handleFullscreenChange() {
  slideshowController.handleFullscreenChange();
}

function toggleSlideshowPlay() {
  slideshowController.togglePlay();
}

async function openInExplorer(item) {
  const rel = typeof item === "string" ? item : item?.rel;
  const scanId = typeof item === "string" ? "" : (item?.scan_id || state.scanId || "");
  try {
    const res = await apiFetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: rel || "", scan_id: scanId || "" }),
    });
    const data = await res.json();
    if (!data.ok) showToast(data.error || t().openFail);
  } catch {
    showToast(t().openFail);
  }
}

async function copyFullPath(item) {
  const rel = item?.rel || "";
  const scanId = item?.scan_id || state.scanId || "";
  try {
    const params = new URLSearchParams({ path: rel });
    if (scanId) params.set("scan_id", scanId);
    const res = await fetch("/api/file-path?" + params.toString());
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().openFail);
    await navigator.clipboard.writeText(data.path || "");
    showToast(t().pathCopied, 1800);
  } catch (err) {
    console.error(err);
    showToast(err.message || t().openFail, 3600);
  }
}

function handleCardAction(action, item) {
  if (!item) return;
  if (action === "favorite") {
    toggleReview(item, "favorite");
    return;
  }
  if (action === "copy-path") {
    copyFullPath(item);
    return;
  }
  if (action === "open-folder") {
    openInExplorer(item);
    return;
  }
  if (action === "trash") {
    runFileAction("move_trash", item, "grid");
    return;
  }
  if (action === "select") {
    if (!state.batchMode) setBatchMode(true);
    toggleBatchItem(item.key);
  }
}

async function openInDefaultApp(item) {
  const rel = item?.rel;
  const scanId = item?.scan_id || state.scanId || "";
  if (!rel) return;
  try {
    const res = await apiFetch("/api/open-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: rel, scan_id: scanId || "" }),
    });
    const data = await res.json();
    if (!data.ok) {
      showToast(data.error || t().openDefaultFail, 3600);
      return;
    }
    showToast(t().openDefaultDone, 1800);
  } catch {
    showToast(t().openDefaultFail, 3600);
  }
}

function closeTrashConfirmDialog(confirmed) {
  const dontAsk = trashConfirmAllowDontAsk && trashConfirmDontAsk.checked;
  trashConfirmDialog.classList.add("hidden");
  if (confirmed && dontAsk) {
    state.confirmTrash = false;
    confirmTrash.checked = false;
    saveSettingsSoft();
  }
  if (trashConfirmResolve) trashConfirmResolve(!!confirmed);
  trashConfirmResolve = null;
}

function requestTrashConfirmation(count = 1, options = {}) {
  const allowDontAsk = options.allowDontAsk !== false;
  if (allowDontAsk && !state.confirmTrash) return Promise.resolve(true);
  trashConfirmAllowDontAsk = allowDontAsk;
  trashConfirmTitle.textContent = options.title || t().trashConfirmTitle;
  trashConfirmMessage.textContent = options.message || (count > 1 ? t().batchTrashConfirm(count) : t().trashConfirmMessage);
  trashConfirmOk.textContent = options.confirmText || t().trashConfirmMove;
  trashConfirmDontAsk.checked = false;
  trashConfirmDontAskWrap?.classList.toggle("hidden", !allowDontAsk);
  trashConfirmDialog.classList.remove("hidden");
  return new Promise(resolve => {
    trashConfirmResolve = resolve;
  });
}

function removeItemsFromState(items) {
  const start = performance.now();
  const keys = new Set(items.map(item => item.key));
  const expectedRemovedCardCount = currentPageItems().filter(item => keys.has(item.key)).length;
  const cards = [...grid.querySelectorAll(".video-card")].filter(card => keys.has(card.dataset.key));
  cards.forEach(card => {
    const video = card.querySelector(".video-wrap video");
    if (video) playbackController?.evictVideo(video);
    card.classList.add("is-removing");
  });
  // Schedule the DOM removal before follow-up UI work so a later UI error cannot leave a stale playable card behind.
  window.setTimeout(() => cards.forEach(card => card.remove()), 140);
  state.all = state.all.filter(item => !keys.has(item.key));
  state.view = state.view.filter(item => !keys.has(item.key));
  keys.forEach(key => state.batchSelected.delete(key));
  const pages = gridPageCount();
  if (expectedRemovedCardCount !== cards.length || (state.view.length && state.gridPage >= pages)) {
    state.gridPage = pages - 1;
    renderGrid();
  } else {
    updateGridPager();
    updateBatchUI();
    updateSubInfo();
    syncLoadedMediaStatNow();
    scheduleUpdatePlaying();
  }
  return Math.round(performance.now() - start);
}

function removeItemFromState(item) {
  return removeItemsFromState([item]);
}

function setPlaybackBlocked(items, blocked) {
  playbackController?.setBlocked(items, blocked);
}

function evictGridMediaElement(media) {
  if (media?.tagName === "VIDEO" && playbackController) playbackController.evictVideo(media);
  else releaseMediaElement(media);
}

function releaseActionPreviewMedia(source) {
  if (source === "slideshow") {
    slideshowController.releasePreviewMedia();
    return;
  }
  releaseMediaElement(modalVideo);
  releaseMediaElement(modalImage);
}

function waitForMediaRelease(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function releaseMediaBeforeFileAction(item, source) {
  const start = performance.now();
  setPlaybackBlocked(item, true);
  let matchedGridMedia = 0;
  let videoWaitMs = 0;
  if (!item) return { total_ms: 0, matched_grid_media: 0, video_wait_ms: 0 };
  if (source === "slideshow") releaseActionPreviewMedia(source);
  if (state.currentModalItem?.key === item.key) releaseActionPreviewMedia("modal");
  document.querySelectorAll(".video-wrap video, .video-wrap img.media-image").forEach(media => {
    if (media.dataset.rel === item.rel || media.dataset.src === item.url || media.getAttribute("src") === item.url) {
      matchedGridMedia += 1;
      evictGridMediaElement(media);
    }
  });
  syncLoadedMediaStatNow();
  if (item.type === "video" && source !== "batch") {
    const waitStart = performance.now();
    await waitForMediaRelease();
    videoWaitMs = Math.round(performance.now() - waitStart);
  }
  return {
    total_ms: Math.round(performance.now() - start),
    matched_grid_media: matchedGridMedia,
    video_wait_ms: videoWaitMs,
  };
}

async function releaseMediaBeforeBatchAction(items) {
  const start = performance.now();
  setPlaybackBlocked(items, true);
  const rels = new Set(items.map(item => item.rel));
  const urls = new Set(items.map(item => item.url).filter(Boolean));
  let matchedGridMedia = 0;
  document.querySelectorAll(".video-wrap video, .video-wrap img.media-image").forEach(media => {
    if (rels.has(media.dataset.rel) || urls.has(media.dataset.src) || urls.has(media.getAttribute("src"))) {
      matchedGridMedia += 1;
      evictGridMediaElement(media);
    }
  });
  syncLoadedMediaStatNow();
  const waitStart = performance.now();
  await waitForMediaRelease();
  return {
    total_ms: Math.round(performance.now() - start),
    matched_grid_media: matchedGridMedia,
    video_wait_ms: Math.round(performance.now() - waitStart),
    dom_scans: 1,
  };
}

function restoreActionPreviewMedia(item, source) {
  if (!item) return;
  if (source === "slideshow" && !slideshow.classList.contains("hidden")) {
    renderSlideshow(1);
    return;
  }
  if (state.currentModalItem?.key === item.key && !modal.classList.contains("hidden")) {
    renderModalItem(item);
    if (item.type === "video") playModalVideoSoon();
  }
}

function continueAfterFileAction(item, source, oldIndex) {
  if (source === "slideshow") {
    slideshowController.refreshItems(currentImageItems(), oldIndex);
    return;
  }

  if (!modal.classList.contains("hidden")) {
    const items = item.type === "image" ? currentImageItems() : currentVideoItems();
    if (!items.length) {
      closeModal();
      return;
    }
    renderModalItem(items[Math.max(0, Math.min(oldIndex, items.length - 1))]);
    if (state.currentModalItem?.type === "image" && state.modalSlideshowPlaying) scheduleModalSlideshow();
    if (state.currentModalItem?.type === "video") playModalVideoSoon();
  }
}

async function runFileAction(action, item = state.currentModalItem, source = "modal") {
  if (!item) return;
  if (action === "move_trash" && !(await ensureTrashBackend())) return;
  const actionStart = performance.now();
  const sameTypeItems = item.type === "image" ? currentImageItems() : currentVideoItems();
  const oldIndex = Math.max(0, sameTypeItems.findIndex(v => v.key === item.key));
  if (action === "move_review" && !window.confirm(t().confirmReview)) return;
  if (action === "move_trash" && !(await requestTrashConfirmation(1))) return;
  try {
    const releaseTimings = await releaseMediaBeforeFileAction(item, source);
    const fetchStart = performance.now();
    const res = await apiFetch("/api/file-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rel: item.rel, scan_id: item.scan_id || state.scanId || "", confirm: true }),
    });
    const data = await res.json();
    const requestMs = Math.round(performance.now() - fetchStart);
    if (!data.ok) throw new Error(data.error || t().fileActionFail);
    if (action === "move_trash") mergeTrashItems([data.trash_item]);
    releaseActionPreviewMedia(source);
    const uiRefreshMs = removeItemFromState(item);
    continueAfterFileAction(item, source, oldIndex);
    console.info("[delete-perf] single action", {
      name: item.name,
      type: item.type,
      source,
      action,
      total_ms: Math.round(performance.now() - actionStart),
      release_ms: releaseTimings.total_ms,
      video_wait_ms: releaseTimings.video_wait_ms,
      matched_grid_media: releaseTimings.matched_grid_media,
      request_ms: requestMs,
      backend_total_ms: data.timings_ms?.total_ms,
      recycle_total_ms: data.timings_ms?.recycle_bin?.total_ms,
      recycle_retries: data.timings_ms?.recycle_bin?.retry_count,
      ui_refresh_ms: uiRefreshMs,
    });
    showToast(t().fileActionDone, 3600);
  } catch (err) {
    console.error(err);
    restoreActionPreviewMedia(item, source);
    showToast(err.message || t().fileActionFail, 5200);
  } finally {
    setPlaybackBlocked(item, false);
  }
}

function pathKey(path) {
  return String(path || "").trim().toLowerCase();
}

function normalizePathText(path) {
  return String(path || "").trim().replace(/^"+|"+$/g, "");
}

function normalizeDriveLetterInput(path) {
  const value = normalizePathText(path);
  return /^[a-z]:?$/i.test(value) ? `${value[0].toUpperCase()}:\\` : value;
}

function isFavoritePath(path) {
  const key = pathKey(path);
  return state.pathFavorites.some(p => pathKey(p) === key);
}

function pathLabel(path) {
  const clean = String(path || "").replace(/[\\\/]+$/, "");
  const parts = clean.split(/[\\\/]/).filter(Boolean);
  return parts[parts.length - 1] || clean || path;
}

function renderSavedPathList(container, paths) {
  container.innerHTML = "";
  if (!paths.length) {
    const empty = document.createElement("div");
    empty.className = "folder-empty";
    empty.textContent = t().folderEmpty;
    container.appendChild(empty);
    return;
  }
  for (const path of paths) {
    container.appendChild(createPathRow(pathLabel(path), path, { removableFavorite: true, revealInTree: true }));
  }
}

function createPathRow(label, path, options = {}) {
  const row = document.createElement("div");
  row.className = "folder-row";
  row.dataset.path = path;
  const head = document.createElement("div");
  head.className = "folder-row-head";
  row.appendChild(head);
  if (options.expandable) {
    const expand = document.createElement("button");
    expand.className = "folder-expand";
    expand.type = "button";
    expand.textContent = ">";
    expand.title = options.scanBlocked ? (options.scanBlockReason || t().scanBlockedPath) : labelText("expand", "Expand", "展开");
    expand.disabled = !!options.scanBlocked;
    expand.addEventListener("click", e => {
      e.stopPropagation();
      toggleFolderNode(row, path, expand);
    });
    head.appendChild(expand);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "folder-expand-spacer";
    head.appendChild(spacer);
  }
  const select = document.createElement("button");
  select.className = "folder-path";
  select.type = "button";
  const blockLabel = options.scanBlockReason?.startsWith("This drive") ? t().scanBlockedCapacity : t().scanBlockedPath;
  select.textContent = options.scanBlocked ? `${label} · ${blockLabel}` : label;
  select.title = options.scanBlocked ? `${path}\n${options.scanBlockReason}` : path;
  select.disabled = !!options.scanBlocked;
  select.addEventListener("click", () => {
    if (options.revealInTree) void revealPathInFolderTree(path);
    void selectFolderPath(path);
  });
  head.appendChild(select);
  if (options.scanBlocked) row.classList.add("scan-blocked");
  if (options.favoriteToggle && !options.scanBlocked) {
    const favoriteToggle = document.createElement("button");
    favoriteToggle.className = "folder-favorite-toggle";
    favoriteToggle.type = "button";
    favoriteToggle.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      await toggleFavoritePath(path);
    });
    row.classList.add("has-favorite-toggle");
    head.appendChild(favoriteToggle);
  }
  if (options.dragToggle && !options.scanBlocked) {
    const dragToggle = document.createElement("button");
    dragToggle.className = "folder-drag-toggle drag-auth-toggle";
    dragToggle.type = "button";
    dragToggle.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      handleDragAuthorizationClick(path);
    });
    row.classList.add("has-drag-toggle");
    head.appendChild(dragToggle);
    applyDragButtonState(dragToggle, path, row);
  }
  if (options.removableFavorite) {
    const remove = document.createElement("button");
    remove.className = "folder-row-remove";
    remove.type = "button";
    remove.innerHTML = ICONS.close;
    remove.title = t().removeFavorite;
    remove.setAttribute("aria-label", t().removeFavorite);
    remove.addEventListener("click", e => {
      e.stopPropagation();
      toggleFavoritePath(path);
    });
    row.classList.add("has-remove");
    head.appendChild(remove);
  }
  if (options.expandable) {
    const children = document.createElement("div");
    children.className = "folder-children hidden";
    row.appendChild(children);
  }
  return row;
}

function renderPathPanel() {
  renderSavedPathList(folderFavorites, state.pathFavorites);
  updateFolderStars();
  updateFolderDragStates();
  renderHistoryMenu();
  updateFavoritePathButton();
  updateDragAuthorizationUi();
}

function updateFolderStars() {
  folderTree.querySelectorAll(".folder-row.has-favorite-toggle").forEach(row => {
    const favorite = isFavoritePath(row.dataset.path);
    const button = row.querySelector(":scope > .folder-row-head > .folder-favorite-toggle");
    row.classList.toggle("is-favorite", favorite);
    setButtonLabel(button, favorite ? t().removeFavorite : t().addFavorite, favorite ? "starFilled" : "star", { iconOnly: true });
  });
  updateFavoritePathButton();
}

function positionPathDropdown(menu) {
  const rect = pathCombo.getBoundingClientRect();
  const gutter = 12;
  menu.style.top = `${Math.round(rect.bottom + 8)}px`;
  menu.style.left = `${Math.round(Math.max(gutter, rect.left))}px`;
  menu.style.width = `${Math.round(Math.min(rect.width, window.innerWidth - gutter * 2))}px`;
}

function setPathSuggestMenuOpen(open) {
  if (open) pathHistoryMenu.classList.add("hidden");
  if (open) positionPathDropdown(pathSuggestMenu);
  pathSuggestMenu.classList.toggle("hidden", !open);
}

function closePathSuggestions() {
  clearTimeout(state.pathSuggestTimer);
  state.pathSuggestions = [];
  state.pathSuggestIndex = -1;
  pathSuggestMenu.innerHTML = "";
  setPathSuggestMenuOpen(false);
}

function renderPathSuggestions() {
  pathSuggestMenu.innerHTML = "";
  if (!state.pathSuggestions.length) {
    closePathSuggestions();
    return;
  }
  state.pathSuggestions.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "path-suggest-item";
    button.classList.toggle("active", index === state.pathSuggestIndex);
    button.textContent = item.path;
    button.title = item.path;
    button.addEventListener("mousedown", e => e.preventDefault());
    button.addEventListener("click", () => applyPathSuggestion(index, true));
    pathSuggestMenu.appendChild(button);
  });
  setPathSuggestMenuOpen(true);
}

function applyPathSuggestion(index = state.pathSuggestIndex, scan = false) {
  const item = state.pathSuggestions[index];
  if (!item) return;
  pathInput.value = item.path;
  updateFavoritePathButton();
  updateDragAuthorizationUi();
  closePathSuggestions();
  if (scan) scanNow();
}

async function loadPathSuggestions() {
  const value = pathInput.value.trim();
  if (value.length < 2) {
    closePathSuggestions();
    return;
  }
  try {
    const res = await fetch(`/api/fs/suggest?path=${encodeURIComponent(value)}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "suggest failed");
    state.pathSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    state.pathSuggestIndex = state.pathSuggestions.length ? 0 : -1;
    renderPathSuggestions();
  } catch {
    closePathSuggestions();
  }
}

function schedulePathSuggestions() {
  clearTimeout(state.pathSuggestTimer);
  state.pathSuggestTimer = setTimeout(loadPathSuggestions, 220);
}

function movePathSuggestion(direction) {
  if (pathSuggestMenu.classList.contains("hidden") || !state.pathSuggestions.length) return false;
  state.pathSuggestIndex = (state.pathSuggestIndex + direction + state.pathSuggestions.length) % state.pathSuggestions.length;
  renderPathSuggestions();
  return true;
}
function renderHistoryMenu() {
  pathHistoryMenu.innerHTML = "";
  const title = document.createElement("div");
  title.className = "path-history-title";
  title.textContent = t().pathHistory;
  pathHistoryMenu.appendChild(title);
  if (!state.pathHistory.length) {
    const empty = document.createElement("div");
    empty.className = "path-history-empty";
    empty.textContent = t().noHistory;
    pathHistoryMenu.appendChild(empty);
  } else {
    for (const path of state.pathHistory) {
      const row = document.createElement("div");
      row.className = "path-history-row";
      const item = document.createElement("button");
      item.className = "path-history-item";
      item.type = "button";
      item.textContent = path;
      item.title = path;
      item.addEventListener("click", () => {
        setHistoryMenuOpen(false);
        selectFolderPath(path);
      });
      const remove = document.createElement("button");
      remove.className = "path-history-remove";
      remove.type = "button";
      remove.innerHTML = ICONS.close;
      remove.dataset.historyRemove = path;
      remove.title = t().removeHistory;
      remove.setAttribute("aria-label", t().removeHistory);
      remove.addEventListener("click", e => {
        e.stopPropagation();
        e.preventDefault();
        removePathHistory(path);
      });
      row.append(item, remove);
      pathHistoryMenu.appendChild(row);
    }
  }
  const clear = document.createElement("button");
  clear.className = "path-history-clear";
  clear.type = "button";
  clear.textContent = t().clearHistory;
  clear.addEventListener("click", () => {
    setHistoryMenuOpen(false);
    clearPathHistory();
  });
  pathHistoryMenu.appendChild(clear);
}

function setHistoryMenuOpen(open) {
  if (open) closePathSuggestions();
  if (open) renderHistoryMenu();
  if (open) positionPathDropdown(pathHistoryMenu);
  pathHistoryMenu.classList.toggle("hidden", !open);
}

function toggleHistoryMenu() {
  setHistoryMenuOpen(pathHistoryMenu.classList.contains("hidden"));
}

function updateFavoritePathButton() {
  const path = pathInput.value.trim();
  const favorite = path && isFavoritePath(path);
  favoritePathBtn.classList.toggle("active", !!favorite);
  setButtonLabel(favoritePathBtn, favorite ? t().removeFavorite : t().addFavorite, favorite ? "starFilled" : "star", { iconOnly: true });
}

function dragStatusForPath(path) {
  const normalized = normalizePathText(path);
  return normalized ? dragOutController.getStatus(normalized) : { state: "unconfigured", root: "", reason: "" };
}

function dragIconForState(status) {
  if (status.state === "ready") return "folderCheck";
  if (status.state === "refresh") return "folderSync";
  return "folderPlus";
}

function dragTitleForPath(path, status = dragStatusForPath(path)) {
  if (status.state === "ready") {
    return pathKey(path) === pathKey(status.root) ? t().dragReady : t().dragCoveredBy(status.root);
  }
  if (status.state === "refresh") return t().dragRefresh;
  return t().dragAuthorize;
}

function applyDragButtonState(button, path, row = null) {
  if (!button) return;
  const status = dragStatusForPath(path);
  const authorizing = state.dragAuthBusy && pathKey(path) === pathKey(state.dragAuthRoot);
  button.disabled = !!state.dragAuthBusy;
  button.classList.remove("drag-ready", "drag-refresh", "drag-authorizing");
  if (authorizing) {
    button.classList.add("drag-authorizing");
    setButtonLabel(button, t().dragAuthorizing, "folderSync", { iconOnly: true });
  }
  if (!authorizing) {
    if (status.state === "ready") button.classList.add("drag-ready");
    if (status.state === "refresh") button.classList.add("drag-refresh");
    setButtonLabel(button, dragTitleForPath(path, status), dragIconForState(status), { iconOnly: true });
  }
  if (row) {
    row.classList.toggle("drag-ready", !authorizing && status.state === "ready");
    row.classList.toggle("drag-refresh", !authorizing && status.state === "refresh");
    row.classList.toggle("drag-authorizing", authorizing);
  }
}

function updateFolderDragStates() {
  folderTree.querySelectorAll(".folder-row.has-drag-toggle").forEach(row => {
    const button = row.querySelector(":scope > .folder-row-head > .folder-drag-toggle");
    applyDragButtonState(button, row.dataset.path, row);
  });
}

function updateDragAuthorizationUi() {
  applyDragButtonState(dragPathBtn, pathInput.value);
  updateFolderDragStates();
}

function renderDragRootSettings() {
  if (!dragRootList) return;
  dragRootList.innerHTML = "";
  dragRootCount.textContent = String(state.dragRoots.length);
  dragAuthorizeCurrentLabel.textContent = t().dragAuthorizeCurrent;
  dragAuthorizeCurrentBtn.disabled = !!state.dragAuthBusy;
  dragSettingsNote.textContent = t().dragSettingsNote;
  if (!state.dragRoots.length) {
    const empty = document.createElement("div");
    empty.className = "drag-root-empty";
    empty.textContent = t().dragRootEmpty;
    dragRootList.appendChild(empty);
    return;
  }
  for (const root of state.dragRoots) {
    const info = dragOutController.getRootInfo(root);
    const row = document.createElement("div");
    const authorizing = state.dragAuthBusy && pathKey(root) === pathKey(state.dragAuthRoot);
    row.className = `drag-root-row ${authorizing ? "drag-authorizing" : (info.state === "ready" ? "drag-ready" : "drag-refresh")}`;

    const stateIcon = document.createElement("span");
    stateIcon.className = "drag-root-state";
    stateIcon.innerHTML = iconSvg(authorizing ? "folderSync" : (info.state === "ready" ? "folderCheck" : "folderSync"));
    stateIcon.title = authorizing ? t().dragAuthorizing : (info.state === "ready" ? t().dragReady : t().dragRefresh);

    const copy = document.createElement("div");
    copy.className = "drag-root-copy";
    const path = document.createElement("div");
    path.className = "drag-root-path";
    path.textContent = root;
    path.title = root;
    const meta = document.createElement("div");
    meta.className = "drag-root-meta";
    meta.textContent = authorizing ? t().dragAuthorizing : (info.state === "ready"
      ? t().dragRootReadyMeta(info.totalFiles, info.mediaFiles, info.buildMs)
      : (info.reason && info.reason !== "restore" ? t().dragRootStaleMeta : t().dragRootRestoreMeta));
    copy.append(path, meta);

    const actions = document.createElement("div");
    actions.className = "drag-root-actions";
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "drag-root-action";
    refresh.disabled = !!state.dragAuthBusy;
    if (authorizing) refresh.classList.add("drag-authorizing");
    refresh.innerHTML = iconSvg("folderSync");
    refresh.title = t().dragRefreshAction;
    refresh.setAttribute("aria-label", t().dragRefreshAction);
    refresh.addEventListener("click", event => {
      event.stopPropagation();
      authorizeDragRoot(root, { persist: false });
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "drag-root-action";
    remove.disabled = !!state.dragAuthBusy;
    remove.innerHTML = iconSvg("close");
    remove.title = t().dragRemoveAction;
    remove.setAttribute("aria-label", t().dragRemoveAction);
    remove.addEventListener("click", event => {
      event.stopPropagation();
      void removeDragRoot(root);
    });
    actions.append(refresh, remove);
    row.append(stateIcon, copy, actions);
    dragRootList.appendChild(row);
  }
}

function syncDragRootsFromConfig(config) {
  state.dragRoots = Array.isArray(config?.drag_roots) ? config.drag_roots : [];
  dragOutController.setConfiguredRoots(state.dragRoots);
  renderDragRootSettings();
  updateDragAuthorizationUi();
}

async function persistDragRoot(action, root) {
  const res = await apiFetch("/api/path-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, path: root }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || t().unknown);
  syncDragRootsFromConfig(data.config || {});
  return data;
}

async function verifyDragRootSelection({ root, selectedRootName, totalFiles, samples }) {
  const started = performance.now();
  console.debug("[drag-out] verify:start", {
    requestedRoot: root,
    selectedRootName,
    totalFiles,
    sampleCount: samples?.length || 0,
  });
  try {
    const response = await apiFetch("/api/drag-root/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ root, samples: Array.isArray(samples) ? samples : [] }),
    });
    const data = await response.json();
    const result = response.ok && data?.ok
      ? data
      : { ...data, ok: false, error: data?.error || `HTTP ${response.status}` };
    console.debug("[drag-out] verify:result", {
      requestedRoot: root,
      selectedRootName,
      ok: !!result.ok,
      reason: result.reason || "",
      checked: result.checked || 0,
      verifyMs: result.verify_ms ?? Math.round(performance.now() - started),
    });
    return result;
  } catch (error) {
    const result = { ok: false, reason: "request-failed", error: error?.message || String(error) };
    console.debug("[drag-out] verify:error", { requestedRoot: root, selectedRootName, error: result.error });
    return result;
  }
}

function copyDragTargetPath(root) {
  const value = normalizePathText(root);
  if (!value) return false;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-10000px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
    if (document.execCommand?.("copy") === true) return true;
  } catch (error) {
    console.debug("[drag-out] synchronous copy unavailable", error);
  } finally {
    textarea.remove();
  }
  try {
    if (!navigator.clipboard?.writeText) return false;
    void navigator.clipboard.writeText(value).catch(error => {
      console.debug("[drag-out] could not copy target path", error);
    });
    return true;
  } catch (error) {
    console.debug("[drag-out] clipboard unavailable", error);
    return false;
  }
}

function authorizeDragRoot(rootPath, { persist = true } = {}) {
  const root = normalizeDriveLetterInput(rootPath);
  if (!root) {
    showToast(t().needPath);
    return Promise.resolve(false);
  }
  if (state.dragAuthBusy) {
    showToast(t().dragAuthorizationBusy, 2600);
    return Promise.resolve(false);
  }
  if (!state.backendCompatible) {
    showToast(t().backendRestartRequired, 7000);
    return Promise.resolve(false);
  }
  if (!("webkitdirectory" in document.createElement("input"))) {
    showToast(t().dragUnsupported, 4200);
    return Promise.resolve(false);
  }

  state.dragAuthBusy = true;
  state.dragAuthRoot = root;
  updateDragAuthorizationUi();
  renderDragRootSettings();
  console.debug("[drag-out] authorize:start", { requestedRoot: root, persist });

  const copied = copyDragTargetPath(root);
  showToast(copied ? t().dragChooseRoot(root) : t().dragChooseRootCopyFail(root), 5200);
  const authorization = dragOutController.authorize(root);
  return authorization.then(async result => {
    console.debug("[drag-out] authorize:selection", {
      requestedRoot: root,
      ok: !!result.ok,
      reason: result.reason || "",
      selectedRootName: result.selectedRootName || "",
      verified: !!result.verification?.ok,
    });
    if (!result.ok) {
      if (result.reason === "folder-mismatch") {
        showToast(t().dragFolderMismatch(root, result.selectedRootName || "?"), 6200);
      } else if (result.reason === "verification-failed") {
        showToast(t().dragVerificationFailed(root, result.verification?.error || ""), 7000);
      } else if (result.reason === "cancelled") {
        showToast(t().dragAuthorizationCancelled, 2200);
      } else {
        showToast(t().dragAuthorizationFailed, 3600);
      }
      console.debug("[drag-out] authorize:failed", { requestedRoot: root, reason: result.reason || "", verification: result.verification || null });
      return false;
    }
    try {
      if (persist && !state.dragRoots.some(item => pathKey(item) === pathKey(root))) {
        await persistDragRoot("drag_root_add", root);
      } else {
        dragOutController.setConfiguredRoots(state.dragRoots.length ? state.dragRoots : [root]);
      }
      const info = dragOutController.getRootInfo(root);
      console.debug("[drag-out] authorize:ready", {
        requestedRoot: root,
        configuredRoots: [...state.dragRoots],
        totalFiles: info.totalFiles,
        mediaFiles: info.mediaFiles,
        buildMs: info.buildMs,
      });
      showToast(t().dragAuthorized(root, info.totalFiles, info.mediaFiles, info.buildMs), 5200);
      renderDragRootSettings();
      updateDragAuthorizationUi();
      return true;
    } catch (error) {
      console.error(error);
      dragOutController.discardGrant(root);
      showToast(t().configFail, 3200);
      return false;
    }
  }).finally(() => {
    state.dragAuthBusy = false;
    state.dragAuthRoot = "";
    updateDragAuthorizationUi();
    renderDragRootSettings();
  });
}

function openDragSettings() {
  setSettingsMenuOpen(true);
  renderDragRootSettings();
  window.setTimeout(() => dragSettingsSection?.scrollIntoView({ block: "nearest" }), 0);
}

function handleDragAuthorizationClick(path = pathInput.value) {
  const target = normalizeDriveLetterInput(path);
  if (!target) {
    showToast(t().needPath);
    return;
  }
  const status = dragStatusForPath(target);
  if (status.state === "ready") {
    openDragSettings();
    return;
  }
  if (status.state === "refresh") {
    authorizeDragRoot(status.root, { persist: false });
    return;
  }
  authorizeDragRoot(target, { persist: true });
}

async function removeDragRoot(root) {
  try {
    await persistDragRoot("drag_root_remove", root);
    dragOutController.discardGrant(root);
    showToast(t().dragRootRemoved, 2200);
  } catch (error) {
    console.error(error);
    showToast(t().configFail, 2600);
  }
}

function fullPathForItem(item) {
  if (item?.full_path) return normalizePathText(item.full_path);
  if (!state.scannedPath || !item?.rel) return "";
  return joinFolderPath(state.scannedPath, String(item.rel).replace(/\//g, "\\"));
}

function handleMediaDragStart(event, item) {
  const fullPath = fullPathForItem(item);
  const result = dragOutController.resolveFile(fullPath);
  if (!result.ok) {
    showToast(result.state === "refresh" ? t().dragNeedsRefresh : t().dragNeedsAuthorize, 3200);
    updateDragAuthorizationUi();
    renderDragRootSettings();
    return false;
  }
  const expectedSize = Number(item?.size_bytes);
  const expectedMtime = Number(item?.mtime);
  const actualMtime = Math.floor(Number(result.file.lastModified || 0) / 1000);
  const sizeChanged = Number.isFinite(expectedSize) && expectedSize >= 0 && result.file.size !== expectedSize;
  const mtimeChanged = Number.isFinite(expectedMtime) && expectedMtime > 0 && actualMtime > 0 && Math.abs(actualMtime - expectedMtime) > 1;
  if (sizeChanged || mtimeChanged) {
    dragOutController.markStale(result.root, "changed-file");
    showToast(t().dragNeedsRefresh, 3200);
    updateDragAuthorizationUi();
    renderDragRootSettings();
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer?.items?.add) return false;
  try {
    dataTransfer.effectAllowed = "copy";
    const added = dataTransfer.items.add(result.file);
    return !!added;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function openFolderPanel() {
  folderPanel.classList.remove("hidden");
  document.body.classList.add("sidebar-open");
  applyLayout();
  renderPathPanel();
  if (!state.folderRootsLoaded) await loadFolderRoots();
}

function closeFolderPanel() {
  folderPanel.classList.add("hidden");
  document.body.classList.remove("sidebar-open");
  applyLayout();
}

async function loadFolderRoots(force = false) {
  if (force) {
    state.folderRootsLoaded = false;
    state.folderCache.clear();
  }
  folderTree.innerHTML = `<div class="folder-empty">${t().scanProgress}</div>`;
  try {
    const res = await fetch("/api/fs/roots");
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().folderLoadFail);
    folderTree.innerHTML = "";
    for (const root of data.roots || []) {
      folderTree.appendChild(createPathRow(root.name || root.path, root.path, {
        expandable: true,
        favoriteToggle: true,
        dragToggle: true,
        scanBlocked: root.scan_blocked === true,
        scanBlockReason: root.scan_block_reason || "",
      }));
    }
    state.folderRootsLoaded = true;
    updateFolderStars();
  } catch (err) {
    console.error(err);
    folderTree.innerHTML = `<div class="folder-empty">${t().folderLoadFail}</div>`;
  }
}

function renderFolderChildren(container, folders) {
  container.innerHTML = "";
  if (!folders.length) {
    container.innerHTML = `<div class="folder-empty">${t().folderEmpty}</div>`;
    return;
  }
  for (const folder of folders) {
    container.appendChild(createPathRow(folder.name, folder.path, { expandable: true, favoriteToggle: true, dragToggle: true }));
  }
  updateFolderStars();
  updateFolderDragStates();
}

function findFolderRow(container, path) {
  return [...container.children].find(node => node.classList?.contains("folder-row") && pathKey(node.dataset.path) === pathKey(path)) || null;
}

function joinFolderPath(parent, name) {
  return `${String(parent).replace(/[\\/]+$/, "")}\\${name}`;
}

async function loadFolderNode(row, path, expandButton, includePath = "") {
  const children = row.querySelector(":scope > .folder-children");
  if (!children) return null;
  expandButton.textContent = "...";
  children.classList.remove("hidden");
  children.innerHTML = `<div class="folder-empty">${t().scanProgress}</div>`;
  const cacheKey = pathKey(path);
  let folders = state.folderCache.get(cacheKey);
  if (!folders || (includePath && !folders.some(folder => pathKey(folder.path) === pathKey(includePath)))) {
    try {
      const query = new URLSearchParams({ path });
      if (includePath) query.set("include", includePath);
      const res = await fetch(`/api/fs/list?${query}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || t().folderLoadFail);
      folders = data.folders || [];
      state.folderCache.set(cacheKey, folders);
    } catch (err) {
      console.error(err);
      children.innerHTML = `<div class="folder-empty">${t().folderLoadFail}</div>`;
      expandButton.textContent = ">";
      return null;
    }
  }
  renderFolderChildren(children, folders);
  children.dataset.loaded = "1";
  expandButton.textContent = "v";
  return children;
}

async function toggleFolderNode(row, path, expandButton) {
  const children = row.querySelector(":scope > .folder-children");
  if (!children) return;
  if (children.dataset.loaded === "1") {
    children.classList.toggle("hidden");
    expandButton.textContent = children.classList.contains("hidden") ? ">" : "v";
    return;
  }
  await loadFolderNode(row, path, expandButton);
}

async function ensureFolderNodeExpanded(row, path, includePath = "") {
  const children = row.querySelector(":scope > .folder-children");
  const expandButton = row.querySelector(":scope > .folder-row-head > .folder-expand");
  if (!children || !expandButton) return null;
  const targetPresent = !includePath || !!findFolderRow(children, includePath);
  if (children.dataset.loaded === "1" && targetPresent) {
    children.classList.remove("hidden");
    expandButton.textContent = "v";
    return children;
  }
  return loadFolderNode(row, path, expandButton, includePath);
}

function isPathWithinRoot(path, rootPath) {
  const target = normalizePathText(path).replace(/[\\/]+$/, "").toLowerCase();
  const root = normalizePathText(rootPath).replace(/[\\/]+$/, "").toLowerCase();
  return target === root || target.startsWith(`${root}\\`);
}

function highlightFolderRow(row) {
  row.classList.add("tree-target");
  row.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  window.setTimeout(() => row.classList.remove("tree-target"), 1800);
}

async function revealPathInFolderTree(path) {
  const targetPath = normalizePathText(path);
  if (!targetPath) return;
  await openFolderPanel();
  const rootRows = [...folderTree.children].filter(node => node.classList?.contains("folder-row"));
  const rootRow = rootRows
    .filter(row => isPathWithinRoot(targetPath, row.dataset.path))
    .sort((a, b) => b.dataset.path.length - a.dataset.path.length)[0];
  if (!rootRow) return;
  let currentRow = rootRow;
  let currentPath = rootRow.dataset.path;
  const rootPrefix = normalizePathText(currentPath).replace(/[\\/]+$/, "");
  const relativePath = targetPath.slice(rootPrefix.length).replace(/^[\\/]+/, "");
  for (const segment of relativePath.split(/[\\/]+/).filter(Boolean)) {
    const nextPath = joinFolderPath(currentPath, segment);
    const children = await ensureFolderNodeExpanded(currentRow, currentPath, nextPath);
    if (!children) return;
    const nextRow = findFolderRow(children, nextPath);
    if (!nextRow) return;
    currentRow = nextRow;
    currentPath = nextPath;
  }
  highlightFolderRow(currentRow);
}

async function selectFolderPath(path) {
  pathInput.value = path;
  updateFavoritePathButton();
  updateDragAuthorizationUi();
  showToast(t().pathSelectedScanning, 1600);
  await scanNow();
}

async function toggleFavoritePath(path) {
  path = normalizePathText(path || pathInput.value);
  const favorite = isFavoritePath(path);
  if (!path) {
    showToast(t().needPath);
    return;
  }
  try {
    const res = await apiFetch("/api/path-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: favorite ? "unfavorite" : "favorite", path }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().unknown);
    state.pathFavorites = data.config?.path_favorites || [];
    state.pathHistory = data.config?.path_history || state.pathHistory;
    renderPathPanel();
    renderHistoryMenu();
    updateFavoritePathButton();
  } catch (err) {
    console.error(err);
    showToast(t().configFail, 2600);
  }
}

async function clearPathHistory() {
  try {
    const res = await apiFetch("/api/path-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_history" }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().unknown);
    state.pathHistory = data.config?.path_history || [];
    state.pathFavorites = data.config?.path_favorites || state.pathFavorites;
    renderPathPanel();
    renderHistoryMenu();
    updateFavoritePathButton();
    showToast(t().historyCleared, 2200);
  } catch (err) {
    console.error(err);
    showToast(t().configFail, 2600);
  }
}

async function removePathHistory(path) {
  try {
    const res = await apiFetch("/api/path-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_history", path }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().unknown);
    state.pathHistory = data.config?.path_history || [];
    state.pathFavorites = data.config?.path_favorites || state.pathFavorites;
    renderPathPanel();
    renderHistoryMenu();
    showToast(t().historyRemoved, 1800);
  } catch (err) {
    console.error(err);
    showToast(t().configFail, 2600);
  }
}

async function chooseFolder() {
  showToast(t().chooseOpening, 3500);
  chooseFolderBtn.disabled = true;
  setButtonLabel(chooseFolderBtn, t().choosing, "folder", { iconOnly: true });
  try {
    const res = await apiFetch("/api/choose-folder", { method: "POST" });
    const data = await res.json();
    if (data.ok && data.path) {
      pathInput.value = data.path;
      showToast(t().pathSelectedScanning, 1600);
      await scanNow();
    } else {
      showToast(t().notChosen);
    }
  } catch {
    showToast(t().chooseFail);
  } finally {
    chooseFolderBtn.disabled = false;
    setButtonLabel(chooseFolderBtn, t().chooseFolder, "folder", { iconOnly: true });
  }
}

async function scanNow() {
  const videoDir = normalizeDriveLetterInput(pathInput.value);
  if (!videoDir) {
    showToast(t().needPath);
    return;
  }
  pathInput.value = videoDir;
  updateDragAuthorizationUi();
  const scanStart = performance.now();
  setBusy(true);
  emptyState.classList.add("hidden");
  destroyObservers();
  releaseGridMedia();
  resetWorkflowStatusState();
  grid.innerHTML = "";
  pauseAllInline();
  try {
    const payload = {
      video_dir: videoDir,
      remember_path: rememberPath.checked,
      recursive: recursiveScan.checked,
      filename_exclude_enabled: state.filenameExcludeEnabled,
      filename_exclude_keywords: state.filenameExcludeKeywords,
      filename_exclude_scope: state.filenameExcludeScope,
      blocked_scan_paths: state.blockedScanPaths,
      min_scan_volume_gb: state.minScanVolumeGb,
      drag_roots: state.dragRoots,
      columns: state.columns,
      page_size: state.pageSize,
      play_limit: state.playLimit,
      wall_autoplay: state.wallAutoplay,
      preview_large_videos: state.previewLargeVideos,
      pause_when_inactive: state.pauseWhenInactive,
      floating_pager: state.floatingPagerEnabled,
      confirm_trash: state.confirmTrash,
      sort_mode: sortSelect.value,
      immersive: state.immersive,
      language: state.language,
      theme: state.theme,
      font_size: state.fontSize,
      content_align: state.contentAlign,
      button_style: state.buttonStyle,
    };
    const res = await apiFetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      state.all = [];
      state.view = [];
      renderGrid();
      showToast(data.error || t().scanFail, 4200);
      return;
    }
    state.perf.scanMs = Math.round(performance.now() - scanStart);
    state.all = data.videos || [];
    state.scannedPath = data.video_dir || videoDir;
    state.scanId = data.scan_id || "";
    if (state.showTrash) {
      state.showTrash = false;
      trashView.classList.add("hidden");
      grid.classList.remove("hidden");
    }
    state.pathHistory = data.config?.path_history || state.pathHistory;
    state.pathFavorites = data.config?.path_favorites || state.pathFavorites;
    syncDragRootsFromConfig(data.config || { drag_roots: state.dragRoots });
    state.recursive = !!data.recursive;
    state.filenameExcludeEnabled = data.config?.filename_exclude_enabled !== false;
    state.filenameExcludeKeywords = cleanExcludeKeywords(data.config?.filename_exclude_keywords || []);
    state.filenameExcludeScope = data.config?.filename_exclude_scope === "all" ? "all" : "image";
    state.blockedScanPaths = cleanBlockedScanPaths(data.config?.blocked_scan_paths || state.blockedScanPaths);
    state.minScanVolumeGb = Math.max(0, Math.min(1024, Number(data.config?.min_scan_volume_gb ?? state.minScanVolumeGb) || 0));
    state.lastExcludedCount = Number(data.excluded_count || 0);
    state.rememberPath = rememberPath.checked;
    state.sizeFilter = "all";
    state.dateFilter = "all";
    state.mediaType = "all";
    sizeFilterSelect.value = "all";
    dateFilterSelect.value = "all";
    updateMediaFilterUI();
    if (state.all.length === 0) {
      showToast(t().noVideosTitle, 3200);
    }
    applyFilters();
    renderPathPanel();
    renderHistoryMenu();
    updateFavoritePathButton();
    showToast(t().scanDone(state.all.length, state.lastExcludedCount));
  } catch (e) {
    console.error(e);
    showToast(t().scanFail, 4200);
  } finally {
    setBusy(false);
  }
}

async function saveSettingsSoft() {
  try {
    const response = await apiFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        remember_path: rememberPath.checked,
        last_video_dir: pathInput.value.trim(),
        recursive: recursiveScan.checked,
        filename_exclude_enabled: state.filenameExcludeEnabled,
        filename_exclude_keywords: state.filenameExcludeKeywords,
        filename_exclude_scope: state.filenameExcludeScope,
        blocked_scan_paths: state.blockedScanPaths,
        min_scan_volume_gb: state.minScanVolumeGb,
        drag_roots: state.dragRoots,
        columns: state.columns,
        page_size: state.pageSize,
        play_limit: state.playLimit,
        wall_autoplay: state.wallAutoplay,
        preview_large_videos: state.previewLargeVideos,
        pause_when_inactive: state.pauseWhenInactive,
        floating_pager: state.floatingPagerEnabled,
        confirm_trash: state.confirmTrash,
        sort_mode: sortSelect.value,
        immersive: state.immersive,
        language: state.language,
        theme: state.theme,
        font_size: state.fontSize,
        content_align: state.contentAlign,
        button_style: state.buttonStyle,
        slideshow_interval: state.slideshowInterval,
        slideshow_effect: state.slideshowEffect,
        slideshow_fit: state.slideshowFit,
        slideshow_loop: state.slideshowLoop,
      }),
    });
    if (!response.ok) throw new Error("Settings request failed");
    return true;
  } catch {
    return false;
  }
}

function setColumns(cols) {
  const next = Number(cols) || 6;
  state.columns = COLUMN_OPTIONS.includes(next) ? next : 6;
  applyLayout();
  if (isWallPreviewStatic()) pauseAllInline();
  else resumeVisibleInline();
  saveSettingsSoft();
}

function normalizePageSize(size) {
  const next = Math.floor(Number(size) || 120);
  return Math.max(1, Math.min(240, next));
}

function setPageSize(size) {
  state.pageSize = normalizePageSize(size);
  pageSizeInput.value = String(state.pageSize);
  state.gridPage = 0;
  applyLayout();
  renderGrid();
  saveSettingsSoft();
}

function setPlayLimit(limit, save = true) {
  const allowed = [4, 6, 8, 12, 18, 24, 36, 48, 72];
  const next = Number(limit) || 8;
  state.playLimit = allowed.includes(next) ? next : 8;
  playLimitSelect.value = String(state.playLimit);
  if (isWallPreviewStatic()) pauseAllInline();
  else resumeVisibleInline();
  if (save) saveSettingsSoft();
}

function setWallAutoplay(enabled, save = true) {
  state.wallAutoplay = !!enabled;
  wallAutoplay.checked = state.wallAutoplay;
  if (!isWallPreviewStatic() && state.playingEnabled) {
    resumeVisibleInline();
  } else {
    pauseAllInline();
  }
  if (save) saveSettingsSoft();
}

function setPreviewLargeVideos(enabled, save = true) {
  state.previewLargeVideos = !!enabled;
  previewLargeVideos.checked = state.previewLargeVideos;
  if (state.all.length) renderGrid();
  if (save) saveSettingsSoft();
}

function setPauseWhenInactive(enabled, save = true) {
  state.pauseWhenInactive = !!enabled;
  pauseWhenInactive.checked = state.pauseWhenInactive;
  if (state.pauseWhenInactive && document.hidden) {
    pauseActiveViewForInactive();
  } else if (!document.hidden) {
    resumeActiveViewAfterInactive();
  }
  if (save) saveSettingsSoft();
}

function setFloatingPager(enabled, save = true) {
  state.floatingPagerEnabled = !!enabled;
  floatingPagerEnabled.checked = state.floatingPagerEnabled;
  updateGridPager();
  if (state.floatingPagerEnabled) showFloatingPagerTemporarily(2200);
  if (save) saveSettingsSoft();
}

function setImmersive(enabled) {
  state.immersive = !!enabled;
  document.body.classList.toggle("immersive", state.immersive);
  applyActionButtons();
  updateSubInfo();
  saveSettingsSoft();
}

function setLanguage(lang, save = true) {
  state.language = lang === "zh" ? "zh" : "en";
  applyLanguage();
  if (state.all.length) renderGrid();
  if (save) saveSettingsSoft();
}

function setTheme(theme, save = true) {
  state.theme = theme === "light" ? "light" : "dark";
  try { localStorage.setItem("localVideoWallTheme", state.theme); } catch {}
  applyTheme();
  applyActionButtons();
  if (save) saveSettingsSoft();
}

function setFontSize(size, save = true) {
  state.fontSize = ["small", "standard", "large"].includes(size) ? size : "standard";
  try { localStorage.setItem("localVideoWallFontSize", state.fontSize); } catch {}
  applyFontSize();
  if (save) saveSettingsSoft();
}

function setContentAlign(align, save = true) {
  state.contentAlign = ["left", "center", "right"].includes(align) ? align : "center";
  applyLayout();
  if (save) saveSettingsSoft();
}

function setButtonStyle(style, save = true) {
  state.buttonStyle = style === "icons" ? "icons" : "text";
  try { localStorage.setItem("localVideoWallButtonStyle", state.buttonStyle); } catch {}
  applyActionButtons();
  updateReviewButtons();
  if (save) saveSettingsSoft();
}

function normalizeModalVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return 1;
  return Math.max(0, Math.min(1, volume));
}

function loadModalAudioPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem("localVideoWallModalAudio") || "null");
    if (!saved || typeof saved !== "object") return;
    state.modalMuted = !!saved.muted;
    state.modalVolume = normalizeModalVolume(saved.volume);
  } catch {}
}

function saveModalAudioPrefs() {
  try {
    localStorage.setItem("localVideoWallModalAudio", JSON.stringify({
      muted: !!state.modalMuted,
      volume: normalizeModalVolume(state.modalVolume),
    }));
  } catch {}
}

async function init() {
  try {
    await fetchBootstrap();
    const res = await fetch("/api/config");
    const data = await res.json();
    const cfg = data.config || {};
    const cfgColumns = Number(cfg.columns || 6);
    state.columns = COLUMN_OPTIONS.includes(cfgColumns) ? cfgColumns : 6;
    state.pageSize = normalizePageSize(cfg.page_size || 120);
    const allowedPlayLimits = [4, 6, 8, 12, 18, 24, 36, 48, 72];
    const cfgPlayLimit = Number(cfg.play_limit);
    state.playLimit = allowedPlayLimits.includes(cfgPlayLimit) ? cfgPlayLimit : 8;
    state.wallAutoplay = cfg.wall_autoplay !== false;
    state.previewLargeVideos = cfg.preview_large_videos === true;
    state.pauseWhenInactive = cfg.pause_when_inactive === true;
    state.floatingPagerEnabled = cfg.floating_pager === true;
    state.confirmTrash = cfg.confirm_trash !== false;
    state.recursive = !!cfg.recursive;
    state.filenameExcludeEnabled = cfg.filename_exclude_enabled !== false;
    state.filenameExcludeKeywords = cleanExcludeKeywords(cfg.filename_exclude_keywords || ["fanart", "thumb"]);
    state.filenameExcludeScope = cfg.filename_exclude_scope === "all" ? "all" : "image";
    state.blockedScanPaths = cleanBlockedScanPaths(cfg.blocked_scan_paths || []);
    state.minScanVolumeGb = Math.max(0, Math.min(1024, Number(cfg.min_scan_volume_gb ?? 1) || 0));
    state.rememberPath = !!cfg.remember_path;
    state.sortMode = cfg.sort_mode || "mtime_desc";
    state.immersive = !!cfg.immersive;
    state.language = cfg.language === "zh" ? "zh" : "en";
    state.pathHistory = Array.isArray(cfg.path_history) ? cfg.path_history : [];
    state.pathFavorites = Array.isArray(cfg.path_favorites) ? cfg.path_favorites : [];
    state.dragRoots = Array.isArray(cfg.drag_roots) ? cfg.drag_roots : [];
    dragOutController.setConfiguredRoots(state.dragRoots);
    let localTheme = "";
    let localButtonStyle = "";
    let localFontSize = "";
    try {
      localTheme = localStorage.getItem("localVideoWallTheme") || "";
      localButtonStyle = localStorage.getItem("localVideoWallButtonStyle") || "";
      localFontSize = localStorage.getItem("localVideoWallFontSize") || "";
    } catch {}
    state.theme = (localTheme || cfg.theme) === "light" ? "light" : "dark";
    state.fontSize = ["small", "standard", "large"].includes(localFontSize || cfg.font_size) ? (localFontSize || cfg.font_size) : "small";
    state.contentAlign = ["left", "center", "right"].includes(cfg.content_align) ? cfg.content_align : "center";
    state.buttonStyle = (localButtonStyle || cfg.button_style) === "icons" ? "icons" : "text";
    loadModalAudioPrefs();
    state.slideshowInterval = Math.max(1, Math.min(15, Number(cfg.slideshow_interval || 5)));
    state.slideshowEffect = ["none", "fade", "slide", "drift", "random"].includes(cfg.slideshow_effect) ? cfg.slideshow_effect : "drift";
    state.slideshowFit = cfg.slideshow_fit === "cover" ? "cover" : "contain";
    state.slideshowLoop = cfg.slideshow_loop !== false;
    pathInput.value = cfg.last_video_dir || "";
    rememberPath.checked = state.rememberPath;
    recursiveScan.checked = state.recursive;
    wallAutoplay.checked = state.wallAutoplay;
    previewLargeVideos.checked = state.previewLargeVideos;
    pauseWhenInactive.checked = state.pauseWhenInactive;
    floatingPagerEnabled.checked = state.floatingPagerEnabled;
    confirmTrash.checked = state.confirmTrash;
    sortSelect.value = state.sortMode;
    pageSizeInput.value = String(state.pageSize);
    playLimitSelect.value = String(state.playLimit);
    slideshowInterval.value = String(state.slideshowInterval);
    slideshowEffect.value = state.slideshowEffect;
    slideshowFit.value = state.slideshowFit;
    slideshowLoop.checked = state.slideshowLoop;
    applyLanguage();
    applyFontSize();
    renderPathPanel();
    applyLayout();
    setImmersive(state.immersive);
    await checkBackendCompatibility(true);
    if (state.rememberPath && pathInput.value.trim()) scanNow();
    else updateSubInfo();
  } catch (e) {
    console.error(e);
    showToast(t().configFail);
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchInput._t);
  searchInput._t = setTimeout(applyFilters, 120);
});
sortSelect.addEventListener("change", applyFilters);
folderPanelToggle.addEventListener("click", e => {
  e.stopPropagation();
  if (folderPanel.classList.contains("hidden")) openFolderPanel();
  else closeFolderPanel();
});
folderPanelClose.addEventListener("click", closeFolderPanel);
folderPanelRefresh.addEventListener("click", () => loadFolderRoots(true));
favoritePathBtn.addEventListener("click", e => {
  e.stopPropagation();
  toggleFavoritePath(pathInput.value);
});
dragPathBtn.addEventListener("click", e => {
  e.stopPropagation();
  handleDragAuthorizationClick(pathInput.value);
});
dragAuthorizeCurrentBtn.addEventListener("click", e => {
  e.stopPropagation();
  handleDragAuthorizationClick(pathInput.value);
});
pathHistoryToggle.addEventListener("click", e => {
  e.stopPropagation();
  toggleHistoryMenu();
});
pathHistoryMenu.addEventListener("pointerdown", e => e.stopPropagation());
pathHistoryMenu.addEventListener("click", e => {
  e.stopPropagation();
  const remove = e.target.closest("[data-history-remove]");
  if (!remove) return;
  e.preventDefault();
  removePathHistory(remove.dataset.historyRemove || "");
});
pathSuggestMenu.addEventListener("click", e => e.stopPropagation());
chooseFolderBtn.addEventListener("click", chooseFolder);
scanBtn.addEventListener("click", scanNow);
trashToggle.addEventListener("click", async e => {
  e.stopPropagation();
  if (!state.showTrash && !(await ensureTrashBackend())) return;
  setTrashView(!state.showTrash);
});
trashSelectAllBtn.addEventListener("click", () => {
  if (state.trashBusy) return;
  if (state.trashSelected.size === state.trashItems.length) state.trashSelected.clear();
  else state.trashSelected = new Set(state.trashItems.map(item => item.id));
  renderTrashView();
});
trashRestoreBtn.addEventListener("click", () => runTrashAction("restore", [...state.trashSelected]));
trashSystemBtn.addEventListener("click", () => runTrashAction("system_trash", [...state.trashSelected]));
settingsToggle.addEventListener("click", e => {
  e.stopPropagation();
  toggleSettingsMenu();
});
settingsMenu.addEventListener("click", e => e.stopPropagation());
excludeRulesOpen.addEventListener("click", openExcludeRulesDialog);
excludeRulesClose.addEventListener("click", closeExcludeRulesDialog);
excludeRulesCancel.addEventListener("click", closeExcludeRulesDialog);
excludeRulesSave.addEventListener("click", saveExcludeRules);
excludeRulesDialog.addEventListener("click", e => {
  if (e.target.dataset.excludeClose === "1") closeExcludeRulesDialog();
});
excludeRulesEnabled.addEventListener("change", () => {
  if (!excludeRulesDraft) return;
  excludeRulesDraft.enabled = excludeRulesEnabled.checked;
  renderExcludeRulesDraft();
});
excludeKeywordAdd.addEventListener("click", addExcludeKeyword);
excludeKeywordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    addExcludeKeyword();
  }
});
excludeScopeSeg.addEventListener("click", e => {
  const button = e.target.closest("button[data-exclude-scope]");
  if (!button || !excludeRulesDraft?.enabled) return;
  excludeRulesDraft.scope = button.dataset.excludeScope === "all" ? "all" : "image";
  renderExcludeRulesDraft();
});
scanProtectionOpen.addEventListener("click", openScanProtectionDialog);
scanProtectionClose.addEventListener("click", closeScanProtectionDialog);
scanProtectionCancel.addEventListener("click", closeScanProtectionDialog);
scanProtectionSave.addEventListener("click", saveScanProtection);
scanProtectionDialog.addEventListener("click", e => {
  if (e.target.dataset.scanProtectionClose === "1") closeScanProtectionDialog();
});
blockedScanPathAdd.addEventListener("click", addBlockedScanPath);
blockedScanPathInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    addBlockedScanPath();
  }
});
minScanVolumeSelect.addEventListener("change", () => {
  if (scanProtectionDraft) scanProtectionDraft.minVolumeGb = Number(minScanVolumeSelect.value) || 0;
});
document.addEventListener("click", () => {
  setSettingsMenuOpen(false);
  setHistoryMenuOpen(false);
  closePathSuggestions();
});
pathInput.addEventListener("input", () => {
  updateFavoritePathButton();
  updateDragAuthorizationUi();
  schedulePathSuggestions();
});
pathInput.addEventListener("focus", schedulePathSuggestions);
pathInput.addEventListener("keydown", e => {
  if (e.key === "ArrowDown" && movePathSuggestion(1)) {
    e.preventDefault();
    return;
  }
  if (e.key === "ArrowUp" && movePathSuggestion(-1)) {
    e.preventDefault();
    return;
  }
  if (e.key === "Escape" && !pathSuggestMenu.classList.contains("hidden")) {
    e.preventDefault();
    closePathSuggestions();
    return;
  }
  if (e.key === "Enter") {
    if (!pathSuggestMenu.classList.contains("hidden") && state.pathSuggestIndex >= 0) {
      e.preventDefault();
      applyPathSuggestion(state.pathSuggestIndex, true);
      return;
    }
    scanNow();
  }
});
rememberPath.addEventListener("change", saveSettingsSoft);
recursiveScan.addEventListener("change", saveSettingsSoft);
mediaFilterSeg.addEventListener("click", e => {
  const btn = e.target.closest("button[data-media-filter]");
  if (!btn) return;
  state.reviewFilter = "all";
  state.mediaType = btn.dataset.mediaFilter;
  updateMediaFilterUI();
  if (state.showTrash) {
    renderTrashView();
    saveSettingsSoft();
    return;
  }
  applyFilters();
});
columnsSelect.addEventListener("change", () => setColumns(columnsSelect.value));
pageSizeInput.addEventListener("change", () => setPageSize(pageSizeInput.value));
pageSizeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    pageSizeInput.blur();
  }
});
wallAutoplay.addEventListener("change", () => setWallAutoplay(wallAutoplay.checked));
playLimitSelect.addEventListener("change", () => setPlayLimit(playLimitSelect.value));
previewLargeVideos.addEventListener("change", () => setPreviewLargeVideos(previewLargeVideos.checked));
pauseWhenInactive.addEventListener("change", () => setPauseWhenInactive(pauseWhenInactive.checked));
floatingPagerEnabled.addEventListener("change", () => setFloatingPager(floatingPagerEnabled.checked));
confirmTrash.addEventListener("change", () => {
  state.confirmTrash = confirmTrash.checked;
  saveSettingsSoft();
});
sizeFilterSelect.addEventListener("change", () => {
  state.sizeFilter = sizeFilterSelect.value;
  applyFilters();
});
dateFilterSelect.addEventListener("change", () => {
  state.dateFilter = dateFilterSelect.value;
  applyFilters();
});
trashConfirmCancel.addEventListener("click", () => closeTrashConfirmDialog(false));
trashConfirmOk.addEventListener("click", () => closeTrashConfirmDialog(true));
trashConfirmDialog.addEventListener("click", e => {
  if (e.target.dataset.trashConfirm === "cancel") closeTrashConfirmDialog(false);
});
clearHistoryBtn.addEventListener("click", clearPathHistory);
topPagePrev.addEventListener("click", () => setGridPage(state.gridPage));
topPageNext.addEventListener("click", () => setGridPage(state.gridPage + 2));
gridPager.addEventListener("click", e => {
  const button = e.target.closest("button[data-page]");
  if (!button || button.disabled) return;
  setGridPage(button.dataset.page);
});
floatingPager.addEventListener("click", e => {
  const button = e.target.closest("button[data-page]");
  if (!button || button.disabled) return;
  setGridPage(button.dataset.page);
});
floatingPager.addEventListener("mouseenter", () => {
  state.floatingPagerHover = true;
  window.clearTimeout(state.floatingPagerTimer);
  floatingPager.classList.add("visible");
});
floatingPager.addEventListener("mouseleave", () => {
  state.floatingPagerHover = false;
  showFloatingPagerTemporarily(1200);
});
exportCsvBtn.addEventListener("click", exportCsv);
resetFiltersBtn.addEventListener("click", resetFilters);
batchToggleBtn.addEventListener("click", () => setBatchMode(!state.batchMode));
batchSelectPageBtn.addEventListener("click", selectCurrentPageForBatch);
batchClearBtn.addEventListener("click", clearBatchSelection);
batchFavoriteBtn.addEventListener("click", () => setBatchFavorite(true));
batchUnfavoriteBtn.addEventListener("click", () => setBatchFavorite(false));
batchTrashBtn.addEventListener("click", moveBatchToTrash);
batchExportBtn.addEventListener("click", exportBatchCsv);
batchExitBtn.addEventListener("click", () => setBatchMode(false));
pauseBtn.addEventListener("click", () => {
  state.playingEnabled = !state.playingEnabled;
  if (state.playingEnabled) {
    pauseBtn.classList.add("ghost");
    resumeVisibleInline();
  } else {
    pauseBtn.classList.remove("ghost");
    pauseAllInline();
  }
  applyActionButtons();
});
immersiveBtn.addEventListener("click", () => setImmersive(true));
expandBtn.addEventListener("click", () => setImmersive(false));
langToggle.addEventListener("click", () => setLanguage(state.language === "en" ? "zh" : "en"));
themeToggle.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
fontSizeSeg.addEventListener("click", event => {
  const button = event.target.closest("button[data-font-size]");
  if (button) setFontSize(button.dataset.fontSize);
});
contentAlignSeg.addEventListener("click", event => {
  const button = event.target.closest("button[data-content-align]");
  if (button) setContentAlign(button.dataset.contentAlign);
});
modalContentAlignSeg.addEventListener("click", event => {
  const button = event.target.closest("button[data-content-align]");
  if (button) setContentAlign(button.dataset.contentAlign);
});
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => {
  if (e.target?.dataset?.close) closeModal();
});
modal.addEventListener("mousemove", e => {
  if (modal.classList.contains("hidden")) return;
  pulseMediaNav(modalContent);
  handleAutoControls("modal", e);
});
modal.addEventListener("mouseleave", () => {
  if (!modal.classList.contains("hidden")) scheduleAutoHideControls("modal");
});
modal.addEventListener("wheel", e => {
  if (modal.classList.contains("hidden") || !state.currentModalItem) return;
  if (e.target.closest(".modal-metadata")) return;
  const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (!delta) return;
  e.preventDefault();
  if (state.currentModalItem.type === "video") {
    adjustModalVideoVolume(delta > 0 ? -0.05 : 0.05);
    return;
  }
  if (state.currentModalItem.type !== "image") return;
  const jump = getWheelJump("modal");
  showModalImage(delta > 0 ? jump : -jump);
}, { passive: false });
modalMetadata.addEventListener("wheel", e => {
  e.stopPropagation();
}, { passive: true });
modalPrev.addEventListener("click", () => {
  if (state.currentModalItem?.type === "image") showModalImage(-1);
  if (state.currentModalItem?.type === "video") showModalVideo(-1);
  pulseMediaNav(modalContent, 1400);
});
modalNext.addEventListener("click", () => {
  if (state.currentModalItem?.type === "image") showModalImage(1);
  if (state.currentModalItem?.type === "video") showModalVideo(1);
  pulseMediaNav(modalContent, 1400);
});
modalVideoModeSeg.addEventListener("click", e => {
  const btn = e.target.closest("button[data-video-mode]");
  if (!btn) return;
  state.videoMode = btn.dataset.videoMode;
  updateVideoModeUI();
});
modalFullscreen.addEventListener("click", toggleModalFullscreen);
modalImageUiToggle.addEventListener("click", () => setModalControlsHidden(true));
modalVideoUiToggle.addEventListener("click", () => setModalControlsHidden(true));
modalUiShow.addEventListener("click", () => setModalControlsHidden(false));
modalHiddenExitFullscreen.addEventListener("click", toggleModalFullscreen);
modalHiddenClose.addEventListener("click", closeModal);
modalImage.addEventListener("load", refreshModalMetadataPanel);
modalVideo.addEventListener("loadedmetadata", refreshModalMetadataPanel);
modalVideo.addEventListener("volumechange", () => {
  if (state.currentModalItem?.type !== "video") return;
  state.modalMuted = !!modalVideo.muted;
  state.modalVolume = normalizeModalVolume(modalVideo.volume);
  saveModalAudioPrefs();
});
modalVideo.addEventListener("ended", () => {
  if (state.currentModalItem?.type !== "video") return;
  if (state.videoMode === "sequence") showModalVideo(1);
  if (state.videoMode === "random") showModalVideo(0);
});
modalOpenFolder.addEventListener("click", () => {
  if (state.currentModalItem) openInExplorer(state.currentModalItem);
});
modalOpenDefault.addEventListener("click", () => {
  if (state.currentModalItem) openInDefaultApp(state.currentModalItem);
});
modalMetadata.addEventListener("click", async e => {
  const comfyBtn = e.target.closest("[data-open-comfy]");
  if (comfyBtn) {
    e.preventDefault();
    e.stopPropagation();
    const opened = window.open(COMFYUI_URL, "_blank", "noopener,noreferrer");
    if (!opened) showToast(COMFYUI_URL, 1800);
    return;
  }
  const btn = e.target.closest("[data-copy-meta]");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(btn.dataset.copyMeta || "");
    showToast(t().copied, 900);
  } catch {
    showToast(btn.dataset.copyMeta || "", 1800);
  }
});
modalFavorite.addEventListener("click", async () => {
  if (!state.currentModalItem) return;
  await toggleReview(state.currentModalItem, "favorite");
  applyActionButtons();
});
modalMoveTrash.addEventListener("click", () => runFileAction("move_trash"));
modalSlideshow.addEventListener("click", toggleModalSlideshow);
modalSlideshowFullscreen.addEventListener("click", openFullscreenSlideshowFromCurrent);
slideshow.addEventListener("mousemove", e => {
  if (slideshow.classList.contains("hidden")) return;
  pulseMediaNav(slideshow);
  handleAutoControls("slideshow", e);
});
slideshow.addEventListener("mouseleave", () => {
  if (!slideshow.classList.contains("hidden")) scheduleAutoHideControls("slideshow");
});
slideshowClose.addEventListener("click", returnSlideshowToModal);
slideshowPrev.addEventListener("click", () => showNextSlide(-1));
slideshowNext.addEventListener("click", () => showNextSlide(1));
slideshowMoveTrash.addEventListener("click", () => runFileAction("move_trash", state.slideshowItems[state.slideshowIndex], "slideshow"));
slideshowSidePrev.addEventListener("click", () => showNextSlide(-1));
slideshowSideNext.addEventListener("click", () => showNextSlide(1));
slideshowPlay.addEventListener("click", toggleSlideshowPlay);
slideshowFullscreen.addEventListener("click", toggleSlideshowFullscreen);
slideshowUiToggle.addEventListener("click", () => setSlideshowControlsHidden(true));
slideshowUiShow.addEventListener("click", () => setSlideshowControlsHidden(false));
slideshowExitFullscreen.addEventListener("click", toggleSlideshowFullscreen);
slideshowBackToPreview.addEventListener("click", returnSlideshowToModal);
slideshow.addEventListener("wheel", e => {
  if (slideshow.classList.contains("hidden")) return;
  if (e.target.closest(".slideshow-top, .slideshow-controls, button, select, input, label")) return;
  const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (!delta) return;
  e.preventDefault();
  const jump = getWheelJump("slideshow");
  showNextSlide(delta > 0 ? jump : -jump);
}, { passive: false });
slideshowInterval.addEventListener("change", () => {
  state.slideshowInterval = Math.max(1, Math.min(15, Number(slideshowInterval.value) || 5));
  saveSettingsSoft();
  scheduleSlideshow();
});
slideshowEffect.addEventListener("change", () => {
  state.slideshowEffect = slideshowEffect.value;
  saveSettingsSoft();
  renderSlideshow(1);
});
slideshowFit.addEventListener("change", () => {
  state.slideshowFit = slideshowFit.value;
  saveSettingsSoft();
  renderSlideshow(1);
});
slideshowLoop.addEventListener("change", () => {
  state.slideshowLoop = slideshowLoop.checked;
  saveSettingsSoft();
});
window.addEventListener("keydown", e => {
  const editingTarget = document.activeElement?.closest?.("input, textarea, select, [contenteditable=\"true\"]");
  if (!trashConfirmDialog.classList.contains("hidden")) {
    if (e.key === "Escape") closeTrashConfirmDialog(false);
    return;
  }
  if (e.key === "Escape" && !excludeRulesDialog.classList.contains("hidden")) {
    closeExcludeRulesDialog();
    return;
  }
  if (e.key === "Escape" && !scanProtectionDialog.classList.contains("hidden")) {
    closeScanProtectionDialog();
    return;
  }
  if (e.key === "Escape" && !settingsMenu.classList.contains("hidden")) {
    setSettingsMenuOpen(false);
    return;
  }
  if (e.key === "Escape" && !pathHistoryMenu.classList.contains("hidden")) {
    setHistoryMenuOpen(false);
    return;
  }
  if (!slideshow.classList.contains("hidden")) {
    if (e.key === "Delete" && !editingTarget) {
      e.preventDefault();
      runFileAction("move_trash", state.slideshowItems[state.slideshowIndex], "slideshow");
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      returnSlideshowToModal();
    }
    if (e.key === " ") {
      e.preventDefault();
      toggleSlideshowPlay();
    }
    if (e.key === "ArrowLeft") showNextSlide(-1);
    if (e.key === "ArrowRight") showNextSlide(1);
    return;
  }
  if (!modal.classList.contains("hidden")) {
    if (e.key === "Delete" && !editingTarget && state.currentModalItem) {
      e.preventDefault();
      runFileAction("move_trash");
      return;
    }
    if (e.key === "Escape") {
      if (state.modalSlideshowPlaying) {
        e.preventDefault();
        setModalSlideshowPlaying(false);
        return;
      }
      closeModal();
      return;
    }
    if (state.currentModalItem?.type === "image") {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showModalImage(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showModalImage(1);
      }
      return;
    }
    if (state.currentModalItem?.type === "video") {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showModalVideo(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showModalVideo(1);
      }
      return;
    }
  }
  if (e.key === "Escape") {
    if (!modal.classList.contains("hidden")) closeModal();
    else if (state.batchMode) setBatchMode(false);
    else if (state.immersive) setImmersive(false);
  }
});
document.addEventListener("fullscreenchange", handleFullscreenChange);
window.addEventListener("scroll", () => {
  showFloatingPagerTemporarily();
}, { passive: true });
window.addEventListener("resize", () => {
  applyLayout();
  positionFloatingPager();
  scheduleUpdatePlaying();
});
document.addEventListener("visibilitychange", () => {
  if (!state.pauseWhenInactive) return;
  if (document.hidden) {
    pauseActiveViewForInactive();
  } else {
    resumeActiveViewAfterInactive();
  }
});
window.addEventListener("blur", () => {
  if (state.pauseWhenInactive) pauseActiveViewForInactive();
});
window.addEventListener("focus", () => {
  if (state.pauseWhenInactive && !document.hidden) resumeActiveViewAfterInactive();
});
init();
