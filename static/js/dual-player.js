import { createApiClient } from "./api-client.js";
import { createPathSourceController, createSharedPathStateStore } from "./path-source-controller.js";
import { createSlideshowEngine } from "./slideshow-engine.js";
import { createVideoPlaybackEngine } from "./video-playback-engine.js";
import { initDesktopWindowControls } from "./desktop-window-controls.js";
import { setIconButton } from "./viewer-icons.js";

const api = createApiClient();
const STORAGE_KEY = "localVideoWall.dualPlayer.v2";
const LEGACY_STORAGE_KEY = "localVideoWall.dualPlayer.v1";
const REQUIRED_CAPABILITY = "dual_player";
const HIDE_DELAY = 2400;
const backendNotice = document.getElementById("backendNotice");
const backButton = document.querySelector(".dual-back-btn");
const desktopMinimizeButton = document.querySelector(".desktop-window-minimize");
const desktopCloseButton = document.querySelector(".desktop-window-close");
initDesktopWindowControls({ minimizeButton: desktopMinimizeButton, closeButton: desktopCloseButton });
backButton?.addEventListener("click", () => { window.location.href = "/"; });
let backendReady = false;

const DUAL_I18N = {
  en: {
    htmlLang: "en", title: "Local Video Wall - Dual Player", dualPlayer: "Dual media player", leftPlayer: "Left player", rightPlayer: "Right player",
    back: "Back to Media Wall", minimize: "Minimize", close: "Close", pathPlaceholder: "Enter a file or folder path", leftMediaPath: "Left media path", rightMediaPath: "Right media path",
    pathHistory: "Path history", chooseFolder: "Choose folder", scan: "Scan", recursive: "Scan subfolders (max 2 levels)", mediaType: "Media type", images: "Images", videos: "Videos",
    prevImage: "Previous image", nextImage: "Next image", slideshowInterval: "Slideshow interval", slideshowEffect: "Slideshow effect", none: "None", fade: "Fade", slide: "Slide", drift: "Drift", random: "Random",
    imageFit: "Image fit", contain: "Contain", cover: "Cover", prevVideo: "Previous video", nextVideo: "Next video", playbackOrder: "Video playback order",
    emptyTitle: "No media loaded", emptyBody: "Choose or enter a path above, then Scan.", addFavorite: "Add favorite", removeFavorite: "Remove favorite", noHistory: "No history yet",
    removeHistory: "Remove history", clearHistory: "Clear history", removeHistoryFail: "Could not remove history", clearHistoryFail: "Could not clear history", favoriteFail: "Could not update favorite",
    folderPickerFail: "Could not open folder picker", enterPath: "Enter a file or folder path first.", noSupported: "No supported media found", backendUnavailable: "Dual Player backend is unavailable. Restart Local Video Wall and reload this page.",
    scanning: "Scanning…", scanFail: "Could not scan media source", pauseSlideshow: "Pause slideshow", playSlideshow: "Play slideshow", loopSlideshowOn: "Loop slideshow: on", loopSlideshowOff: "Loop slideshow: off",
    fullscreen: "Fullscreen", exitFullscreen: "Exit fullscreen", loopOne: "Loop one", sequence: "Play in sequence", randomPlay: "Random play", clickPlay: "Click play to start video",
    backendConnectFail: "Could not connect to the Local Video Wall backend. Restart the service, then reload this page.", backendInactive: "Dual Player backend is not active. The page is newer than the running Python service. Restart Local Video Wall, then reload this page.",
  },
  zh: {
    htmlLang: "zh-CN", title: "Local Video Wall - 双播放器", dualPlayer: "双媒体播放器", leftPlayer: "左侧播放器", rightPlayer: "右侧播放器",
    back: "返回媒体墙", minimize: "最小化", close: "关闭", pathPlaceholder: "输入媒体文件或文件夹路径", leftMediaPath: "左侧媒体路径", rightMediaPath: "右侧媒体路径",
    pathHistory: "路径历史", chooseFolder: "选择文件夹", scan: "扫描", recursive: "扫描子文件夹（最多 2 层）", mediaType: "媒体类型", images: "图片", videos: "视频",
    prevImage: "上一张图片", nextImage: "下一张图片", slideshowInterval: "幻灯片间隔", slideshowEffect: "幻灯片效果", none: "无", fade: "淡入淡出", slide: "滑动", drift: "动态漂移", random: "随机",
    imageFit: "图片适配", contain: "完整显示", cover: "填满", prevVideo: "上一个视频", nextVideo: "下一个视频", playbackOrder: "视频播放顺序",
    emptyTitle: "尚未加载媒体", emptyBody: "选择或输入上方路径，然后点击扫描。", addFavorite: "添加收藏", removeFavorite: "取消收藏", noHistory: "暂无路径历史",
    removeHistory: "删除历史", clearHistory: "清空历史", removeHistoryFail: "删除路径历史失败", clearHistoryFail: "清空路径历史失败", favoriteFail: "更新收藏失败",
    folderPickerFail: "无法打开文件夹选择器", enterPath: "请先输入媒体文件或文件夹路径。", noSupported: "没有找到支持的媒体", backendUnavailable: "Dual Player 后端不可用，请重启 Local Video Wall 后刷新页面。",
    scanning: "扫描中…", scanFail: "扫描媒体源失败", pauseSlideshow: "暂停幻灯片", playSlideshow: "播放幻灯片", loopSlideshowOn: "幻灯片循环：开启", loopSlideshowOff: "幻灯片循环：关闭",
    fullscreen: "全屏", exitFullscreen: "退出全屏", loopOne: "单个循环", sequence: "顺序播放", randomPlay: "随机播放", clickPlay: "点击播放按钮开始视频",
    backendConnectFail: "无法连接 Local Video Wall 后端，请重启服务后刷新页面。", backendInactive: "Dual Player 后端尚未启用，当前页面版本新于正在运行的 Python 服务。请重启 Local Video Wall 后刷新页面。",
  },
};

