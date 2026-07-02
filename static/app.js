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
  currentModalMetadata: null,
  currentModalMetadataLoading: false,
  currentModalMetadataError: "",
  visibleVideos: new Set(),
  columns: 6,
  pageSize: 120,
  playLimit: 36,
  recursive: false,
  filenameExcludeEnabled: true,
  filenameExcludeKeywords: ["fanart", "thumb"],
  filenameExcludeScope: "image",
  lastExcludedCount: 0,
  rememberPath: false,
  sortMode: "mtime_desc",
  reviewFilter: "all",
  batchMode: false,
  batchSelected: new Set(),
  batchBusy: false,
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
  metadataRequestId: 0,
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
  perf: { scanMs: 0, renderMs: 0, pageItems: 0, loadedMedia: 0 },
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
  updateTimer: null,
};

const COLUMN_WIDTHS = { 2: 420, 3: 350, 4: 300, 5: 260, 6: 220, 7: 190, 8: 165, 9: 145, 10: 120, 11: 108, 12: 94, 13: 86, 14: 80, 15: 72, 16: 66, 17: 62, 18: 58, 19: 54, 20: 50 };
const COLUMN_GAPS = { 2: 18, 3: 18, 4: 18, 5: 18, 6: 18, 7: 16, 8: 14, 9: 12, 10: 10, 11: 9, 12: 8, 13: 7, 14: 7, 15: 6, 16: 6, 17: 5, 18: 5, 19: 5, 20: 5 };
const COLUMN_OPTIONS = Object.keys(COLUMN_WIDTHS).map(Number);
const LARGE_VIDEO_MB = 500;
const COMFYUI_URL = "http://127.0.0.1:8188/";

const ICONS = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/><path d="M9 12h11"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  checkbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
  checkboxChecked: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M8.5 12.2l2.4 2.4 4.8-5.2"/></svg>',
  doubleCheck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12l3 3L21 5"/><path d="M3 12l3 3 5-5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  externalOpen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"/><path d="M9.9 4.3A10.6 10.6 0 0 1 12 4c6 0 10 8 10 8a17.8 17.8 0 0 1-3.1 4.3"/><path d="M6.2 6.5C3.5 8.3 2 12 2 12s4 8 10 8a10 10 0 0 0 5-1.4"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2"/></svg>',
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
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>',
  sidebar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M6 8h.01"/><path d="M6 12h.01"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 7h3c4 0 5 10 9 10h5"/><path d="M16 21h5v-5"/><path d="M4 17h3c1.7 0 2.9-1.8 4-4"/><path d="M14 7c.8-.7 1.8-1 3-1h4"/></svg>',
  slideshow: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M10 8v5l4-2.5z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  textMode: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18h14"/><path d="M8 18l4-12 4 12"/><path d="M9.5 13h5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></svg>',
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
    confirmTrashSetting: "Confirm before moving media to Recycle Bin",
    trashConfirmTitle: "Move to Recycle Bin?",
    trashConfirmMessage: "Move this file to the Windows Recycle Bin?",
    trashConfirmDontAsk: "Don't ask again",
    trashConfirmMove: "Move",
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
    batchSelectPage: "Select page",
    batchClear: "Clear",
    batchFavorite: "Favorite",
    batchUnfavorite: "Unfavorite",
    batchTrash: "Move to Recycle Bin",
    batchExport: "Export CSV",
    batchSelectItem: "Select",
    batchSelectedItem: "Selected",
    batchNoSelection: "Select at least one item first.",
    batchDone: n => `Batch action finished: ${n} item(s).`,
    batchWorking: "Batch action in progress...",
    batchFailed: reason => `Batch action failed: ${reason}`,
    batchPartial: (done, failed, reason) => `Batch action finished: ${done} succeeded, ${failed} failed. ${reason}`,
    batchTrashConfirm: n => `Move ${n} selected item(s) to the Windows Recycle Bin?`,
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
    moveTrash: "Move to Recycle Bin",
    confirmReview: "Move this file to _video_wall_review? The original file path will change.",
    fileActionDone: "File moved. The current list was updated.",
    fileActionFail: "File action failed.",
    perfInfo: stats => `scan ${stats.scanMs}ms · render ${stats.renderMs}ms · page ${stats.pageItems} · loaded ${stats.loadedMedia}`,
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
    confirmTrashSetting: "移到回收站前确认",
    trashConfirmTitle: "移到回收站？",
    trashConfirmMessage: "要把这个文件移动到 Windows 系统回收站吗？",
    trashConfirmDontAsk: "以后不再提示",
    trashConfirmMove: "移动",
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
    batchSelectPage: "全选本页",
    batchClear: "清空",
    batchFavorite: "收藏",
    batchUnfavorite: "取消收藏",
    batchTrash: "移到回收站",
    batchExport: "导出 CSV",
    batchSelectItem: "选择",
    batchSelectedItem: "已选择",
    batchNoSelection: "请先选择至少一个项目。",
    batchDone: n => `批量操作完成：${n} 个项目。`,
    batchWorking: "正在执行批量操作...",
    batchFailed: reason => `批量操作失败：${reason}`,
    batchPartial: (done, failed, reason) => `批量操作完成：成功 ${done} 个，失败 ${failed} 个。${reason}`,
    batchTrashConfirm: n => `要把已选择的 ${n} 个项目移到 Windows 回收站吗？`,
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
    moveTrash: "移到回收站",
    confirmReview: "要把这个文件移动到 _video_wall_review 整理夹吗？原文件路径会变化。",
    fileActionDone: "文件已移动，当前列表已更新。",
    fileActionFail: "文件操作失败。",
    perfInfo: stats => `扫描 ${stats.scanMs}ms · 渲染 ${stats.renderMs}ms · 本页 ${stats.pageItems} · 已加载 ${stats.loadedMedia}`,
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
const modalMoveReview = $("#modalMoveReview");
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
  document.body.classList.remove("content-align-left", "content-align-center", "content-align-right");
  document.body.classList.add(`content-align-${align}`);
  contentAlignSeg.querySelectorAll("button[data-content-align]").forEach(button => {
    button.classList.toggle("active", button.dataset.contentAlign === align);
  });
  modalContentAlignSeg?.querySelectorAll("button[data-content-align]").forEach(button => {
    button.classList.toggle("active", button.dataset.contentAlign === align);
  });
}

function isModalFullscreen() {
  return document.fullscreenElement === modalContent;
}

function isSlideshowFullscreen() {
  return document.fullscreenElement === slideshow;
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
  setButtonLabel(batchToggleBtn, state.batchMode ? tx.batchExit : tx.batch, "doubleCheck", { iconOnly: true });
  setButtonLabel(batchSelectPageBtn, tx.batchSelectPage, "check", { iconOnly: true });
  setButtonLabel(batchClearBtn, tx.batchClear, "close", { iconOnly: true });
  setButtonLabel(batchFavoriteBtn, tx.batchFavorite, "star", { iconOnly: true });
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
  setButtonLabel(modalMoveReview, tx.moveReview, "star", { iconOnly: true });
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
  updateFullscreenLabels();
}

function fmtBytes(mb) {
  return `${Number(mb).toFixed(2)} MB`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[s]));
}

