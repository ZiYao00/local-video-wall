const VIDEO_WARM_MARGIN_PX = 720;
const VIDEO_RELEASE_DELAY_MS = 1200;

function releaseVideoElement(video) {
  if (!video) return;
  video.pause();
  if (video.getAttribute("src")) {
    video.removeAttribute("src");
    video.load();
  }
}

export function createPlaybackController({ state, modal, slideshow, onMediaLoadChanged = () => {} }) {
  const visibleVideos = new Set();
  const warmVideos = new Set();
  const videoViewport = new Map();
  const releaseTimers = new Map();
  const blockedMediaKeys = new Set();

  let warmObserver = null;
  let playObserver = null;
  let updateFrame = null;

  function videoCardKey(video) {
    return video?.closest?.(".video-card")?.dataset?.key || "";
  }

  function isVideoBlocked(video) {
    const key = videoCardKey(video);
    return !!key && blockedMediaKeys.has(key);
  }

  function clearReleaseTimer(video) {
    const timer = releaseTimers.get(video);
    if (timer) clearTimeout(timer);
    releaseTimers.delete(video);
  }

  function evictVideo(video, options = {}) {
    if (!video) return;
    const notify = options.notify !== false;
    clearReleaseTimer(video);
    warmVideos.delete(video);
    visibleVideos.delete(video);
    videoViewport.delete(video);
    video.closest(".video-card")?.classList.remove("paused-by-limit");
    releaseVideoElement(video);
    if (notify) onMediaLoadChanged();
  }

  function scheduleRelease(video) {
    if (!video) return;
    video.pause();
    visibleVideos.delete(video);
    videoViewport.delete(video);
    video.closest(".video-card")?.classList.remove("paused-by-limit");
    clearReleaseTimer(video);
    const timer = setTimeout(() => {
      releaseTimers.delete(video);
      if (!video.isConnected || !warmVideos.has(video) || isVideoBlocked(video)) {
        evictVideo(video);
      }
    }, VIDEO_RELEASE_DELAY_MS);
    releaseTimers.set(video, timer);
  }

  function ensureVideoSrc(video) {
    if (!video || isVideoBlocked(video)) return;
    if (!video.getAttribute("src") && video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
      onMediaLoadChanged();
    }
  }

  function effectiveWallPlayLimit() {
    return state.columns >= 10 ? 0 : Math.max(4, Math.min(72, Number(state.playLimit) || 8));
  }

  function isWallPreviewStatic() {
    return !state.wallAutoplay || effectiveWallPlayLimit() <= 0;
  }

  function selectVideosByVisibleRows(candidates, playLimit) {
    if (playLimit <= 0) return [];
    const rows = new Map();
    for (const video of candidates) {
      const metric = videoViewport.get(video);
      if (!metric) continue;
      const rowIndex = Math.floor(metric.index / Math.max(1, state.columns));
      const row = rows.get(rowIndex) || { index: rowIndex, ratioTotal: 0, maxRatio: 0, items: [] };
      row.items.push({ video, ...metric });
      row.ratioTotal += metric.ratio;
      row.maxRatio = Math.max(row.maxRatio, metric.ratio);
      rows.set(rowIndex, row);
    }
    const orderedRows = [...rows.values()].sort((a, b) => {
      const avgA = a.ratioTotal / Math.max(1, a.items.length);
      const avgB = b.ratioTotal / Math.max(1, b.items.length);
      if (Math.abs(avgB - avgA) > .08) return avgB - avgA;
      if (Math.abs(b.maxRatio - a.maxRatio) > .08) return b.maxRatio - a.maxRatio;
      return a.index - b.index;
    });
    const selected = [];
    for (const row of orderedRows) {
      row.items.sort((a, b) => a.index - b.index);
      for (const item of row.items) {
        selected.push(item.video);
        if (selected.length >= playLimit) return selected;
      }
    }
    return selected;
  }

  function updatePlaying() {
    const started = performance.now();
    const playLimit = effectiveWallPlayLimit();
    const canPlayWall = (
      state.playingEnabled
      && !isWallPreviewStatic()
      && !(state.pauseWhenInactive && document.hidden)
      && modal.classList.contains("hidden")
      && slideshow.classList.contains("hidden")
      && !state.showTrash
    );
    const candidates = canPlayWall
      ? [...visibleVideos].filter(video => (
        video.isConnected
        && warmVideos.has(video)
        && !isVideoBlocked(video)
        && (videoViewport.get(video)?.ratio || 0) >= .1
      ))
      : [];
    const selected = selectVideosByVisibleRows(candidates, playLimit);
    const selectedSet = new Set(selected);
    const candidateSet = new Set(candidates);

    for (const video of [...warmVideos]) {
      if (!video.isConnected) {
        evictVideo(video);
        continue;
      }
      const card = video.closest(".video-card");
      if (isVideoBlocked(video)) {
        video.pause();
        card?.classList.remove("paused-by-limit");
        continue;
      }
      if (selectedSet.has(video)) {
        ensureVideoSrc(video);
        card?.classList.remove("paused-by-limit");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.play().catch(() => {});
      } else {
        video.pause();
        card?.classList.toggle("paused-by-limit", canPlayWall && candidateSet.has(video) && playLimit > 0);
      }
    }

    state.perf.warmVideos = warmVideos.size;
    state.perf.activeVideos = canPlayWall ? selected.length : 0;
    state.perf.schedulerMs = Math.round((performance.now() - started) * 10) / 10;
  }

  function scheduleUpdate() {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(() => {
      updateFrame = null;
      updatePlaying();
    });
  }

  function destroyObservers() {
    warmObserver?.disconnect();
    playObserver?.disconnect();
    warmObserver = null;
    playObserver = null;
  }

  function observe(videos) {
    destroyObservers();
    warmObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting && !isVideoBlocked(video)) {
          clearReleaseTimer(video);
          warmVideos.add(video);
          ensureVideoSrc(video);
        } else {
          warmVideos.delete(video);
          scheduleRelease(video);
        }
      }
      state.perf.warmVideos = warmVideos.size;
      scheduleUpdate();
    }, { root: null, rootMargin: `${VIDEO_WARM_MARGIN_PX}px 0px`, threshold: .01 });

    playObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0 && !isVideoBlocked(video)) {
          visibleVideos.add(video);
          videoViewport.set(video, {
            ratio: entry.intersectionRatio,
            index: Number(video.dataset.gridIndex) || 0,
          });
        } else {
          visibleVideos.delete(video);
          videoViewport.delete(video);
          video.pause();
          video.closest(".video-card")?.classList.remove("paused-by-limit");
        }
      }
      scheduleUpdate();
    }, { root: null, rootMargin: "0px", threshold: [0, .1, .25, .5, .75] });

    for (const video of videos) {
      warmObserver.observe(video);
      playObserver.observe(video);
    }
    scheduleUpdate();
  }

  function releaseGridMedia() {
    releaseTimers.forEach(timer => clearTimeout(timer));
    releaseTimers.clear();
    document.querySelectorAll(".video-wrap video").forEach(video => evictVideo(video, { notify: false }));
    visibleVideos.clear();
    warmVideos.clear();
    videoViewport.clear();
    state.perf.warmVideos = 0;
    state.perf.activeVideos = 0;
    onMediaLoadChanged();
  }

  function pauseAll() {
    document.querySelectorAll(".video-wrap video").forEach(video => {
      video.pause();
      video.closest(".video-card")?.classList.remove("paused-by-limit");
    });
    state.perf.activeVideos = 0;
  }

  function setBlocked(items, blocked) {
    for (const item of Array.isArray(items) ? items : [items]) {
      if (!item?.key) continue;
      if (blocked) blockedMediaKeys.add(item.key);
      else blockedMediaKeys.delete(item.key);
    }
    scheduleUpdate();
  }

  return {
    destroyObservers,
    effectiveWallPlayLimit,
    evictVideo,
    isWallPreviewStatic,
    observe,
    pauseAll,
    releaseGridMedia,
    resume: scheduleUpdate,
    scheduleUpdate,
    setBlocked,
  };
}