function applyDualLanguage(text) {
  document.documentElement.lang = text.htmlLang;
  document.title = text.title;
  document.querySelector("main.dual-player")?.setAttribute("aria-label", text.dualPlayer);
  setIconButton(backButton, "back", text.back);
  setIconButton(desktopMinimizeButton, "minimize", text.minimize);
  setIconButton(desktopCloseButton, "close", text.close);
  for (const pane of document.querySelectorAll(".player-pane")) {
    const left = pane.dataset.pane === "left";
    pane.setAttribute("aria-label", left ? text.leftPlayer : text.rightPlayer);
    const input = pane.querySelector(".path-input");
    if (input) {
      input.placeholder = text.pathPlaceholder;
      input.setAttribute("aria-label", left ? text.leftMediaPath : text.rightMediaPath);
    }
    const mode = pane.querySelector(".mode-select");
    mode?.setAttribute("aria-label", text.mediaType);
    if (mode) {
      mode.querySelector('[value="image"]').textContent = text.images;
      mode.querySelector('[value="video"]').textContent = text.videos;
    }
    pane.querySelector(".image-prev")?.setAttribute("aria-label", text.prevImage);
    pane.querySelector(".image-next")?.setAttribute("aria-label", text.nextImage);
    pane.querySelector(".video-prev")?.setAttribute("aria-label", text.prevVideo);
    pane.querySelector(".video-next")?.setAttribute("aria-label", text.nextVideo);
    const interval = pane.querySelector(".slideshow-interval");
    const effect = pane.querySelector(".slideshow-effect");
    const fit = pane.querySelector(".slideshow-fit");
    interval?.setAttribute("aria-label", text.slideshowInterval);
    effect?.setAttribute("aria-label", text.slideshowEffect);
    fit?.setAttribute("aria-label", text.imageFit);
    if (effect) {
      effect.querySelector('[value="none"]').textContent = text.none;
      effect.querySelector('[value="fade"]').textContent = text.fade;
      effect.querySelector('[value="slide"]').textContent = text.slide;
      effect.querySelector('[value="drift"]').textContent = text.drift;
      effect.querySelector('[value="random"]').textContent = text.random;
    }
    if (fit) {
      fit.querySelector('[value="contain"]').textContent = text.contain;
      fit.querySelector('[value="cover"]').textContent = text.cover;
    }
    pane.querySelector(".video-mode-seg")?.setAttribute("aria-label", text.playbackOrder);
    const empty = pane.querySelector(".pane-empty");
    if (empty) {
      empty.querySelector("strong").textContent = text.emptyTitle;
      empty.querySelector("span").textContent = text.emptyBody;
    }
  }
}

function readSavedState() {
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore invalid local state and fall back to defaults.
    }
  }
  return {};
}

function writeSavedState(panes) {
  const data = {};
  for (const pane of panes) {
    data[pane.name] = {
      path: pane.state.path || "",
      recursive: Boolean(pane.state.recursive),
      mode: pane.state.mode || "",
      slideshow: { ...pane.state.slideshow },
      video: { ...pane.state.video },
    };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function requestJson(url, options = {}, label = "Request") {
  const response = await api.request(url, options);
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const body = await response.text();

  if (!contentType.includes("application/json")) {
    const outdated = response.status === 404 || body.trimStart().startsWith("<!DOCTYPE");
    const hint = outdated
      ? " The running Local Video Wall backend may be outdated. Restart the Local Video Wall service, then reload this page."
      : "";
    throw new Error(`${label} returned HTTP ${response.status} instead of JSON.${hint}`);
  }

  let data = {};
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `${label} failed with HTTP ${response.status}.`);
  }
  return data;
}