function showToast(message, ms = 2600) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), ms);
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
  $("#settingsPlaybackTitle").textContent = tx.playbackSettings;
  $("#settingsFiltersTitle").textContent = tx.filterSettings;
  $("#settingsActionsTitle").textContent = tx.actionSettings;
  exportCsvBtn.textContent = tx.exportCsv;
  pauseBtn.textContent = state.playingEnabled ? tx.pauseAll : tx.resume;
  immersiveBtn.textContent = state.immersive ? tx.exitImmersive : tx.immersive;
  modalSlideshow.textContent = state.modalSlideshowPlaying ? tx.pause : tx.slideshow;
  modalSlideshow.classList.toggle("primary", state.modalSlideshowPlaying);
  modalSlideshowFullscreen.textContent = tx.fullscreen;
  modalMoveReview.textContent = tx.moveReview;
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
  if (!excludeRulesDialog.classList.contains("hidden")) renderExcludeRulesDraft();
  if (state.currentModalItem) renderModalMetadata(state.currentModalItem);
}

function applyLayout() {
  const cols = Number(state.columns) || 6;
  const gap = COLUMN_GAPS[cols] || 18;
  const contentWidth = getContentWidthRule();
  applyContentAlign();
  document.documentElement.style.setProperty("--columns", cols);
  document.documentElement.style.setProperty("--gap", `${gap}px`);
  document.documentElement.style.setProperty("--content-width", contentWidth);
  document.body.classList.toggle("dense-grid", cols >= 12);
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

function updateSubInfo() {
  const tx = t();
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
  return Math.max(1, Math.ceil(state.view.length / state.pageSize));
}

function shouldShowPager() {
  return state.view.length > state.pageSize;
}

function modalIsOpen() {
  return !modal.classList.contains("hidden") || !slideshow.classList.contains("hidden");
}

function updatePagerButtonState(prevButton, nextButton, pages) {
  if (!prevButton || !nextButton) return;
  prevButton.disabled = state.gridPage <= 0;
  nextButton.disabled = state.gridPage >= pages - 1;
}

function visiblePageNumbers(current, pages) {
  const count = window.innerWidth < 760 ? 3 : 5;
  let start = Math.max(1, current - Math.floor(count / 2));
  let end = Math.min(pages, start + count - 1);
  start = Math.max(1, end - count + 1);
  const result = [];
  for (let page = start; page <= end; page += 1) result.push(page);
  return result;
}

function floatingPagerButton(label, page, options = {}) {
  const disabled = options.disabled ? " disabled" : "";
  const active = options.active ? " active" : "";
  const title = escapeHtml(options.title || label);
  return `<button class="floating-page-btn${active}" type="button" data-page="${page}" title="${title}" aria-label="${title}"${disabled}>${escapeHtml(label)}</button>`;
}

function renderPagerButtons(pages) {
  const tx = t();
  const current = state.gridPage + 1;
  const numbers = visiblePageNumbers(current, pages);
  const parts = [
    floatingPagerButton(tx.pageFirst, 1, { title: tx.pageFirst, disabled: state.gridPage <= 0 }),
    floatingPagerButton("‹", current - 1, { title: tx.pagePrevious, disabled: state.gridPage <= 0 }),
  ];
  if (numbers[0] > 1) parts.push('<span class="floating-page-ellipsis">...</span>');
  for (const page of numbers) {
    parts.push(floatingPagerButton(String(page), page, { active: page === current, title: tx.pageStatus(page, pages) }));
  }
  if (numbers[numbers.length - 1] < pages) parts.push('<span class="floating-page-ellipsis">...</span>');
  parts.push(
    floatingPagerButton("›", current + 1, { title: tx.pageNext, disabled: state.gridPage >= pages - 1 }),
    floatingPagerButton(tx.pageLast, pages, { title: tx.pageLast, disabled: state.gridPage >= pages - 1 }),
  );
  return parts.join("");
}

function renderBottomPager(pages) {
  const show = shouldShowPager() && !state.floatingPagerEnabled;
  gridPager.classList.toggle("hidden", !show);
  if (!show) {
    gridPager.innerHTML = "";
    return;
  }
  gridPager.innerHTML = `
    <div class="grid-pager-buttons">${renderPagerButtons(pages)}</div>
    <span class="grid-pager-info">${escapeHtml(t().pageInfo(state.gridPage + 1, pages, state.view.length))}</span>
  `;
}

function renderFloatingPager(pages) {
  const show = shouldShowPager() && state.floatingPagerEnabled && !modalIsOpen();
  floatingPager.classList.toggle("hidden", !show);
  if (!show) {
    floatingPager.innerHTML = "";
    return;
  }
  floatingPager.innerHTML = renderPagerButtons(pages);
  positionFloatingPager();
}

function positionFloatingPager() {
  if (!floatingPager || floatingPager.classList.contains("hidden")) return;
  const anchor = grid.offsetParent ? grid : document.getElementById("mainArea");
  const rect = anchor.getBoundingClientRect();
  const viewport = window.innerWidth || document.documentElement.clientWidth || 0;
  const left = Math.max(12, Math.min(rect.left + rect.width / 2, viewport - 12));
  floatingPager.style.setProperty("--floating-pager-left", `${Math.round(left)}px`);
  floatingPager.classList.toggle("compact", rect.width < 560);
}

function showFloatingPagerTemporarily(ms = 1700) {
  if (!state.floatingPagerEnabled || !shouldShowPager() || modalIsOpen()) return;
  positionFloatingPager();
  floatingPager.classList.add("visible");
  window.clearTimeout(state.floatingPagerTimer);
  state.floatingPagerTimer = window.setTimeout(() => {
    if (!state.floatingPagerHover) floatingPager.classList.remove("visible");
  }, ms);
}

function hideFloatingPager() {
  window.clearTimeout(state.floatingPagerTimer);
  floatingPager.classList.remove("visible");
}

function updateGridPager() {
  const pages = gridPageCount();
  state.gridPage = Math.max(0, Math.min(state.gridPage, pages - 1));
  const show = shouldShowPager();
  topPager.classList.toggle("hidden", !show);
  updatePagerButtonState(topPagePrev, topPageNext, pages);
  applyActionButtons();
  renderBottomPager(pages);
  renderFloatingPager(pages);
}

function setGridPage(page) {
  const pages = gridPageCount();
  state.gridPage = Math.max(0, Math.min(Math.floor(Number(page) || 1) - 1, pages - 1));
  renderGrid();
  document.getElementById("mainArea")?.scrollIntoView({ block: "start" });
  showFloatingPagerTemporarily(2200);
}

function renderEmptyState() {
  if (!state.scannedPath) {
    emptyState.classList.add("hidden");
    emptyState.innerHTML = "";
    return;
  }
  const tx = t();
  const filtered = state.all.length > 0;
  emptyState.innerHTML = `
    <h2>${escapeHtml(filtered ? tx.noMatchTitle : tx.noMediaTitle)}</h2>
    <p>${escapeHtml(filtered ? tx.noMatchBody : tx.noMediaBody)}</p>
  `;
  emptyState.classList.remove("hidden");
}

function renderGrid() {
  const renderStart = performance.now();
  destroyObservers();
  releaseGridMedia();
  grid.innerHTML = "";
  emptyState.classList.add("hidden");
  if (state.view.length === 0) {
    state.perf.pageItems = 0;
    state.perf.loadedMedia = 0;
    state.perf.renderMs = Math.round(performance.now() - renderStart);
    updateGridPager();
    updateSubInfo();
    renderEmptyState();
    return;
  }
  const frag = document.createDocumentFragment();
  const pageStart = state.gridPage * state.pageSize;
  const pageItems = state.view.slice(pageStart, pageStart + state.pageSize);
  state.perf.pageItems = pageItems.length;
  for (const item of pageItems) {
    const card = document.createElement("article");
    card.className = "video-card";
    card.dataset.key = item.key;
    card.dataset.rel = item.rel;
    const largeVideoPlaceholder = item.type === "video"
      && Number(item.size_mb) > LARGE_VIDEO_MB
      && !state.previewLargeVideos;
    card.classList.toggle("large-video-card", largeVideoPlaceholder);
    const mediaHtml = item.type === "image"
      ? `<img class="media-image" data-src="${item.url}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" />`
      : largeVideoPlaceholder
        ? `<div class="large-video-placeholder">${ICONS.play}<strong>${t().largeVideoTitle}</strong><span>${fmtBytes(item.size_mb)}</span><small>${t().largeVideoHint}</small></div>`
      : `<video muted loop playsinline preload="none" data-src="${item.url}" data-rel="${escapeHtml(item.rel)}"></video>`;
    card.innerHTML = `
      <div class="video-wrap" title="${escapeHtml(item.name)}">
        ${mediaHtml}
        <div class="card-quick-actions">
          <button class="review-btn card-favorite-btn" data-review-field="favorite"></button>
          <button class="batch-select-btn" data-batch-select="${escapeHtml(item.key)}"></button>
        </div>
        <div class="video-overlay"><div class="video-name">${escapeHtml(item.name)}</div></div>
      </div>
      <div class="card-footer">
        <div class="meta">
          <div>${escapeHtml(item.name)}</div>
          <div>${fmtBytes(item.size_mb)} · ${escapeHtml(item.mtime_text)}</div>
        </div>
        <button class="tiny-btn" data-open="${escapeHtml(item.rel)}">${t().location}</button>
      </div>`;
    card.classList.toggle("is-favorite", !!item.favorite);
    card.classList.toggle("is-batch-selected", state.batchSelected.has(item.key));
    card.querySelector(".video-wrap").addEventListener("click", () => {
      if (state.batchMode) {
        toggleBatchItem(item.key);
        return;
      }
      openModal(item);
    });
    card.querySelector(".tiny-btn").addEventListener("click", e => {
      e.stopPropagation();
      openInExplorer(item);
    });
    card.querySelectorAll(".review-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        toggleReview(item, btn.dataset.reviewField);
      });
    });
    card.querySelector(".batch-select-btn").addEventListener("click", e => {
      e.stopPropagation();
      toggleBatchItem(item.key);
    });
    frag.appendChild(card);
  }
  grid.appendChild(frag);
  updateReviewButtons();
  setupObservers();
  updateGridPager();
  state.perf.renderMs = Math.round(performance.now() - renderStart);
  state.perf.loadedMedia = countLoadedMedia();
  updateSubInfo();
}

