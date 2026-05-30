const state = {
  all: [],
  view: [],
  playingEnabled: true,
  currentModalItem: null,
  visibleVideos: new Set(),
  columns: 6,
  playLimit: 24,
  recursive: false,
  rememberPath: false,
  sortMode: "mtime_desc",
  reviewFilter: "all",
  sizeFilter: "all",
  dateFilter: "all",
  mediaType: "all",
  immersive: false,
  language: "en",
  slideshowItems: [],
  slideshowIndex: 0,
  slideshowPlaying: true,
  slideshowTimer: null,
  slideshowActiveLayer: 0,
  slideshowInterval: 5,
  slideshowEffect: "drift",
  slideshowFit: "contain",
  slideshowLoop: true,
  scannedPath: "",
  updateTimer: null,
};

const COLUMN_WIDTHS = { 4: 300, 5: 260, 6: 220, 7: 190, 8: 165, 9: 145 };
const COLUMN_GAPS = { 4: 18, 5: 18, 6: 18, 7: 16, 8: 14, 9: 12 };

const i18n = {
  en: {
    htmlLang: "en",
    chooseFolder: "Choose Folder",
    scan: "Scan",
    scanning: "Scanning...",
    expand: "Expand",
    rememberPath: "Remember path",
    recursive: "Scan subfolders",
    search: "Search filename...",
    reviewTitle: "Review filter",
    all: "All",
    favorites: "Favorites",
    selected: "Selected",
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
    allMedia: "All media",
    videosOnly: "Videos",
    imagesOnly: "Images",
    favorite: "Favorite",
    favorited: "Favorited",
    markSelected: "Select",
    selectedMarked: "Selected",
    sortTitle: "Sort",
    columnsTitle: "Grid columns",
    playLimitTitle: "Playback limit",
    shuffle: "Shuffle",
    exportCsv: "Export CSV",
    exportEmpty: "No visible items to export.",
    exportDone: n => `Exported ${n} rows to CSV.`,
    pauseAll: "Pause All",
    resume: "Resume",
    immersive: "Immersive",
    exitImmersive: "Exit Immersive",
    showInFolder: "Show in Folder",
    close: "Close",
    slideshow: "Slideshow",
    prev: "Prev",
    next: "Next",
    play: "Play",
    pause: "Pause",
    loop: "Loop",
    fade: "Fade",
    slide: "Slide",
    drift: "Drift",
    random: "Random",
    contain: "Contain",
    cover: "Cover",
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
    openFail: "Could not open the folder.",
    chooseOpening: "Opening the Windows folder picker. It may appear behind the browser.",
    choosing: "Choosing...",
    chosen: "Folder selected. Click Scan to load videos.",
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
    moveReview: "Move to Review",
    moveTrash: "Move to Trash",
    confirmReview: "Move this file to _video_wall_review? The original file path will change.",
    confirmTrash: "Move this file to _video_wall_trash? This is safer than permanent delete.",
    fileActionDone: "File moved. The current list was updated.",
    fileActionFail: "File action failed.",
    scanDone: n => `Scan complete: ${n} media items`,
    configFail: "Could not load settings.",
    sortOptions: {
      mtime_desc: "Newest modified",
      mtime_asc: "Oldest modified",
      name_asc: "Filename A-Z",
      name_desc: "Filename Z-A",
      size_desc: "Size large-small",
      size_asc: "Size small-large",
    },
    colLabel: n => `${n} cols`,
    playLabel: n => `Play ${n}`,
  },
  zh: {
    htmlLang: "zh-CN",
    chooseFolder: "选择文件夹",
    scan: "扫描",
    scanning: "扫描中...",
    expand: "展开",
    rememberPath: "记住路径",
    recursive: "扫描子文件夹",
    search: "搜索文件名...",
    reviewTitle: "审核筛选",
    all: "全部",
    favorites: "收藏",
    selected: "精选",
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
    allMedia: "全部媒体",
    videosOnly: "视频",
    imagesOnly: "图片",
    favorite: "收藏",
    favorited: "已收藏",
    markSelected: "精选",
    selectedMarked: "已精选",
    sortTitle: "排序",
    columnsTitle: "卡片列数",
    playLimitTitle: "同时播放上限",
    shuffle: "随机",
    exportCsv: "导出 CSV",
    exportEmpty: "当前没有可导出的项目。",
    exportDone: n => `已导出 ${n} 行 CSV。`,
    pauseAll: "暂停全部",
    resume: "继续播放",
    immersive: "沉浸",
    exitImmersive: "退出沉浸",
    showInFolder: "打开所在位置",
    close: "关闭",
    slideshow: "幻灯片",
    prev: "上一张",
    next: "下一张",
    play: "播放",
    pause: "暂停",
    loop: "循环",
    fade: "淡入淡出",
    slide: "滑动",
    drift: "动态漂移",
    random: "随机",
    contain: "完整显示",
    cover: "填满屏幕",
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
    openFail: "打开位置失败",
    chooseOpening: "正在打开 Windows 文件夹选择框，可能会出现在浏览器后面。",
    choosing: "选择中...",
    chosen: "已选择文件夹，点击“扫描”开始加载。",
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
    moveReview: "移到精选夹",
    moveTrash: "移到回收夹",
    confirmReview: "要把这个文件移动到 _video_wall_review 吗？原文件路径会变化。",
    confirmTrash: "要把这个文件移动到 _video_wall_trash 吗？这不是永久删除。",
    fileActionDone: "文件已移动，当前列表已更新。",
    fileActionFail: "文件操作失败。",
    scanDone: n => `扫描完成：${n} 个媒体文件`,
    configFail: "配置加载失败。",
    sortOptions: {
      mtime_desc: "最新修改",
      mtime_asc: "最早修改",
      name_asc: "文件名 A-Z",
      name_desc: "文件名 Z-A",
      size_desc: "文件大-小",
      size_asc: "文件小-大",
    },
    colLabel: n => `${n}列`,
    playLabel: n => `播放${n}`,
  },
};