function setBackendNotice(message) {
  backendNotice.textContent = message || "";
  backendNotice.classList.toggle("hidden", !message);
}

function applySharedUiConfig(config, text) {
  applyDualLanguage(text);
  let localTheme = "";
  let localFontSize = "";
  try {
    localTheme = localStorage.getItem("localVideoWallTheme") || "";
    localFontSize = localStorage.getItem("localVideoWallFontSize") || "";
  } catch {
    // Local UI preferences are optional.
  }

  const theme = (localTheme || config?.theme) === "light" ? "light" : "dark";
  const fontSizeCandidate = localFontSize || config?.font_size;
  const fontSize = ["small", "standard", "large"].includes(fontSizeCandidate) ? fontSizeCandidate : "small";
  document.body.classList.toggle("theme-light", theme === "light");
  document.body.classList.remove("font-size-small", "font-size-standard", "font-size-large");
  document.body.classList.add(`font-size-${fontSize}`, "icon-buttons");
}

function attachAutoHide(viewer) {
  let hideTimer = null;
  let controlsHover = false;
  const interactive = [...viewer.querySelectorAll(".media-controls, .nav-arrow")];

  function scheduleHide() {
    if (hideTimer) window.clearTimeout(hideTimer);
    if (controlsHover) return;
    hideTimer = window.setTimeout(() => {
      if (!controlsHover) viewer.classList.remove("controls-visible");
    }, HIDE_DELAY);
  }

  function reveal() {
    viewer.classList.add("controls-visible");
    scheduleHide();
  }

  viewer.addEventListener("mousemove", reveal);
  viewer.addEventListener("mouseenter", reveal);
  viewer.addEventListener("mouseleave", () => {
    controlsHover = false;
    scheduleHide();
  });

  for (const element of interactive) {
    element.addEventListener("mouseenter", () => {
      controlsHover = true;
      if (hideTimer) window.clearTimeout(hideTimer);
    });
    element.addEventListener("mouseleave", () => {
      controlsHover = false;
      scheduleHide();
    });
  }

  return {
    reveal,
    destroy() {
      if (hideTimer) window.clearTimeout(hideTimer);
    },
  };
}