function updateReviewButtons() {
  const tx = t();
  document.querySelectorAll(".video-card").forEach(card => {
    const item = state.all.find(v => v.key === card.dataset.key);
    if (!item) return;
    const favoriteBtn = card.querySelector('[data-review-field="favorite"]');
    const batchBtn = card.querySelector("[data-batch-select]");
    if (favoriteBtn) {
      setButtonLabel(favoriteBtn, item.favorite ? tx.favorited : tx.favorite, "star", { iconOnly: true });
      favoriteBtn.classList.toggle("active", !!item.favorite);
    }
    if (batchBtn) {
      setButtonLabel(batchBtn, state.batchSelected.has(item.key) ? tx.batchSelectedItem : tx.batchSelectItem, state.batchSelected.has(item.key) ? "checkboxChecked" : "checkbox", { iconOnly: true });
      batchBtn.classList.toggle("active", state.batchSelected.has(item.key));
    }
  });
  updateBatchUI();
}

function updateMediaFilterUI() {
  if (state.reviewFilter === "selected") state.reviewFilter = "all";
  if (!["all", "video", "image", "favorites"].includes(state.mediaType)) state.mediaType = "all";
  mediaFilterSeg.querySelectorAll("button[data-media-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mediaFilter === state.mediaType);
  });
}

function currentPageItems() {
  const pageStart = state.gridPage * state.pageSize;
  return state.view.slice(pageStart, pageStart + state.pageSize);
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
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: item.key, favorite: value }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || t().reviewFail);
        item.favorite = !!data.review.favorite;
        state.all = state.all.map(v => v.key === item.key ? { ...v, favorite: item.favorite } : v);
        state.view = state.view.map(v => v.key === item.key ? { ...v, favorite: item.favorite } : v);
        done += 1;
      } catch (err) {
        console.error(err);
        errors.push(err.message || t().reviewFail);
      }
    }
  } finally {
    state.batchBusy = false;
  }
  applyFilters(false);
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
  if (state.confirmTrash && !window.confirm(t().batchTrashConfirm(items.length))) return;
  let done = 0;
  const errors = [];
  state.batchBusy = true;
  updateBatchUI();
  showToast(t().batchWorking, 1800);
  try {
    for (const item of items) {
      try {
        await releaseMediaBeforeFileAction(item, "batch");
        const res = await fetch("/api/file-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "move_trash", rel: item.rel, scan_id: item.scan_id || state.scanId || "", confirm: true }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || t().fileActionFail);
        state.batchSelected.delete(item.key);
        state.all = state.all.filter(v => v.key !== item.key);
        state.view = state.view.filter(v => v.key !== item.key);
        done += 1;
      } catch (err) {
        console.error(err);
        errors.push(err.message || t().fileActionFail);
      }
    }
  } finally {
    state.batchBusy = false;
  }
  applyFilters(false);
  if (errors.length && done) showToast(t().batchPartial(done, errors.length, errors[0]), 6200);
  else if (errors.length) showToast(t().batchFailed(errors[0]), 6200);
  else showToast(t().batchDone(done));
}

async function toggleReview(item, field) {
  const nextValue = !item[field];
  const payload = { key: item.key, [field]: nextValue };
  try {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().reviewFail);
    item.favorite = !!data.review.favorite;
    item.selected = !!data.review.selected;
    state.all = state.all.map(v => v.key === item.key ? { ...v, favorite: item.favorite, selected: item.selected } : v);
    state.view = state.view.map(v => v.key === item.key ? { ...v, favorite: item.favorite, selected: item.selected } : v);
    applyFilters(false);
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
let playObserver = null;

function destroyObservers() {
  if (loadObserver) loadObserver.disconnect();
  if (playObserver) playObserver.disconnect();
  loadObserver = null;
  playObserver = null;
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
  document.querySelectorAll(".video-wrap video, .video-wrap img.media-image").forEach(releaseMediaElement);
  state.visibleVideos.clear();
  state.perf.loadedMedia = 0;
}

function setupObservers() {
  const images = [...document.querySelectorAll(".video-wrap img.media-image")];
  const videos = [...document.querySelectorAll(".video-wrap video")];
  loadObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const media = entry.target;
      if (entry.isIntersecting) ensureSrc(media);
      else {
        if (media.tagName === "VIDEO") {
          state.visibleVideos.delete(media);
          media.closest(".video-card")?.classList.remove("paused-by-limit");
        }
        pauseAndRelease(media);
      }
    }
  }, { root: null, rootMargin: "300px 0px", threshold: .01 });
  playObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) state.visibleVideos.add(video);
      else {
        state.visibleVideos.delete(video);
        video.pause();
        video.closest(".video-card")?.classList.remove("paused-by-limit");
      }
    }
    scheduleUpdatePlaying();
  }, { root: null, rootMargin: "160px 0px 220px 0px", threshold: [0, .1, .25, .5] });
  for (const image of images) loadObserver.observe(image);
  for (const video of videos) {
    loadObserver.observe(video);
    playObserver.observe(video);
  }
  scheduleUpdatePlaying();
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