const $ = s => document.querySelector(s);
const grid = $("#grid");
const subInfo = $("#subInfo");
const pathInput = $("#pathInput");
const chooseFolderBtn = $("#chooseFolderBtn");
const scanBtn = $("#scanBtn");
const rememberPath = $("#rememberPath");
const recursiveScan = $("#recursiveScan");
const searchInput = $("#searchInput");
const reviewFilterSeg = $("#reviewFilterSeg");
const sizeFilterSelect = $("#sizeFilterSelect");
const dateFilterSelect = $("#dateFilterSelect");
const mediaTypeSelect = $("#mediaTypeSelect");
const sortSelect = $("#sortSelect");
const playLimitSelect = $("#playLimitSelect");
const columnsSeg = $("#columnsSeg");
const shuffleBtn = $("#shuffleBtn");
const exportCsvBtn = $("#exportCsvBtn");
const pauseBtn = $("#pauseBtn");
const immersiveBtn = $("#immersiveBtn");
const expandBtn = $("#expandBtn");
const langToggle = $("#langToggle");
const emptyState = $("#emptyState");
const toast = $("#toast");
const modal = $("#modal");
const modalVideo = $("#modalVideo");
const modalImage = $("#modalImage");
const modalName = $("#modalName");
const modalMeta = $("#modalMeta");
const modalClose = $("#modalClose");
const modalOpenFolder = $("#modalOpenFolder");
const modalMoveReview = $("#modalMoveReview");
const modalMoveTrash = $("#modalMoveTrash");
const modalSlideshow = $("#modalSlideshow");
const slideshow = $("#slideshow");
const slideshowImageA = $("#slideshowImageA");
const slideshowImageB = $("#slideshowImageB");
const slideshowName = $("#slideshowName");
const slideshowCounter = $("#slideshowCounter");
const slideshowClose = $("#slideshowClose");
const slideshowPrev = $("#slideshowPrev");
const slideshowPlay = $("#slideshowPlay");
const slideshowNext = $("#slideshowNext");
const slideshowInterval = $("#slideshowInterval");
const slideshowEffect = $("#slideshowEffect");
const slideshowFit = $("#slideshowFit");
const slideshowLoop = $("#slideshowLoop");
const slideshowLoopLabel = $("#slideshowLoopLabel");

function t() {
  return i18n[state.language] || i18n.en;
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
  scanBtn.textContent = isBusy ? t().scanning : t().scan;
}