function createPane(root, saved, defaults, pathStore, persist, text) {
  const name = root.dataset.pane;
  const modeSelect = root.querySelector(".mode-select");
  const imageViewer = root.querySelector(".image-viewer");
  const videoViewer = root.querySelector(".video-viewer");
  const status = root.querySelector(".pane-status");
  let statusTimer = null;
  let pathController = null;

  const state = {
    path: saved?.path || "",
    recursive: Boolean(saved?.recursive),
    mode: saved?.mode || "",
    sourceType: "",
    allItems: [],
    slideshow: {
      playing: saved?.slideshow?.playing !== false,
      interval: Number(saved?.slideshow?.interval ?? defaults.slideshow.interval),
      effect: saved?.slideshow?.effect || defaults.slideshow.effect,
      fit: saved?.slideshow?.fit || defaults.slideshow.fit,
      loop: saved?.slideshow?.loop ?? defaults.slideshow.loop,
    },
    video: {
      mode: saved?.video?.mode || "loop",
      volume: Number(saved?.video?.volume ?? 1),
      muted: Boolean(saved?.video?.muted),
    },
  };

  function showStatus(message, hold = 2200) {
    if (statusTimer) window.clearTimeout(statusTimer);
    status.textContent = message || "";
    status.classList.toggle("visible", Boolean(message));
    if (message && hold > 0) {
      statusTimer = window.setTimeout(() => {
        if (status.textContent === message) status.classList.remove("visible");
      }, hold);
    }
  }

  const slideshow = createSlideshowEngine({
    root: imageViewer,
    initialState: state.slideshow,
    text,
    onStateChange(next) {
      state.slideshow = next;
      persist();
    },
  });

  const video = createVideoPlaybackEngine({
    root: videoViewer,
    initialState: state.video,
    showStatus,
    text,
    onStateChange(next) {
      state.video = next;
      persist();
    },
  });

  const imageAutoHide = attachAutoHide(imageViewer);
  const videoAutoHide = attachAutoHide(videoViewer);

  function setEmpty() {
    root.classList.remove("has-source", "is-image", "is-video");
    imageViewer.classList.add("hidden");
    videoViewer.classList.add("hidden");
    slideshow.setActive(false);
    video.setActive(false);
  }

  function applyMode(mode) {
    const items = state.allItems.filter((item) => item.type === mode);
    if (!items.length) {
      setEmpty();
      showStatus(text.noSupported, 3200);
      return;
    }

    state.mode = mode;
    modeSelect.value = mode;
    root.classList.add("has-source");
    root.classList.toggle("is-image", mode === "image");
    root.classList.toggle("is-video", mode === "video");

    if (mode === "image") {
      video.setActive(false);
      videoViewer.classList.add("hidden");
      imageViewer.classList.remove("hidden");
      slideshow.setItems(items, 0);
      slideshow.setActive(true);
      imageAutoHide.reveal();
    } else {
      slideshow.setActive(false);
      imageViewer.classList.add("hidden");
      videoViewer.classList.remove("hidden");
      video.setItems(items, 0);
      video.setActive(true);
      videoAutoHide.reveal();
    }
    persist();
  }

  function chooseInitialMode() {
    const hasImages = state.allItems.some((item) => item.type === "image");
    const hasVideos = state.allItems.some((item) => item.type === "video");
    modeSelect.hidden = !(hasImages && hasVideos);

    if (hasImages && hasVideos) {
      applyMode(state.mode === "video" ? "video" : "image");
    } else if (hasImages) {
      applyMode("image");
    } else if (hasVideos) {
      applyMode("video");
    } else {
      setEmpty();
      showStatus(text.noSupported, 3200);
    }
  }

  async function scanSource({ path, recursive }) {
    if (!backendReady) {
      showStatus(text.backendUnavailable, 4300);
      return null;
    }

    state.path = path;
    state.recursive = Boolean(recursive);
    persist();
    showStatus(text.scanning, 0);

    try {
      const data = await requestJson(
        "/api/player/source",
        {
          method: "POST",
          body: JSON.stringify({ path, recursive: state.recursive }),
        },
        "Dual Player scan",
      );

      state.path = data.path || path;
      state.sourceType = data.source_type || "";
      state.allItems = Array.isArray(data.items) ? data.items : [];
      status.classList.remove("visible");
      pathController?.setPath(state.path, { type: state.sourceType });
      chooseInitialMode();
      persist();
      return { path: state.path, sourceType: state.sourceType };
    } catch (error) {
      showStatus(error?.message || text.scanFail, 5200);
      return null;
    }
  }

  pathController = createPathSourceController({
    root: root.querySelector(".source-toolbar"),
    api,
    store: pathStore,
    initialPath: state.path,
    initialRecursive: state.recursive,
    showStatus,
    text,
    onScan: scanSource,
    onPathStateChange(next) {
      state.path = next.path;
      state.recursive = next.recursive;
      persist();
    },
  });

  modeSelect.addEventListener("change", () => applyMode(modeSelect.value));

  return {
    name,
    state,
    setBackendReady(ready) {
      pathController.setEnabled(ready);
    },
    destroy() {
      pathController.destroy();
      slideshow.destroy();
      video.destroy();
      imageAutoHide.destroy();
      videoAutoHide.destroy();
      if (statusTimer) window.clearTimeout(statusTimer);
    },
  };
}

const saved = readSavedState();
const pathStore = createSharedPathStateStore({ api });
let panes = [];
function persist() { writeSavedState(panes); }

const bootstrap = await api.bootstrap();
let config = {};
try {
  config = await pathStore.load();
} catch (error) {
  console.warn("Could not load shared path state", error);
}
const language = config?.language === "zh" ? "zh" : "en";
const text = DUAL_I18N[language];
applySharedUiConfig(config, text);

const defaults = {
  slideshow: {
    interval: Math.max(1, Math.min(15, Number(config.slideshow_interval || 5))),
    effect: ["none", "fade", "slide", "drift", "random"].includes(config.slideshow_effect) ? config.slideshow_effect : "drift",
    fit: config.slideshow_fit === "cover" ? "cover" : "contain",
    loop: config.slideshow_loop !== false,
  },
};

panes = [...document.querySelectorAll(".player-pane")].map((root) => (
  createPane(root, saved[root.dataset.pane], defaults, pathStore, persist, text)
));

if (!bootstrap) {
  setBackendNotice(text.backendConnectFail);
} else {
  const capabilities = new Set(Array.isArray(bootstrap.capabilities) ? bootstrap.capabilities : []);
  if (!capabilities.has(REQUIRED_CAPABILITY)) {
    setBackendNotice(text.backendInactive);
  } else {
    backendReady = true;
    setBackendNotice("");
  }
}

for (const pane of panes) pane.setBackendReady(backendReady);