function isActuallyVisible(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

function visibleAreaRatio(el) {
  const r = el.getBoundingClientRect();
  const width = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
  const height = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
  const area = Math.max(1, r.width * r.height);
  return (width * height) / area;
}

function distanceToViewportCenter(el) {
  const r = el.getBoundingClientRect();
  return Math.hypot((r.left + r.width / 2) - window.innerWidth / 2, (r.top + r.height / 2) - window.innerHeight / 2);
}

function isNearPageBottom() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  return scrollTop + window.innerHeight >= docHeight - 160;
}

function effectiveWallPlayLimit() {
  return state.columns >= 10 ? 0 : Math.max(12, Math.min(72, Number(state.playLimit) || 36));
}

function isWallPreviewStatic() {
  return !state.wallAutoplay || effectiveWallPlayLimit() <= 0;
}

function scheduleUpdatePlaying() {
  if (state.updateTimer) return;
  state.updateTimer = requestAnimationFrame(() => {
    state.updateTimer = null;
    updatePlaying();
  });
}

function updatePlaying() {
  const videos = [...state.visibleVideos].filter(v => v.isConnected && isActuallyVisible(v) && visibleAreaRatio(v) >= .08);
  const playLimit = effectiveWallPlayLimit();
  const nearBottom = isNearPageBottom();
  const selected = videos.sort((a, b) => {
    const ratioDelta = visibleAreaRatio(b) - visibleAreaRatio(a);
    if (Math.abs(ratioDelta) > .12) return ratioDelta;
    if (nearBottom) return b.getBoundingClientRect().top - a.getBoundingClientRect().top;
    return distanceToViewportCenter(a) - distanceToViewportCenter(b);
  }).slice(0, playLimit);
  const selectedSet = new Set(selected);
  for (const video of videos) {
    const card = video.closest(".video-card");
    if (isWallPreviewStatic() && state.playingEnabled && modal.classList.contains("hidden")) {
      ensureSrc(video);
      video.pause();
      card?.classList.remove("paused-by-limit");
      continue;
    }
    if (!state.playingEnabled || (state.pauseWhenInactive && document.hidden) || !modal.classList.contains("hidden")) {
      video.pause();
      card?.classList.remove("paused-by-limit");
      continue;
    }
    if (selectedSet.has(video)) {
      card?.classList.remove("paused-by-limit");
      ensureSrc(video);
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.play().catch(() => {});
    } else {
      video.pause();
      card?.classList.add("paused-by-limit");
    }
  }
}

function pauseAllInline() {
  document.querySelectorAll(".video-wrap video").forEach(v => {
    v.pause();
    v.closest(".video-card")?.classList.remove("paused-by-limit");
  });
}

function resumeVisibleInline() {
  scheduleUpdatePlaying();
}

function pauseActiveViewForInactive() {
  if (state.pausedForInactive) return;
  state.pausedForInactive = true;
  state.wasModalVideoPlayingBeforeHidden = !modal.classList.contains("hidden") && !modalVideo.paused;
  state.wasSlideshowPlayingBeforeHidden = !slideshow.classList.contains("hidden") && state.slideshowPlaying;
  pauseAllInline();
  modalVideo.pause();
  if (state.wasSlideshowPlayingBeforeHidden) {
    state.slideshowPlaying = false;
    clearTimeout(state.slideshowTimer);
    applyActionButtons();
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
    state.slideshowPlaying = true;
    applyActionButtons();
    scheduleSlideshow();
  }
  state.wasModalVideoPlayingBeforeHidden = false;
  state.wasSlideshowPlayingBeforeHidden = false;
}

function updateVideoModeUI() {
  const tx = t();
  const modeLabels = {
    loop: [tx.loopOne, "repeat"],
    sequence: [tx.sequential, "list"],
    random: [tx.randomPlay, "shuffle"],
  };
  modalVideoModeSeg.querySelectorAll("button[data-video-mode]").forEach(btn => {
    const [label, icon] = modeLabels[btn.dataset.videoMode] || [btn.textContent, "play"];
    setButtonLabel(btn, label, icon, { iconOnly: true });
    btn.classList.toggle("active", btn.dataset.videoMode === state.videoMode);
  });
  modalVideo.loop = state.videoMode === "loop";
}

function updateModalNav() {
  const currentType = state.currentModalItem?.type;
  const items = currentType === "image" ? currentImageItems() : currentType === "video" ? currentVideoItems() : [];
  const canNavigate = items.length > 1;
  modalPrev.classList.toggle("hidden", !canNavigate);
  modalNext.classList.toggle("hidden", !canNavigate);
}

function renderMetadataBlock(title, value, options = {}) {
  const safeValue = String(value || "").trim();
  if (!safeValue && options.hideEmpty) return "";
  const body = safeValue || t().metadataPending;
  const collapsed = !!options.collapsed;
  const copy = safeValue
    ? `<button class="metadata-copy" type="button" data-copy-meta="${escapeHtml(safeValue)}">${escapeHtml(t().copy)}</button>`
    : "";
  if (collapsed) {
    return `
      <details class="metadata-block metadata-fold">
        <summary><span>${escapeHtml(title)}</span>${copy}</summary>
        <p>${escapeHtml(body)}</p>
      </details>`;
  }
  return `
    <section class="metadata-block">
      <div class="metadata-block-head"><strong>${escapeHtml(title)}</strong>${copy}</div>
      <p>${escapeHtml(body)}</p>
    </section>`;
}

function renderMetadataLoraBlock(value, options = {}) {
  const items = Array.isArray(value)
    ? value.map(item => String(item || "").trim()).filter(Boolean)
    : String(value || "").split(",").map(item => item.trim()).filter(Boolean);
  if (!items.length) return "";
  const copyText = items.join("\n");
  const content = `
    <ul class="metadata-lora-list">
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>`;
  if (options.collapsed) {
    return `
      <details class="metadata-block metadata-fold metadata-lora-block">
        <summary><span>${escapeHtml(t().metadataLora)}</span><button class="metadata-copy" type="button" data-copy-meta="${escapeHtml(copyText)}">${escapeHtml(t().copy)}</button></summary>
        ${content}
      </details>`;
  }
  return `
    <section class="metadata-block metadata-lora-block">
      <div class="metadata-block-head">
        <strong>${escapeHtml(t().metadataLora)}</strong>
        <button class="metadata-copy" type="button" data-copy-meta="${escapeHtml(copyText)}">${escapeHtml(t().copy)}</button>
      </div>
      ${content}
    </section>`;
}

function metadataSourceLabel(source) {
  const labels = {
    embedded: "Embedded",
    sidecar: "Sidecar JSON",
    ffprobe: "ffprobe",
    mediainfo: "MediaInfo",
    filesystem: "File",
  };
  return labels[source] || String(source || "").trim();
}

function metadataNoteText(metadata, options = {}) {
  const tx = t();
  if (options.error) return options.error;
  if (options.loading) return tx.metadataLoading;
  const sources = Array.isArray(metadata?.metadata_sources)
    ? metadata.metadata_sources.map(metadataSourceLabel).filter(Boolean).join(" / ")
    : "";
  const status = metadata?.metadata_status || "empty";
  if (status === "ok") {
    return sources ? `${tx.metadataDetected}: ${sources}` : tx.metadataDetected;
  }
  if (status === "partial") {
    return sources ? `${tx.metadataPartial} (${sources})` : tx.metadataPartial;
  }
  return tx.metadataEmpty || tx.metadataPending;
}