function applyLanguage() {
  const tx = t();
  document.documentElement.lang = tx.htmlLang;
  pathInput.placeholder = tx.pathPlaceholder;
  chooseFolderBtn.textContent = tx.chooseFolder;
  scanBtn.textContent = tx.scan;
  expandBtn.textContent = tx.expand;
  langToggle.textContent = tx.langToggle;
  $("#rememberPathLabel").textContent = tx.rememberPath;
  $("#recursiveScanLabel").textContent = tx.recursive;
  searchInput.placeholder = tx.search;
  reviewFilterSeg.title = tx.reviewTitle;
  reviewFilterSeg.querySelector('[data-review-filter="all"]').textContent = tx.all;
  reviewFilterSeg.querySelector('[data-review-filter="favorites"]').textContent = tx.favorites;
  reviewFilterSeg.querySelector('[data-review-filter="selected"]').textContent = tx.selected;
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
  mediaTypeSelect.title = tx.mediaTypeTitle;
  mediaTypeSelect.querySelector('[value="all"]').textContent = tx.allMedia;
  mediaTypeSelect.querySelector('[value="video"]').textContent = tx.videosOnly;
  mediaTypeSelect.querySelector('[value="image"]').textContent = tx.imagesOnly;
  sortSelect.title = tx.sortTitle;
  columnsSeg.title = tx.columnsTitle;
  playLimitSelect.title = tx.playLimitTitle;
  shuffleBtn.textContent = tx.shuffle;
  exportCsvBtn.textContent = tx.exportCsv;
  pauseBtn.textContent = state.playingEnabled ? tx.pauseAll : tx.resume;
  immersiveBtn.textContent = state.immersive ? tx.exitImmersive : tx.immersive;
  modalSlideshow.textContent = tx.slideshow;
  modalMoveReview.textContent = tx.moveReview;
  modalMoveTrash.textContent = tx.moveTrash;
  modalOpenFolder.textContent = tx.showInFolder;
  modalClose.textContent = tx.close;
  slideshowClose.textContent = tx.close;
  slideshowPrev.textContent = tx.prev;
  slideshowNext.textContent = tx.next;
  slideshowPlay.textContent = state.slideshowPlaying ? tx.pause : tx.play;
  slideshowLoopLabel.textContent = tx.loop;
  slideshowEffect.querySelector('[value="fade"]').textContent = tx.fade;
  slideshowEffect.querySelector('[value="slide"]').textContent = tx.slide;
  slideshowEffect.querySelector('[value="drift"]').textContent = tx.drift;
  slideshowEffect.querySelector('[value="random"]').textContent = tx.random;
  slideshowFit.querySelector('[value="contain"]').textContent = tx.contain;
  slideshowFit.querySelector('[value="cover"]').textContent = tx.cover;
  emptyState.querySelector("h2").textContent = tx.emptyTitle;
  emptyState.querySelector("p").textContent = tx.emptyBody;
  for (const opt of sortSelect.options) {
    opt.textContent = tx.sortOptions[opt.value] || opt.textContent;
  }
  columnsSeg.querySelectorAll("button[data-columns]").forEach(btn => {
    btn.textContent = tx.colLabel(btn.dataset.columns);
  });
  [...playLimitSelect.options].forEach(opt => {
    opt.textContent = tx.playLabel(opt.value);
  });
  updateReviewFilterUI();
  document.querySelectorAll(".tiny-btn").forEach(btn => btn.textContent = tx.location);
  updateReviewButtons();
  updateSubInfo();
}

function applyLayout() {
  const cols = Number(state.columns) || 6;
  const width = COLUMN_WIDTHS[cols] || 220;
  const gap = COLUMN_GAPS[cols] || 18;
  document.documentElement.style.setProperty("--columns", cols);
  document.documentElement.style.setProperty("--card-w", `${width}px`);
  document.documentElement.style.setProperty("--gap", `${gap}px`);
  columnsSeg.querySelectorAll("button").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.columns) === cols);
  });
  playLimitSelect.value = String(state.playLimit);
  updateSubInfo();
  scheduleUpdatePlaying();
}

function updateSubInfo() {
  const tx = t();
  const count = state.view.length || state.all.length || 0;
  const favCount = state.all.filter(item => item.favorite).length;
  const selectedCount = state.all.filter(item => item.selected).length;
  const path = state.scannedPath || pathInput.value.trim() || tx.noPath;
  if (document.body.classList.contains("immersive")) {
    subInfo.textContent = `${count} ${tx.videos} · ${state.columns} ${tx.cols} · ${tx.playLimit} ${state.playLimit} · ${path}`;
  } else if (state.all.length) {
    subInfo.textContent = `${state.view.length} / ${state.all.length} ${tx.items} · ${tx.favorites} ${favCount} · ${tx.selected} ${selectedCount}`;
  } else {
    subInfo.textContent = tx.subChoose;
  }
}

