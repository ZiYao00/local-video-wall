import { setIconButton } from "./viewer-icons.js";

const EFFECTS = new Set(["none", "fade", "slide", "drift", "random"]);
const FITS = new Set(["contain", "cover"]);

function clampInterval(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(15, Math.round(parsed)));
}

function randomDriftVars() {
  const directions = [
    ["-2%", "-1%", "3%", "2%"],
    ["2%", "1%", "-3%", "-2%"],
    ["-1%", "2%", "2%", "-3%"],
    ["1%", "-2%", "-2%", "3%"],
  ];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  return {
    "--sx": direction[0],
    "--sy": direction[1],
    "--ex": direction[2],
    "--ey": direction[3],
  };
}

export function createSlideshowEngine({
  root,
  initialState = {},
  onStateChange = () => {},
  text = {},
}) {
  const layerA = root.querySelector(".slide-layer-a");
  const layerB = root.querySelector(".slide-layer-b");
  const prevButton = root.querySelector(".image-prev");
  const nextButton = root.querySelector(".image-next");
  const playButton = root.querySelector(".slideshow-play");
  const intervalSelect = root.querySelector(".slideshow-interval");
  const effectSelect = root.querySelector(".slideshow-effect");
  const fitSelect = root.querySelector(".slideshow-fit");
  const loopButton = root.querySelector(".slideshow-loop");
  const fullscreenButton = root.querySelector(".slideshow-fullscreen");
  const counter = root.querySelector(".slideshow-counter");
  const tx = (key, fallback) => text[key] || fallback;

  const state = {
    items: [],
    index: 0,
    playing: initialState.playing !== false,
    interval: clampInterval(initialState.interval ?? 5),
    effect: EFFECTS.has(initialState.effect) ? initialState.effect : "drift",
    fit: FITS.has(initialState.fit) ? initialState.fit : "contain",
    loop: initialState.loop !== false,
    activeLayer: 0,
    active: false,
    timer: null,
    cleanupTimer: null,
  };

  function snapshot() {
    return {
      playing: state.playing,
      interval: state.interval,
      effect: state.effect,
      fit: state.fit,
      loop: state.loop,
    };
  }

  function emitState() {
    onStateChange(snapshot());
  }

  function resolveEffect() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return "none";
    if (state.effect !== "random") return state.effect;
    const effects = ["fade", "slide", "drift"];
    return effects[Math.floor(Math.random() * effects.length)];
  }

  function clearTimer() {
    if (state.timer) window.clearTimeout(state.timer);
    state.timer = null;
  }

  function clearCleanupTimer() {
    if (state.cleanupTimer) window.clearTimeout(state.cleanupTimer);
    state.cleanupTimer = null;
  }

  function updateCounter() {
    counter.textContent = state.items.length ? `${state.index + 1} / ${state.items.length}` : "";
    root.classList.toggle("has-multiple", state.items.length > 1);
  }

  function updateControls() {
    intervalSelect.value = String(state.interval);
    effectSelect.value = state.effect;
    fitSelect.value = state.fit;
    setIconButton(playButton, state.playing ? "pause" : "play", state.playing ? tx("pauseSlideshow", "Pause slideshow") : tx("playSlideshow", "Play slideshow"));
    setIconButton(loopButton, "repeat", state.loop ? tx("loopSlideshowOn", "Loop slideshow: on") : tx("loopSlideshowOff", "Loop slideshow: off"), { active: state.loop });
    const fullscreen = document.fullscreenElement === root;
    setIconButton(fullscreenButton, fullscreen ? "fullscreenExit" : "fullscreen", fullscreen ? tx("exitFullscreen", "Exit fullscreen") : tx("fullscreen", "Fullscreen"));
  }

  function schedule() {
    clearTimer();
    if (!state.active || !state.playing || state.items.length < 2) return;
    state.timer = window.setTimeout(() => showNext(1), state.interval * 1000);
  }

  function prepareLayer(layer, item) {
    layer.className = "dual-slide-layer";
    layer.classList.remove("hidden");
    layer.src = item.url;
    layer.alt = item.name || "Image";
    layer.style.objectFit = state.fit;
    layer.style.removeProperty("--drift-duration");
    layer.style.removeProperty("--sx");
    layer.style.removeProperty("--sy");
    layer.style.removeProperty("--ex");
    layer.style.removeProperty("--ey");
    layer.style.animationDuration = "";
  }

  function render(direction = 1) {
    const item = state.items[state.index];
    if (!item) {
      clearTimer();
      layerA.removeAttribute("src");
      layerB.removeAttribute("src");
      layerA.className = "dual-slide-layer";
      layerB.className = "dual-slide-layer hidden";
      updateCounter();
      return;
    }

    const incoming = state.activeLayer === 0 ? layerB : layerA;
    const outgoing = state.activeLayer === 0 ? layerA : layerB;
    const effect = resolveEffect();
    clearCleanupTimer();
    prepareLayer(incoming, item);
    outgoing.classList.remove("hidden");
    incoming.style.zIndex = "2";
    outgoing.style.zIndex = "1";
    outgoing.style.objectFit = state.fit;

    const duration = effect === "drift"
      ? state.interval * 1000
      : effect === "fade"
        ? 650
        : effect === "slide"
          ? 560
          : 0;
    const outgoingDuration = effect === "drift" ? 760 : duration;

    if (effect === "none") {
      outgoing.classList.add("hidden");
    } else {
      if (effect === "drift") {
        incoming.style.setProperty("--drift-duration", `${duration}ms`);
        for (const [key, value] of Object.entries(randomDriftVars())) incoming.style.setProperty(key, value);
        incoming.classList.add("effect-drift");
        outgoing.classList.add("effect-drift-out");
      } else if (effect === "fade") {
        incoming.style.animationDuration = `${duration}ms`;
        outgoing.style.animationDuration = `${outgoingDuration}ms`;
        incoming.classList.add("effect-fade");
        outgoing.classList.add("effect-fade-out");
      } else if (effect === "slide") {
        incoming.style.animationDuration = `${duration}ms`;
        outgoing.style.animationDuration = `${outgoingDuration}ms`;
        incoming.classList.add("effect-slide", direction >= 0 ? "from-right" : "from-left");
        outgoing.classList.add("effect-slide-out", direction >= 0 ? "to-left" : "to-right");
      }
      state.cleanupTimer = window.setTimeout(() => outgoing.classList.add("hidden"), outgoingDuration + 40);
    }

    state.activeLayer = state.activeLayer === 0 ? 1 : 0;
    updateCounter();
    schedule();
  }

  function showNext(direction = 1) {
    if (!state.items.length) return;
    let next = state.index + direction;
    if (next >= state.items.length) {
      if (!state.loop) {
        state.playing = false;
        updateControls();
        emitState();
        clearTimer();
        return;
      }
      next = 0;
    }
    if (next < 0) next = state.loop ? state.items.length - 1 : 0;
    state.index = next;
    render(direction);
  }

  function setPlaying(value) {
    state.playing = Boolean(value);
    updateControls();
    if (state.playing) schedule();
    else clearTimer();
    emitState();
  }

  function setItems(items, preferredIndex = 0) {
    state.items = Array.isArray(items) ? items : [];
    state.index = Math.max(0, Math.min(Number(preferredIndex) || 0, Math.max(0, state.items.length - 1)));
    updateCounter();
    if (state.active) render(1);
  }

  function setActive(active) {
    state.active = Boolean(active);
    if (!state.active) {
      clearTimer();
      return;
    }
    render(1);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen?.();
      else await root.requestFullscreen?.();
    } catch {
      // Browser fullscreen can be denied; controls remain usable in-window.
    }
  }

  for (let second = 1; second <= 15; second += 1) {
    const option = document.createElement("option");
    option.value = String(second);
    option.textContent = `${second}s`;
    intervalSelect.appendChild(option);
  }

  prevButton.addEventListener("click", () => showNext(-1));
  nextButton.addEventListener("click", () => showNext(1));
  playButton.addEventListener("click", () => setPlaying(!state.playing));
  intervalSelect.addEventListener("change", () => {
    state.interval = clampInterval(intervalSelect.value);
    updateControls();
    render(1);
    emitState();
  });
  effectSelect.addEventListener("change", () => {
    state.effect = EFFECTS.has(effectSelect.value) ? effectSelect.value : "drift";
    render(1);
    emitState();
  });
  fitSelect.addEventListener("change", () => {
    state.fit = FITS.has(fitSelect.value) ? fitSelect.value : "contain";
    render(1);
    emitState();
  });
  loopButton.addEventListener("click", () => {
    state.loop = !state.loop;
    updateControls();
    emitState();
  });
  fullscreenButton.addEventListener("click", () => void toggleFullscreen());
  document.addEventListener("fullscreenchange", updateControls);

  updateControls();
  updateCounter();

  return {
    getState: snapshot,
    setActive,
    setItems,
    setPlaying,
    showNext,
    destroy() {
      clearTimer();
      clearCleanupTimer();
    },
  };
}