function metadataJson(value) {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function aspectRatioText(width, height) {
  const w = Number(width || 0);
  const h = Number(height || 0);
  if (!w || !h) return "";
  const actual = w / h;
  const common = [
    [1, 1], [2, 3], [3, 2], [3, 4], [4, 3], [4, 5], [5, 4],
    [9, 16], [16, 9], [9, 21], [21, 9], [5, 7], [7, 5],
  ];
  let best = common[0];
  let bestDiff = Infinity;
  for (const pair of common) {
    const diff = Math.abs(actual - pair[0] / pair[1]);
    if (diff < bestDiff) {
      best = pair;
      bestDiff = diff;
    }
  }
  const tolerance = 0.045;
  const decimal = actual.toFixed(2).replace(/\.00$/, "");
  if (bestDiff <= tolerance) return `${best[0]}:${best[1]} approx (${decimal}:1)`;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(Math.round(w), Math.round(h)) || 1;
  return `${Math.round(w / divisor)}:${Math.round(h / divisor)} (${decimal}:1)`;
}

function mediaPixelDimensions(item, metadata = null) {
  let width = Number(metadata?.width || 0);
  let height = Number(metadata?.height || 0);
  if (item?.type === "image" && modalImage.complete && modalImage.naturalWidth && state.currentModalItem?.key === item.key) {
    width = modalImage.naturalWidth;
    height = modalImage.naturalHeight;
  }
  if (item?.type === "video" && modalVideo.videoWidth && state.currentModalItem?.key === item.key) {
    width = modalVideo.videoWidth;
    height = modalVideo.videoHeight;
  }
  return { width, height };
}

function renderMetadataActions(metadata, raw, workflow) {
  if (!raw && !workflow) return "";
  const tx = t();
  const rawButton = raw
    ? `<button class="metadata-action-btn" type="button" data-copy-meta="${escapeHtml(raw)}">${escapeHtml(tx.metadataCopyRaw)}</button>`
    : "";
  const workflowButton = workflow
    ? `<button class="metadata-action-btn" type="button" data-copy-meta="${escapeHtml(workflow)}">${escapeHtml(tx.metadataCopyWorkflow)}</button>`
    : "";
  const comfyButton = workflow
    ? `<button class="metadata-action-btn" type="button" data-open-comfy="1">${escapeHtml(tx.metadataOpenComfy)}</button>`
    : "";
  return `
    <section class="metadata-actions">
      <div class="metadata-actions-title">${escapeHtml(tx.metadataActions)}</div>
      <div class="metadata-actions-row">${workflowButton}${rawButton}${comfyButton}</div>
    </section>`;
}

function renderMetadataInfo(items) {
  const rows = items.filter(row => row.value);
  if (!rows.length) return "";
  return `
    <section class="metadata-block metadata-info-block">
      <div class="metadata-block-head"><strong>${escapeHtml(t().metadataBasic)}</strong></div>
      <dl class="metadata-info-list">
        ${rows.map(row => `<div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`).join("")}
      </dl>
    </section>`;
}

function renderModalMetadata(item, metadata = null, options = {}) {
  const tx = t();
  const loading = options.loading;
  const error = options.error;
  const source = metadata?.source_url
    || metadata?.civitai_version_url
    || metadata?.civitai_model_url
    || item.full_path
    || item.rel
    || item.url;
  const pixels = mediaPixelDimensions(item, metadata);
  const dimensions = pixels.width && pixels.height ? `${pixels.width} x ${pixels.height}px` : "";
  const ratio = aspectRatioText(pixels.width, pixels.height);
  const duration = metadata?.duration ? `${Math.round(Number(metadata.duration) * 10) / 10}s` : "";
  const infoRows = [
    { label: tx.metadataPath, value: source },
    { label: tx.mediaTypeTitle, value: item.type || "media" },
    { label: tx.metadataSize, value: fmtBytes(item.size_mb) },
    { label: tx.metadataDate, value: item.mtime_text },
    { label: tx.metadataDimensions, value: dimensions },
    { label: tx.metadataRatio, value: ratio },
    { label: tx.metadataDuration, value: duration },
    { label: tx.metadataFormat, value: metadata?.format || "" },
    { label: tx.metadataCodec, value: metadata?.codec || "" },
  ];
  const raw = metadata?.raw_metadata && Object.keys(metadata.raw_metadata || {}).length ? metadataJson(metadata.raw_metadata) : "";
  const workflow = metadata?.workflow ? metadataJson(metadata.workflow) : "";
  modalMetadata.innerHTML = `
    ${renderMetadataInfo(infoRows)}
    ${error || loading ? `<p class="metadata-note">${escapeHtml(metadataNoteText(metadata, { loading, error }))}</p>` : ""}
    ${renderMetadataActions(metadata, raw, workflow)}
    ${renderMetadataBlock(tx.metadataModel, metadata?.model || "", { hideEmpty: true })}
    ${renderMetadataLoraBlock(metadata?.loras, { collapsed: true })}
    ${renderMetadataBlock(tx.metadataPrompt, metadata?.prompt || "", { hideEmpty: true, collapsed: true })}
    ${renderMetadataBlock(tx.metadataNegative, metadata?.negative_prompt || "", { hideEmpty: true, collapsed: true })}
  `;
  modalMetadata.classList.toggle("hidden", !item || !["image", "video"].includes(item.type));
}

async function loadModalMetadata(item) {
  const requestId = ++state.metadataRequestId;
  state.currentModalMetadata = null;
  state.currentModalMetadataLoading = true;
  state.currentModalMetadataError = "";
  renderModalMetadata(item, null, { loading: true });
  try {
    const params = new URLSearchParams({ path: item.rel || "", scan_id: item.scan_id || state.scanId || "" });
    const res = await fetch(`/api/metadata?${params.toString()}`);
    const data = await res.json();
    if (requestId !== state.metadataRequestId || state.currentModalItem?.key !== item.key) return;
    if (!res.ok || !data.ok) {
      state.currentModalMetadata = null;
      state.currentModalMetadataLoading = false;
      state.currentModalMetadataError = data.error || t().metadataError;
      renderModalMetadata(item, null, { error: data.error || t().metadataError });
      return;
    }
    state.currentModalMetadata = data.metadata || {};
    state.currentModalMetadataLoading = false;
    state.currentModalMetadataError = "";
    renderModalMetadata(item, state.currentModalMetadata);
  } catch {
    if (requestId === state.metadataRequestId && state.currentModalItem?.key === item.key) {
      state.currentModalMetadata = null;
      state.currentModalMetadataLoading = false;
      state.currentModalMetadataError = t().metadataError;
      renderModalMetadata(item, null, { error: t().metadataError });
    }
  }
}

function refreshModalMetadataPanel() {
  if (modal.classList.contains("hidden") || !state.currentModalItem) return;
  renderModalMetadata(state.currentModalItem, state.currentModalMetadata, {
    loading: state.currentModalMetadataLoading,
    error: state.currentModalMetadataError,
  });
}

function renderModalItem(item) {
  if (item.type !== "image" && state.modalSlideshowPlaying) setModalSlideshowPlaying(false);
  state.currentModalItem = item;
  modalName.textContent = item.name;
  modalMeta.textContent = `${item.type || "video"} · ${fmtBytes(item.size_mb)} · ${item.mtime_text} · ${item.rel}`;
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalImage.removeAttribute("src");
  modalVideo.classList.toggle("hidden", item.type === "image");
  modalImage.classList.toggle("hidden", item.type !== "image");
  modalSlideshow.classList.toggle("hidden", item.type !== "image");
  modalSlideshowFullscreen.classList.toggle("hidden", item.type !== "image");
  modalImageUiToggle.classList.add("hidden");
  modalVideoUiToggle.classList.add("hidden");
  state.currentModalMetadata = null;
  state.currentModalMetadataLoading = true;
  state.currentModalMetadataError = "";
  modalVideoControls.classList.toggle("hidden", item.type !== "video");
  modalContent.classList.toggle("is-video", item.type === "video");
  if (item.type === "image") {
    modalImage.src = item.url;
    modalImage.alt = item.name;
  } else {
    modalVideo.src = item.url;
    modalVideo.muted = false;
    updateVideoModeUI();
  }
  renderModalMetadata(item, null, { loading: true });
  loadModalMetadata(item);
  updateModalNav();
}

function openModal(item) {
  hideFloatingPager();
  pauseAllInline();
  renderModalItem(item);
  setModalControlsHidden(false);
  modal.classList.remove("hidden");
  scheduleAutoHideControls("modal", item.type === "video" ? 2000 : 1500, true);
  pauseAllInline();
  if (item.type !== "image") playModalVideoSoon();
}

function closeModal() {
  if (isModalFullscreen()) document.exitFullscreen?.();
  setModalSlideshowPlaying(false);
  clearTimeout(state.mediaNavTimer);
  clearTimeout(state.modalToolbarTimer);
  state.modalToolbarTimer = null;
  releaseMediaElement(modalVideo);
  releaseMediaElement(modalImage);
  modalSlideshow.classList.add("hidden");
  modalSlideshowFullscreen.classList.add("hidden");
  modalImageUiToggle.classList.add("hidden");
  modalMetadata.classList.add("hidden");
  modalVideoControls.classList.add("hidden");
  modalContent.classList.remove("is-video", "controls-hidden", "nav-active");
  state.modalControlsHidden = false;
  modalHiddenActions.classList.add("hidden");
  modalHiddenExitFullscreen.classList.add("hidden");
  modalPrev.classList.add("hidden");
  modalNext.classList.add("hidden");
  modal.classList.add("hidden");
  state.currentModalItem = null;
  updateGridPager();
  if (state.playingEnabled) resumeVisibleInline();
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
  setTimeout(() => modalVideo.play().catch(() => {}), 30);
}

function showModalVideo(direction = 1) {
  const current = state.currentModalItem;
  if (!current || current.type !== "video") return;
  const videos = currentVideoItems();
  if (videos.length < 2) return;
  let next = 0;
  if (direction === 0) {
    next = Math.floor(Math.random() * videos.length);
    if (videos.length > 1 && videos[next].key === current.key) next = (next + 1) % videos.length;
  } else {
    let index = videos.findIndex(item => item.key === current.key);
    if (index < 0) index = 0;
    next = (index + direction + videos.length) % videos.length;
  }
  renderModalItem(videos[next]);
  playModalVideoSoon();
}

function adjustModalVideoVolume(delta) {
  const next = Math.max(0, Math.min(1, modalVideo.volume + delta));
  modalVideo.volume = next;
  if (next > 0) modalVideo.muted = false;
  showToast(`${t().volumeLabel} ${Math.round(next * 100)}%`, 900);
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

function resolveSlideshowEffect() {
  if (state.slideshowEffect !== "random") return state.slideshowEffect;
  const effects = ["fade", "slide", "drift"];
  return effects[Math.floor(Math.random() * effects.length)];
}

function driftVars() {
  const dirs = [
    ["-2%", "-1%", "3%", "2%"],
    ["2%", "1%", "-3%", "-2%"],
    ["-1%", "2%", "2%", "-3%"],
    ["1%", "-2%", "-2%", "3%"],
  ];
  const d = dirs[Math.floor(Math.random() * dirs.length)];
  return { "--sx": d[0], "--sy": d[1], "--ex": d[2], "--ey": d[3] };
}

function renderSlideshow(direction = 1) {
  const item = state.slideshowItems[state.slideshowIndex];
  if (!item) return;
  const incoming = state.slideshowActiveLayer === 0 ? slideshowImageB : slideshowImageA;
  const outgoing = state.slideshowActiveLayer === 0 ? slideshowImageA : slideshowImageB;
  const effect = resolveSlideshowEffect();
  clearTimeout(state.slideshowCleanupTimer);
  incoming.className = "slideshow-image";
  outgoing.className = "slideshow-image";
  incoming.classList.remove("hidden");
  incoming.src = item.url;
  incoming.alt = item.name;
  incoming.style.objectFit = state.slideshowFit;
  outgoing.style.objectFit = state.slideshowFit;
  incoming.style.zIndex = 2;
  outgoing.style.zIndex = 1;
  const duration = effect === "drift" ? Math.max(1, state.slideshowInterval) * 1000 : effect === "fade" ? 650 : effect === "slide" ? 560 : 0;
  const outgoingDuration = effect === "drift" ? 760 : duration;
  incoming.style.removeProperty("--drift-duration");
  outgoing.style.removeProperty("--drift-duration");
  if (effect === "drift") {
    incoming.style.animationDuration = "";
    incoming.style.setProperty("--drift-duration", `${duration}ms`);
    outgoing.style.animationDuration = `${outgoingDuration}ms`;
  } else {
    incoming.style.animationDuration = `${duration}ms`;
    outgoing.style.animationDuration = `${outgoingDuration}ms`;
  }
  const vars = driftVars();
  for (const [key, value] of Object.entries(vars)) incoming.style.setProperty(key, value);
  if (effect === "none") {
    outgoing.classList.add("hidden");
  } else {
    outgoing.classList.remove("hidden");
    incoming.classList.add(`effect-${effect}`);
    if (effect === "fade") outgoing.classList.add("effect-fade-out");
    if (effect === "drift") outgoing.classList.add("effect-drift-out");
    if (effect === "slide") {
      incoming.classList.add(direction >= 0 ? "from-right" : "from-left");
      outgoing.classList.add("effect-slide-out", direction >= 0 ? "to-left" : "to-right");
    }
    state.slideshowCleanupTimer = setTimeout(() => outgoing.classList.add("hidden"), outgoingDuration + 40);
  }
  slideshowName.textContent = item.name;
  slideshowCounter.textContent = `${state.slideshowIndex + 1} / ${state.slideshowItems.length}`;
  state.slideshowActiveLayer = state.slideshowActiveLayer === 0 ? 1 : 0;
  scheduleSlideshow();
}

function scheduleSlideshow() {
  clearTimeout(state.slideshowTimer);
  if (!state.slideshowPlaying || slideshow.classList.contains("hidden")) return;
  state.slideshowTimer = setTimeout(() => showNextSlide(1), state.slideshowInterval * 1000);
}

function showNextSlide(direction = 1) {
  if (!state.slideshowItems.length) return;
  let next = state.slideshowIndex + direction;
  if (next >= state.slideshowItems.length) {
    if (!state.slideshowLoop) {
      state.slideshowPlaying = false;
      applyActionButtons();
      return;
    }
    next = 0;
  }
  if (next < 0) next = state.slideshowLoop ? state.slideshowItems.length - 1 : 0;
  state.slideshowIndex = next;
  renderSlideshow(direction);
}

function openSlideshowFromCurrent(options = {}) {
  hideFloatingPager();
  const current = state.currentModalItem;
  const images = currentImageItems();
  if (!current || current.type !== "image" || !images.length) {
    showToast(t().noImages);
    return;
  }
  state.slideshowItems = images;
  state.slideshowIndex = Math.max(0, images.findIndex(item => item.key === current.key));
  state.slideshowPlaying = true;
  slideshowInterval.value = String(state.slideshowInterval);
  slideshowEffect.value = state.slideshowEffect;
  slideshowFit.value = state.slideshowFit;
  slideshowLoop.checked = state.slideshowLoop;
  setSlideshowControlsHidden(false);
  closeModal();
  slideshow.classList.remove("hidden");
  pauseAllInline();
  applyLanguage();
  renderSlideshow(1);
  applyActionButtons();
  scheduleAutoHideControls("slideshow", 1000, true);
  if (options.requestFullscreen) {
    slideshow.requestFullscreen?.().catch(() => {});
  }
}

function openFullscreenSlideshowFromCurrent() {
  openSlideshowFromCurrent({ requestFullscreen: true });
}

function scheduleModalSlideshow() {
  clearTimeout(state.modalSlideshowTimer);
  if (!state.modalSlideshowPlaying || modal.classList.contains("hidden") || state.currentModalItem?.type !== "image") return;
  state.modalSlideshowTimer = setTimeout(() => {
    showModalImage(1, { fromTimer: true });
    scheduleModalSlideshow();
  }, state.slideshowInterval * 1000);
}

function applyModalDriftAnimation() {
  modalImage.classList.remove("modal-drift-active");
  const vars = driftVars();
  for (const [key, value] of Object.entries(vars)) modalImage.style.setProperty(key, value);
  modalImage.style.setProperty("--modal-drift-duration", `${Math.max(1, state.slideshowInterval) * 1000}ms`);
  void modalImage.offsetWidth;
  modalImage.classList.add("modal-drift-active");
}

function clearModalDriftAnimation() {
  modalImage.classList.remove("modal-drift-active");
  modalImage.style.removeProperty("--modal-drift-duration");
  modalImage.style.removeProperty("--sx");
  modalImage.style.removeProperty("--sy");
  modalImage.style.removeProperty("--ex");
  modalImage.style.removeProperty("--ey");
}

function setModalSlideshowPlaying(playing) {
  clearTimeout(state.modalSlideshowTimer);
  state.modalSlideshowTimer = null;
  const images = currentImageItems();
  state.modalSlideshowPlaying = !!playing && !modal.classList.contains("hidden") && state.currentModalItem?.type === "image" && images.length > 1;
  modalContent.classList.toggle("modal-slideshow-playing", state.modalSlideshowPlaying);
  if (state.modalSlideshowPlaying) {
    applyModalDriftAnimation();
  } else {
    clearModalDriftAnimation();
  }
  applyActionButtons();
  if (state.modalSlideshowPlaying) scheduleModalSlideshow();
}

function toggleModalSlideshow() {
  const images = currentImageItems();
  if (state.currentModalItem?.type !== "image" || images.length < 2) {
    showToast(t().noImages);
    return;
  }
  setModalSlideshowPlaying(!state.modalSlideshowPlaying);
}

function closeSlideshow(options = {}) {
  const shouldResumeInline = options.resumeInline !== false;
  if (isSlideshowFullscreen()) document.exitFullscreen?.();
  clearTimeout(state.slideshowTimer);
  clearTimeout(state.slideshowCleanupTimer);
  clearTimeout(state.mediaNavTimer);
  clearTimeout(state.slideshowToolbarTimer);
  state.slideshowToolbarTimer = null;
  setSlideshowControlsHidden(false);
  slideshowHiddenActions.classList.add("hidden");
  slideshowExitFullscreen.classList.add("hidden");
  slideshow.classList.remove("nav-active");
  slideshow.classList.add("hidden");
  releaseMediaElement(slideshowImageA);
  releaseMediaElement(slideshowImageB);
  updateGridPager();
  if (shouldResumeInline && state.playingEnabled) resumeVisibleInline();
}

function returnSlideshowToModal() {
  const item = state.slideshowItems[state.slideshowIndex];
  state.slideshowReturnAfterFullscreenExit = false;
  closeSlideshow({ resumeInline: false });
  if (item) openModal(item);
}

function setSlideshowControlsHidden(hidden) {
  state.slideshowControlsHidden = hidden;
  slideshow.classList.toggle("controls-hidden", hidden);
  slideshowHiddenActions.classList.add("hidden");
  slideshowUiToggle.textContent = compactText("hideUi", "Hide");
  slideshowUiShow.textContent = labelText("showUi", "Show UI", "显示控制");
  if (hidden) {
    slideshow.classList.remove("nav-active");
  }
  applyActionButtons();
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
  if (isSlideshowFullscreen()) {
    state.slideshowReturnAfterFullscreenExit = false;
    document.exitFullscreen?.();
  } else {
    state.slideshowReturnAfterFullscreenExit = true;
    slideshow.requestFullscreen?.().catch(() => {});
  }
}

function handleFullscreenChange() {
  updateFullscreenLabels();
  if (!document.fullscreenElement && state.slideshowReturnAfterFullscreenExit && !slideshow.classList.contains("hidden")) {
    returnSlideshowToModal();
  }
}

function toggleSlideshowPlay() {
  state.slideshowPlaying = !state.slideshowPlaying;
  applyActionButtons();
  scheduleSlideshow();
}

async function openInExplorer(item) {
  const rel = typeof item === "string" ? item : item?.rel;
  const scanId = typeof item === "string" ? "" : (item?.scan_id || state.scanId || "");
  try {
    const params = new URLSearchParams({ path: rel || "" });
    if (scanId) params.set("scan_id", scanId);
    const res = await fetch("/api/open?" + params.toString());
    const data = await res.json();
    if (!data.ok) showToast(data.error || t().openFail);
  } catch {
    showToast(t().openFail);
  }
}

async function openInDefaultApp(item) {
  const rel = item?.rel;
  const scanId = item?.scan_id || state.scanId || "";
  if (!rel) return;
  try {
    const params = new URLSearchParams({ path: rel });
    if (scanId) params.set("scan_id", scanId);
    const res = await fetch("/api/open-file?" + params.toString());
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
  const dontAsk = trashConfirmDontAsk.checked;
  trashConfirmDialog.classList.add("hidden");
  if (confirmed && dontAsk) {
    state.confirmTrash = false;
    confirmTrash.checked = false;
    saveSettingsSoft();
  }
  if (trashConfirmResolve) trashConfirmResolve(!!confirmed);
  trashConfirmResolve = null;
}

function requestTrashConfirmation() {
  if (!state.confirmTrash) return Promise.resolve(true);
  trashConfirmDontAsk.checked = false;
  trashConfirmDialog.classList.remove("hidden");
  return new Promise(resolve => {
    trashConfirmResolve = resolve;
  });
}

function removeItemFromState(item) {
  state.all = state.all.filter(v => v.key !== item.key);
  state.view = state.view.filter(v => v.key !== item.key);
  applyFilters(false);
}

function releaseActionPreviewMedia(source) {
  if (source === "slideshow") {
    releaseMediaElement(slideshowImageA);
    releaseMediaElement(slideshowImageB);
    return;
  }
  releaseMediaElement(modalVideo);
  releaseMediaElement(modalImage);
}

function waitForMediaRelease(ms = 450) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function releaseMediaBeforeFileAction(item, source) {
  if (!item) return;
  if (source === "slideshow") releaseActionPreviewMedia(source);
  if (state.currentModalItem?.key === item.key) releaseActionPreviewMedia("modal");
  document.querySelectorAll(".video-wrap video, .video-wrap img.media-image").forEach(media => {
    if (media.dataset.rel === item.rel || media.dataset.src === item.url || media.getAttribute("src") === item.url) {
      releaseMediaElement(media);
    }
  });
  state.visibleVideos.forEach(video => {
    if (video.dataset.rel === item.rel || video.dataset.src === item.url || video.getAttribute("src") === item.url) {
      state.visibleVideos.delete(video);
    }
  });
  syncLoadedMediaStatNow();
  if (item.type === "video") await waitForMediaRelease();
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
    state.slideshowItems = currentImageItems();
    if (!state.slideshowItems.length) {
      closeSlideshow();
      return;
    }
    state.slideshowIndex = Math.max(0, Math.min(oldIndex, state.slideshowItems.length - 1));
    renderSlideshow(1);
    applyActionButtons();
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
  const sameTypeItems = item.type === "image" ? currentImageItems() : currentVideoItems();
  const oldIndex = Math.max(0, sameTypeItems.findIndex(v => v.key === item.key));
  if (action === "move_review" && !window.confirm(t().confirmReview)) return;
  if (action === "move_trash" && !(await requestTrashConfirmation())) return;
  try {
    await releaseMediaBeforeFileAction(item, source);
    const res = await fetch("/api/file-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rel: item.rel, scan_id: item.scan_id || state.scanId || "", confirm: true }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().fileActionFail);
    releaseActionPreviewMedia(source);
    removeItemFromState(item);
    continueAfterFileAction(item, source, oldIndex);
    showToast(t().fileActionDone, 3600);
  } catch (err) {
    console.error(err);
    restoreActionPreviewMedia(item, source);
    showToast(err.message || t().fileActionFail, 5200);
  }
}

function pathKey(path) {
  return String(path || "").trim().toLowerCase();
}

function normalizePathText(path) {
  return String(path || "").trim().replace(/^"+|"+$/g, "");
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
    container.appendChild(createPathRow(pathLabel(path), path, { removableFavorite: true }));
  }
}

function createPathRow(label, path, options = {}) {
  const row = document.createElement("div");
  row.className = "folder-row";
  row.dataset.path = path;
  if (options.expandable) {
    const expand = document.createElement("button");
    expand.className = "folder-expand";
    expand.type = "button";
    expand.textContent = ">";
    expand.title = labelText("expand", "Expand", "展开");
    expand.addEventListener("click", e => {
      e.stopPropagation();
      toggleFolderNode(row, path, expand);
    });
    row.appendChild(expand);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "folder-expand-spacer";
    row.appendChild(spacer);
  }
  const select = document.createElement("button");
  select.className = "folder-path";
  select.type = "button";
  select.textContent = label;
  select.title = path;
  select.addEventListener("click", () => selectFolderPath(path));
  row.appendChild(select);
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
    row.appendChild(remove);
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
  renderHistoryMenu();
  updateFavoritePathButton();
}

function updateFolderStars() {
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
  setButtonLabel(favoritePathBtn, favorite ? t().removeFavorite : t().addFavorite, "star", { iconOnly: true });
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
      folderTree.appendChild(createPathRow(root.name || root.path, root.path, { expandable: true }));
    }
    state.folderRootsLoaded = true;
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
    container.appendChild(createPathRow(folder.name, folder.path, { expandable: true }));
  }
}

async function toggleFolderNode(row, path, expandButton) {
  const children = row.querySelector(":scope > .folder-children");
  if (!children) return;
  if (children.dataset.loaded === "1") {
    children.classList.toggle("hidden");
    expandButton.textContent = children.classList.contains("hidden") ? ">" : "v";
    return;
  }
  expandButton.textContent = "...";
  children.classList.remove("hidden");
  children.innerHTML = `<div class="folder-empty">${t().scanProgress}</div>`;
  const cacheKey = pathKey(path);
  if (state.folderCache.has(cacheKey)) {
    renderFolderChildren(children, state.folderCache.get(cacheKey));
    children.dataset.loaded = "1";
    expandButton.textContent = "v";
    return;
  }
  try {
    const res = await fetch(`/api/fs/list?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().folderLoadFail);
    const folders = data.folders || [];
    state.folderCache.set(cacheKey, folders);
    renderFolderChildren(children, folders);
    children.dataset.loaded = "1";
    expandButton.textContent = "v";
  } catch (err) {
    console.error(err);
    children.innerHTML = `<div class="folder-empty">${t().folderLoadFail}</div>`;
    expandButton.textContent = ">";
  }
}

async function selectFolderPath(path) {
  pathInput.value = path;
  updateFavoritePathButton();
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
    const res = await fetch("/api/path-state", {
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
    const res = await fetch("/api/path-state", {
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
    const res = await fetch("/api/path-state", {
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
    const res = await fetch("/api/choose-folder");
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
  const videoDir = pathInput.value.trim();
  if (!videoDir) {
    showToast(t().needPath);
    return;
  }
  const scanStart = performance.now();
  setBusy(true);
  emptyState.classList.add("hidden");
  destroyObservers();
  releaseGridMedia();
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
    const res = await fetch("/api/scan", {
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
    state.pathHistory = data.config?.path_history || state.pathHistory;
    state.pathFavorites = data.config?.path_favorites || state.pathFavorites;
    state.recursive = !!data.recursive;
    state.filenameExcludeEnabled = data.config?.filename_exclude_enabled !== false;
    state.filenameExcludeKeywords = cleanExcludeKeywords(data.config?.filename_exclude_keywords || []);
    state.filenameExcludeScope = data.config?.filename_exclude_scope === "all" ? "all" : "image";
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
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        remember_path: rememberPath.checked,
        last_video_dir: pathInput.value.trim(),
        recursive: recursiveScan.checked,
        filename_exclude_enabled: state.filenameExcludeEnabled,
        filename_exclude_keywords: state.filenameExcludeKeywords,
        filename_exclude_scope: state.filenameExcludeScope,
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
  const allowed = [12, 18, 24, 36, 48, 72];
  const next = Number(limit) || 36;
  state.playLimit = allowed.includes(next) ? next : 36;
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

async function init() {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    const cfg = data.config || {};
    const cfgColumns = Number(cfg.columns || 6);
    state.columns = COLUMN_OPTIONS.includes(cfgColumns) ? cfgColumns : 6;
    state.pageSize = normalizePageSize(cfg.page_size || 120);
    state.playLimit = [12, 18, 24, 36, 48, 72].includes(Number(cfg.play_limit)) ? Number(cfg.play_limit) : 36;
    state.wallAutoplay = cfg.wall_autoplay !== false;
    state.previewLargeVideos = cfg.preview_large_videos === true;
    state.pauseWhenInactive = cfg.pause_when_inactive === true;
    state.floatingPagerEnabled = cfg.floating_pager === true;
    state.confirmTrash = cfg.confirm_trash !== false;
    state.recursive = !!cfg.recursive;
    state.filenameExcludeEnabled = cfg.filename_exclude_enabled !== false;
    state.filenameExcludeKeywords = cleanExcludeKeywords(cfg.filename_exclude_keywords || ["fanart", "thumb"]);
    state.filenameExcludeScope = cfg.filename_exclude_scope === "all" ? "all" : "image";
    state.rememberPath = !!cfg.remember_path;
    state.sortMode = cfg.sort_mode || "mtime_desc";
    state.immersive = !!cfg.immersive;
    state.language = cfg.language === "zh" ? "zh" : "en";
    state.pathHistory = Array.isArray(cfg.path_history) ? cfg.path_history : [];
    state.pathFavorites = Array.isArray(cfg.path_favorites) ? cfg.path_favorites : [];
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
document.addEventListener("click", () => {
  setSettingsMenuOpen(false);
  setHistoryMenuOpen(false);
  closePathSuggestions();
});
pathInput.addEventListener("input", () => {
  updateFavoritePathButton();
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
modalMoveReview.addEventListener("click", () => runFileAction("move_review"));
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
  if (e.key === "Escape" && !settingsMenu.classList.contains("hidden")) {
    setSettingsMenuOpen(false);
    return;
  }
  if (e.key === "Escape" && !pathHistoryMenu.classList.contains("hidden")) {
    setHistoryMenuOpen(false);
    return;
  }
  if (e.key === "Escape" && !folderPanel.classList.contains("hidden")) {
    closeFolderPanel();
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
  scheduleUpdatePlaying();
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