function sortItems(items, mode) {
  const arr = [...items];
  const locale = state.language === "zh" ? "zh-CN" : "en";
  if (mode === "mtime_desc") arr.sort((a, b) => b.mtime - a.mtime);
  if (mode === "mtime_asc") arr.sort((a, b) => a.mtime - b.mtime);
  if (mode === "name_asc") arr.sort((a, b) => a.name.localeCompare(b.name, locale));
  if (mode === "name_desc") arr.sort((a, b) => b.name.localeCompare(a.name, locale));
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

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  let items = state.all;
  if (q) items = items.filter(v => v.name.toLowerCase().includes(q) || v.rel.toLowerCase().includes(q));
  if (state.reviewFilter === "favorites") items = items.filter(v => v.favorite);
  if (state.reviewFilter === "selected") items = items.filter(v => v.selected);
  if (state.sizeFilter === "small") items = items.filter(v => Number(v.size_mb) < 10);
  if (state.sizeFilter === "medium") items = items.filter(v => Number(v.size_mb) >= 10 && Number(v.size_mb) < 50);
  if (state.sizeFilter === "large") items = items.filter(v => Number(v.size_mb) >= 50);
  const now = Date.now() / 1000;
  if (state.dateFilter === "day") items = items.filter(v => now - Number(v.mtime) <= 86400);
  if (state.dateFilter === "week") items = items.filter(v => now - Number(v.mtime) <= 86400 * 7);
  if (state.dateFilter === "month") items = items.filter(v => now - Number(v.mtime) <= 86400 * 30);
  if (state.mediaType !== "all") items = items.filter(v => v.type === state.mediaType);
  state.view = sortItems(items, sortSelect.value);
  renderGrid();
  saveSettingsSoft();
}

function renderGrid() {
  destroyObservers();
  grid.innerHTML = "";
  state.visibleVideos.clear();
  emptyState.classList.toggle("hidden", state.view.length > 0);
  if (state.view.length === 0) {
    if (state.all.length > 0) {
      emptyState.querySelector("h2").textContent = t().noMatchTitle;
      emptyState.querySelector("p").textContent = t().noMatchBody;
    }
    updateSubInfo();
    return;
  }
  const frag = document.createDocumentFragment();
  for (const item of state.view) {
    const card = document.createElement("article");
    card.className = "video-card";
    card.dataset.key = item.key;
    card.dataset.rel = item.rel;
    const mediaHtml = item.type === "image"
      ? `<img class="media-image" src="${item.url}" alt="${escapeHtml(item.name)}" loading="lazy" />`
      : `<video muted loop playsinline preload="none" data-src="${item.url}" data-rel="${escapeHtml(item.rel)}"></video>`;
    card.innerHTML = `
      <div class="video-wrap" title="${escapeHtml(item.name)}">
        ${mediaHtml}
        <div class="video-overlay"><div class="video-name">${escapeHtml(item.name)}</div></div>
      </div>
      <div class="card-footer">
        <div class="meta">
          <div>${escapeHtml(item.name)}</div>
          <div>${fmtBytes(item.size_mb)} · ${escapeHtml(item.mtime_text)}</div>
        </div>
        <button class="tiny-btn" data-open="${escapeHtml(item.rel)}">${t().location}</button>
      </div>
      <div class="review-actions">
        <button class="review-btn" data-review-field="favorite"></button>
        <button class="review-btn" data-review-field="selected"></button>
      </div>`;
    card.classList.toggle("is-favorite", !!item.favorite);
    card.classList.toggle("is-selected", !!item.selected);
    card.querySelector(".video-wrap").addEventListener("click", () => openModal(item));
    card.querySelector(".tiny-btn").addEventListener("click", e => {
      e.stopPropagation();
      openInExplorer(item.rel);
    });
    card.querySelectorAll(".review-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        toggleReview(item, btn.dataset.reviewField);
      });
    });
    frag.appendChild(card);
  }
  grid.appendChild(frag);
  updateReviewButtons();
  setupObservers();
  updateSubInfo();
}

