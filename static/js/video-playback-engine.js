import { setIconButton, setSegmentIcon } from "./viewer-icons.js";

const MODES = new Set(["loop", "sequence", "random"]);

function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(0, Math.min(1, number));
}

export function createVideoPlaybackEngine({
  root,
  initialState = {},
  onStateChange = () => {},
  showStatus = () => {},
  text = {},
}) {
  const video = root.querySelector(".pane-video");
  const prevButton = root.querySelector(".video-prev");
  const nextButton = root.querySelector(".video-next");
  const modeButtons = [...root.querySelectorAll("[data-video-mode]")];
  const fullscreenButton = root.querySelector(".video-fullscreen");
  const counter = root.querySelector(".video-counter");
  const tx = (key, fallback) => text[key] || fallback;

  const state = {
    items: [],
    index: 0,
    mode: MODES.has(initialState.mode) ? initialState.mode : "loop",
    volume: clampVolume(initialState.volume ?? 1),
    muted: Boolean(initialState.muted),
    active: false,
  };

  function snapshot() {
    return {
      mode: state.mode,
      volume: state.volume,
      muted: state.muted,
    };
  }

  function emitState() {
    onStateChange(snapshot());
  }

  function updateCounter() {
    counter.textContent = state.items.length ? `${state.index + 1} / ${state.items.length}` : "";
    root.classList.toggle("has-multiple", state.items.length > 1);
  }

  function updateControls() {
    const labels = {
      loop: ["repeat", tx("loopOne", "Loop one")],
      sequence: ["list", tx("sequence", "Play in sequence")],
      random: ["shuffle", tx("randomPlay", "Random play")],
    };
    for (const button of modeButtons) {
      const mode = button.dataset.videoMode;
      const [icon, title] = labels[mode] || ["play", mode];
      setSegmentIcon(button, icon, title, mode === state.mode);
    }
    video.loop = state.mode === "loop";
    const fullscreen = document.fullscreenElement === root;
    setIconButton(fullscreenButton, fullscreen ? "fullscreenExit" : "fullscreen", fullscreen ? tx("exitFullscreen", "Exit fullscreen") : tx("fullscreen", "Fullscreen"));
  }

  function fitVideoToViewport() {
    if (!video.videoWidth || !video.videoHeight) return;
    const rect = root.getBoundingClientRect();
    const availableWidth = Math.max(1, rect.width);
    const availableHeight = Math.max(1, rect.height);
    const aspect = video.videoWidth / video.videoHeight;
    let width = availableWidth;
    let height = width / aspect;
    if (height > availableHeight) {
      height = availableHeight;
      width = height * aspect;
    }
    video.style.width = `${Math.max(1, Math.floor(width))}px`;
    video.style.height = `${Math.max(1, Math.floor(height))}px`;
  }

  function tryPlay() {
    if (!state.active) return;
    window.setTimeout(() => {
      video.play().catch(() => showStatus(tx("clickPlay", "Click play to start video"), 1800));
    }, 20);
  }

  function renderCurrent({ autoplay = true } = {}) {
    const item = state.items[state.index];
    if (!item) {
      video.pause();
      video.removeAttribute("src");
      video.style.removeProperty("width");
      video.style.removeProperty("height");
      updateCounter();
      return;
    }
    video.pause();
    video.src = item.url;
    video.volume = state.volume;
    video.muted = state.muted;
    video.loop = state.mode === "loop";
    updateCounter();
    if (autoplay && state.active) tryPlay();
  }

  function showVideo(direction = 1) {
    if (state.items.length < 2) return;
    if (direction === 0) {
      let next = Math.floor(Math.random() * state.items.length);
      if (state.items.length > 1 && next === state.index) next = (next + 1) % state.items.length;
      state.index = next;
    } else {
      state.index = (state.index + direction + state.items.length) % state.items.length;
    }
    renderCurrent();
  }

  function setMode(mode) {
    if (!MODES.has(mode)) return;
    state.mode = mode;
    updateControls();
    emitState();
  }

  function setItems(items, preferredIndex = 0) {
    state.items = Array.isArray(items) ? items : [];
    state.index = Math.max(0, Math.min(Number(preferredIndex) || 0, Math.max(0, state.items.length - 1)));
    updateCounter();
    if (state.active) renderCurrent();
  }

  function setActive(active) {
    state.active = Boolean(active);
    if (!state.active) {
      video.pause();
      return;
    }
    renderCurrent();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen?.();
      else await root.requestFullscreen?.();
    } catch {
      // Browser fullscreen can be denied; keep the in-window player active.
    }
  }

  prevButton.addEventListener("click", () => showVideo(-1));
  nextButton.addEventListener("click", () => showVideo(1));
  for (const button of modeButtons) {
    button.addEventListener("click", () => setMode(button.dataset.videoMode));
  }
  fullscreenButton.addEventListener("click", () => void toggleFullscreen());

  video.addEventListener("loadedmetadata", fitVideoToViewport);
  video.addEventListener("volumechange", () => {
    state.volume = clampVolume(video.volume);
    state.muted = Boolean(video.muted);
    emitState();
  });
  video.addEventListener("ended", () => {
    if (state.mode === "sequence") showVideo(1);
    else if (state.mode === "random") showVideo(0);
  });
  document.addEventListener("fullscreenchange", () => {
    updateControls();
    window.requestAnimationFrame(fitVideoToViewport);
  });

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => fitVideoToViewport())
    : null;
  resizeObserver?.observe(root);

  updateControls();
  updateCounter();

  return {
    getState: snapshot,
    setActive,
    setItems,
    setMode,
    showVideo,
    destroy() {
      resizeObserver?.disconnect();
      video.pause();
    },
  };
}