function updateReviewButtons() {
  const tx = t();
  document.querySelectorAll(".video-card").forEach(card => {
    const item = state.all.find(v => v.key === card.dataset.key);
    if (!item) return;
    const favoriteBtn = card.querySelector('[data-review-field="favorite"]');
    const selectedBtn = card.querySelector('[data-review-field="selected"]');
    if (favoriteBtn) {
      favoriteBtn.textContent = item.favorite ? `★ ${tx.favorited}` : `☆ ${tx.favorite}`;
      favoriteBtn.classList.toggle("active", !!item.favorite);
    }
    if (selectedBtn) {
      selectedBtn.textContent = item.selected ? `✓ ${tx.selectedMarked}` : `＋ ${tx.markSelected}`;
      selectedBtn.classList.toggle("active", !!item.selected);
    }
  });
}

function updateReviewFilterUI() {
  reviewFilterSeg.querySelectorAll("button[data-review-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.reviewFilter === state.reviewFilter);
  });
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
    applyFilters();
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

function exportCsv() {
  if (!state.view.length) {
    showToast(t().exportEmpty);
    return;
  }
  const headers = ["name", "type", "relative_path", "size_mb", "modified_time", "favorite", "selected"];
  const rows = state.view.map(item => [
    item.name,
    item.type || "video",
    item.rel,
    Number(item.size_mb).toFixed(2),
    item.mtime_text,
    item.favorite ? "yes" : "no",
    item.selected ? "yes" : "no",
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const a = document.createElement("a");
  a.href = url;
  a.download = `video-wall-export-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(t().exportDone(rows.length));
}

let loadObserver = null;
let playObserver = null;

function destroyObservers() {
  if (loadObserver) loadObserver.disconnect();
  if (playObserver) playObserver.disconnect();
}

function setupObservers() {
  const videos = [...document.querySelectorAll(".video-wrap video")];
  loadObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) ensureSrc(video);
      else if (!isNearViewport(video, 1200)) {
        state.visibleVideos.delete(video);
        pauseAndRelease(video);
        video.closest(".video-card")?.classList.remove("paused-by-limit");
      }
    }
  }, { root: null, rootMargin: "900px 0px", threshold: .01 });
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
  }, { root: null, rootMargin: "0px", threshold: .32 });
  for (const video of videos) {
    loadObserver.observe(video);
    playObserver.observe(video);
  }
  scheduleUpdatePlaying();
}

function ensureSrc(video) {
  if (!video.src) {
    video.src = video.dataset.src;
    video.load();
  }
}

function pauseAndRelease(video) {
  video.pause();
  if (video.src) {
    video.removeAttribute("src");
    video.load();
  }
}

function isNearViewport(el, margin = 0) {
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < window.innerHeight + margin && r.right > -margin && r.left < window.innerWidth + margin;
}

function isActuallyVisible(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

function distanceToViewportCenter(el) {
  const r = el.getBoundingClientRect();
  return Math.hypot((r.left + r.width / 2) - window.innerWidth / 2, (r.top + r.height / 2) - window.innerHeight / 2);
}

function scheduleUpdatePlaying() {
  if (state.updateTimer) return;
  state.updateTimer = requestAnimationFrame(() => {
    state.updateTimer = null;
    updatePlaying();
  });
}

function updatePlaying() {
  const videos = [...state.visibleVideos].filter(v => v.isConnected && isActuallyVisible(v));
  const selected = videos.sort((a, b) => distanceToViewportCenter(a) - distanceToViewportCenter(b)).slice(0, state.playLimit);
  const selectedSet = new Set(selected);
  for (const video of videos) {
    const card = video.closest(".video-card");
    if (!state.playingEnabled || !modal.classList.contains("hidden")) {
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

function openModal(item) {
  state.currentModalItem = item;
  modalName.textContent = item.name;
  modalMeta.textContent = `${item.type || "video"} · ${fmtBytes(item.size_mb)} · ${item.mtime_text} · ${item.rel}`;
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalImage.removeAttribute("src");
  modalVideo.classList.toggle("hidden", item.type === "image");
  modalImage.classList.toggle("hidden", item.type !== "image");
  modalSlideshow.classList.toggle("hidden", item.type !== "image");
  if (item.type === "image") {
    modalImage.src = item.url;
    modalImage.alt = item.name;
  } else {
    modalVideo.src = item.url;
    modalVideo.muted = false;
    modalVideo.loop = true;
  }
  modal.classList.remove("hidden");
  pauseAllInline();
  if (item.type !== "image") setTimeout(() => modalVideo.play().catch(() => {}), 30);
}

function closeModal() {
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
  modalImage.removeAttribute("src");
  modalSlideshow.classList.add("hidden");
  modal.classList.add("hidden");
  state.currentModalItem = null;
  if (state.playingEnabled) resumeVisibleInline();
}

function currentImageItems() {
  return state.view.filter(item => item.type === "image");
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
  incoming.className = "slideshow-image";
  outgoing.classList.add("hidden");
  incoming.classList.remove("hidden");
  incoming.src = item.url;
  incoming.alt = item.name;
  incoming.style.objectFit = state.slideshowFit;
  outgoing.style.objectFit = state.slideshowFit;
  incoming.style.animationDuration = `${Math.max(3, state.slideshowInterval)}s`;
  const vars = driftVars();
  for (const [key, value] of Object.entries(vars)) incoming.style.setProperty(key, value);
  incoming.classList.add(`effect-${effect}`);
  if (effect === "slide") incoming.classList.add(direction >= 0 ? "from-right" : "from-left");
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
      slideshowPlay.textContent = t().play;
      return;
    }
    next = 0;
  }
  if (next < 0) next = state.slideshowLoop ? state.slideshowItems.length - 1 : 0;
  state.slideshowIndex = next;
  renderSlideshow(direction);
}

function openSlideshowFromCurrent() {
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
  closeModal();
  slideshow.classList.remove("hidden");
  pauseAllInline();
  applyLanguage();
  renderSlideshow(1);
}

function closeSlideshow() {
  clearTimeout(state.slideshowTimer);
  slideshow.classList.add("hidden");
  slideshowImageA.removeAttribute("src");
  slideshowImageB.removeAttribute("src");
  if (state.playingEnabled) resumeVisibleInline();
}

function toggleSlideshowPlay() {
  state.slideshowPlaying = !state.slideshowPlaying;
  slideshowPlay.textContent = state.slideshowPlaying ? t().pause : t().play;
  scheduleSlideshow();
}

async function openInExplorer(rel) {
  try {
    const res = await fetch("/api/open?path=" + encodeURIComponent(rel));
    const data = await res.json();
    if (!data.ok) showToast(data.error || t().openFail);
  } catch {
    showToast(t().openFail);
  }
}

async function runFileAction(action) {
  const item = state.currentModalItem;
  if (!item) return;
  const message = action === "move_review" ? t().confirmReview : t().confirmTrash;
  if (!window.confirm(message)) return;
  try {
    const res = await fetch("/api/file-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rel: item.rel, confirm: true }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t().fileActionFail);
    state.all = state.all.filter(v => v.key !== item.key);
    state.view = state.view.filter(v => v.key !== item.key);
    closeModal();
    applyFilters();
    showToast(t().fileActionDone, 3600);
  } catch (err) {
    console.error(err);
    showToast(t().fileActionFail, 4200);
  }
}

async function chooseFolder() {
  showToast(t().chooseOpening, 3500);
  chooseFolderBtn.disabled = true;
  chooseFolderBtn.textContent = t().choosing;
  try {
    const res = await fetch("/api/choose-folder");
    const data = await res.json();
    if (data.ok && data.path) {
      pathInput.value = data.path;
      showToast(t().chosen);
    } else {
      showToast(t().notChosen);
    }
  } catch {
    showToast(t().chooseFail);
  } finally {
    chooseFolderBtn.disabled = false;
    chooseFolderBtn.textContent = t().chooseFolder;
  }
}

async function scanNow() {
  const videoDir = pathInput.value.trim();
  if (!videoDir) {
    showToast(t().needPath);
    return;
  }
  setBusy(true);
  emptyState.classList.remove("hidden");
  emptyState.querySelector("h2").textContent = t().scanProgress;
  emptyState.querySelector("p").textContent = videoDir;
  grid.innerHTML = "";
  pauseAllInline();
  try {
    const payload = {
      video_dir: videoDir,
      remember_path: rememberPath.checked,
      recursive: recursiveScan.checked,
      columns: state.columns,
      play_limit: state.playLimit,
      sort_mode: sortSelect.value,
      immersive: state.immersive,
      language: state.language,
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
      emptyState.classList.remove("hidden");
      emptyState.querySelector("h2").textContent = t().scanFail;
      emptyState.querySelector("p").textContent = data.error || t().unknown;
      showToast(data.error || t().scanFail, 4200);
      return;
    }
    state.all = data.videos || [];
    state.scannedPath = data.video_dir || videoDir;
    state.recursive = !!data.recursive;
    state.rememberPath = rememberPath.checked;
    state.sizeFilter = "all";
    state.dateFilter = "all";
    state.mediaType = "all";
    sizeFilterSelect.value = "all";
    dateFilterSelect.value = "all";
    mediaTypeSelect.value = "all";
    if (state.all.length === 0) {
      emptyState.classList.remove("hidden");
      emptyState.querySelector("h2").textContent = t().noVideosTitle;
      emptyState.querySelector("p").textContent = t().noVideosBody;
    }
    applyFilters();
    showToast(t().scanDone(state.all.length));
  } catch (e) {
    console.error(e);
    showToast(t().scanFail, 4200);
  } finally {
    setBusy(false);
  }
}

async function saveSettingsSoft() {
  try {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        remember_path: rememberPath.checked,
        last_video_dir: pathInput.value.trim(),
        recursive: recursiveScan.checked,
        columns: state.columns,
        play_limit: state.playLimit,
        sort_mode: sortSelect.value,
        immersive: state.immersive,
        language: state.language,
        slideshow_interval: state.slideshowInterval,
        slideshow_effect: state.slideshowEffect,
        slideshow_fit: state.slideshowFit,
        slideshow_loop: state.slideshowLoop,
      }),
    });
  } catch {}
}

function setColumns(cols) {
  state.columns = Math.max(4, Math.min(9, Number(cols) || 6));
  applyLayout();
  saveSettingsSoft();
}

function setPlayLimit(limit) {
  state.playLimit = Math.max(12, Math.min(30, Number(limit) || 24));
  applyLayout();
  saveSettingsSoft();
}

function setImmersive(enabled) {
  state.immersive = !!enabled;
  document.body.classList.toggle("immersive", state.immersive);
  immersiveBtn.textContent = state.immersive ? t().exitImmersive : t().immersive;
  updateSubInfo();
  saveSettingsSoft();
}

function setLanguage(lang, save = true) {
  state.language = lang === "zh" ? "zh" : "en";
  applyLanguage();
  if (state.all.length) renderGrid();
  if (save) saveSettingsSoft();
}

async function init() {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    const cfg = data.config || {};
    state.columns = Number(cfg.columns || 6);
    state.playLimit = Number(cfg.play_limit || 24);
    state.recursive = !!cfg.recursive;
    state.rememberPath = !!cfg.remember_path;
    state.sortMode = cfg.sort_mode || "mtime_desc";
    state.immersive = !!cfg.immersive;
    state.language = cfg.language === "zh" ? "zh" : "en";
    state.slideshowInterval = Number(cfg.slideshow_interval || 5);
    state.slideshowEffect = ["fade", "slide", "drift", "random"].includes(cfg.slideshow_effect) ? cfg.slideshow_effect : "drift";
    state.slideshowFit = cfg.slideshow_fit === "cover" ? "cover" : "contain";
    state.slideshowLoop = cfg.slideshow_loop !== false;
    pathInput.value = cfg.last_video_dir || "";
    rememberPath.checked = state.rememberPath;
    recursiveScan.checked = state.recursive;
    sortSelect.value = state.sortMode;
    playLimitSelect.value = String(state.playLimit);
    slideshowInterval.value = String(state.slideshowInterval);
    slideshowEffect.value = state.slideshowEffect;
    slideshowFit.value = state.slideshowFit;
    slideshowLoop.checked = state.slideshowLoop;
    applyLanguage();
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
chooseFolderBtn.addEventListener("click", chooseFolder);
scanBtn.addEventListener("click", scanNow);
pathInput.addEventListener("keydown", e => {
  if (e.key === "Enter") scanNow();
});
rememberPath.addEventListener("change", saveSettingsSoft);
recursiveScan.addEventListener("change", saveSettingsSoft);
reviewFilterSeg.addEventListener("click", e => {
  const btn = e.target.closest("button[data-review-filter]");
  if (!btn) return;
  state.reviewFilter = btn.dataset.reviewFilter;
  updateReviewFilterUI();
  applyFilters();
});
columnsSeg.addEventListener("click", e => {
  const btn = e.target.closest("button[data-columns]");
  if (btn) setColumns(btn.dataset.columns);
});
playLimitSelect.addEventListener("change", () => setPlayLimit(playLimitSelect.value));
shuffleBtn.addEventListener("click", () => {
  const q = searchInput.value.trim().toLowerCase();
  let items = state.all;
  if (q) items = items.filter(v => v.name.toLowerCase().includes(q) || v.rel.toLowerCase().includes(q));
  if (state.reviewFilter === "favorites") items = items.filter(v => v.favorite);
  if (state.reviewFilter === "selected") items = items.filter(v => v.selected);
  if (state.sizeFilter === "small") items = items.filter(v => Number(v.size_mb) < 10);
  if (state.sizeFilter === "medium") items = items.filter(v => Number(v.size_mb) >= 10 && Number(v.size_mb) < 50);
  if (state.sizeFilter === "large") items = items.filter(v => Number(v.size_mb) >= 50);
  const now = Date.now() / 1000;
  if (state.dateFilter === "day") items = items.filter(v => now - Number(v.mtime) <= 86400);
  if (state.dateFilter === "week") items = items.filter(v => now - Number(v.mtime) <= 86400 * 7);
  if (state.dateFilter === "month") items = items.filter(v => now - Number(v.mtime) <= 86400 * 30);
  if (state.mediaType !== "all") items = items.filter(v => v.type === state.mediaType);
  state.view = shuffle(items);
  renderGrid();
});
sizeFilterSelect.addEventListener("change", () => {
  state.sizeFilter = sizeFilterSelect.value;
  applyFilters();
});
dateFilterSelect.addEventListener("change", () => {
  state.dateFilter = dateFilterSelect.value;
  applyFilters();
});
mediaTypeSelect.addEventListener("change", () => {
  state.mediaType = mediaTypeSelect.value;
  applyFilters();
});
exportCsvBtn.addEventListener("click", exportCsv);
pauseBtn.addEventListener("click", () => {
  state.playingEnabled = !state.playingEnabled;
  if (state.playingEnabled) {
    pauseBtn.textContent = t().pauseAll;
    pauseBtn.classList.add("ghost");
    resumeVisibleInline();
  } else {
    pauseBtn.textContent = t().resume;
    pauseBtn.classList.remove("ghost");
    pauseAllInline();
  }
});
immersiveBtn.addEventListener("click", () => setImmersive(true));
expandBtn.addEventListener("click", () => setImmersive(false));
langToggle.addEventListener("click", () => setLanguage(state.language === "en" ? "zh" : "en"));
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => {
  if (e.target?.dataset?.close) closeModal();
});
modalOpenFolder.addEventListener("click", () => {
  if (state.currentModalItem) openInExplorer(state.currentModalItem.rel);
});
modalMoveReview.addEventListener("click", () => runFileAction("move_review"));
modalMoveTrash.addEventListener("click", () => runFileAction("move_trash"));
modalSlideshow.addEventListener("click", openSlideshowFromCurrent);
slideshowClose.addEventListener("click", closeSlideshow);
slideshowPrev.addEventListener("click", () => showNextSlide(-1));
slideshowNext.addEventListener("click", () => showNextSlide(1));
slideshowPlay.addEventListener("click", toggleSlideshowPlay);
slideshowInterval.addEventListener("change", () => {
  state.slideshowInterval = Number(slideshowInterval.value) || 5;
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
  if (!slideshow.classList.contains("hidden")) {
    if (e.key === "Escape") closeSlideshow();
    if (e.key === " ") {
      e.preventDefault();
      toggleSlideshowPlay();
    }
    if (e.key === "ArrowLeft") showNextSlide(-1);
    if (e.key === "ArrowRight") showNextSlide(1);
    return;
  }
  if (e.key === "Escape") {
    if (!modal.classList.contains("hidden")) closeModal();
    else if (state.immersive) setImmersive(false);
  }
});
window.addEventListener("scroll", () => scheduleUpdatePlaying(), { passive: true });
window.addEventListener("resize", () => scheduleUpdatePlaying());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseAllInline();
    modalVideo.pause();
  } else if (state.playingEnabled && modal.classList.contains("hidden")) {
    resumeVisibleInline();
  }
});
init();
