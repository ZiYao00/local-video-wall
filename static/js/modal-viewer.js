export function createModalViewer({
  state,
  elements,
  getText,
  fmtBytes,
  setButtonLabel,
  getImageItems,
  getVideoItems,
  hideFloatingPager,
  pauseInlinePlayback,
  resumeInlinePlayback,
  releaseMediaElement,
  updateGridPager,
  applyActionButtons,
  setControlsHidden,
  scheduleAutoHideControls,
  stopModalSlideshow,
  loadMetadata,
  showToast,
}) {
  const {
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
  } = elements;

  function updateVideoModeUI() {
    const tx = getText();
    const modeLabels = {
      loop: [tx.loopOne, "repeat"],
      sequence: [tx.sequential, "list"],
      random: [tx.randomPlay, "shuffle"],
    };
    modalVideoModeSeg.querySelectorAll("button[data-video-mode]").forEach(button => {
      const [label, icon] = modeLabels[button.dataset.videoMode] || [button.textContent, "play"];
      setButtonLabel(button, label, icon, { iconOnly: true });
      button.classList.toggle("active", button.dataset.videoMode === state.videoMode);
    });
    modalVideo.loop = state.videoMode === "loop";
  }

  function updateNav() {
    const currentType = state.currentModalItem?.type;
    const items = currentType === "image"
      ? getImageItems()
      : currentType === "video"
        ? getVideoItems()
        : [];
    const canNavigate = items.length > 1;
    modalPrev.classList.toggle("hidden", !canNavigate);
    modalNext.classList.toggle("hidden", !canNavigate);
  }

  function playVideoSoon() {
    setTimeout(() => modalVideo.play().catch(() => {}), 30);
  }

  function applyVideoAudioState() {
    const volume = Number(state.modalVolume);
    modalVideo.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
    modalVideo.muted = !!state.modalMuted;
  }

  function renderItem(item) {
    if (item.type !== "image" && state.modalSlideshowPlaying) stopModalSlideshow();
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

    modalVideoControls.classList.toggle("hidden", item.type !== "video");
    modalContent.classList.toggle("is-video", item.type === "video");

    if (item.type === "image") {
      modalImage.src = item.url;
      modalImage.alt = item.name;
    } else {
      modalVideo.src = item.url;
      applyVideoAudioState();
      updateVideoModeUI();
    }

    loadMetadata(item);
    updateNav();
    applyActionButtons();
  }

  function open(item) {
    hideFloatingPager();
    pauseInlinePlayback();
    renderItem(item);
    setControlsHidden(false);
    modal.classList.remove("hidden");
    scheduleAutoHideControls("modal", item.type === "video" ? 2000 : 1500, true);
    pauseInlinePlayback();
    if (item.type !== "image") playVideoSoon();
  }

  function close() {
    if (document.fullscreenElement === modalContent) document.exitFullscreen?.();
    stopModalSlideshow();
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
    if (state.playingEnabled) resumeInlinePlayback();
  }

  function showVideo(direction = 1) {
    const current = state.currentModalItem;
    if (!current || current.type !== "video") return;
    const videos = getVideoItems();
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

    renderItem(videos[next]);
    playVideoSoon();
  }

  function adjustVideoVolume(delta) {
    const next = Math.max(0, Math.min(1, modalVideo.volume + delta));
    modalVideo.volume = next;
    if (next > 0) modalVideo.muted = false;
    showToast(`${getText().volumeLabel} ${Math.round(next * 100)}%`, 900);
  }

  return {
    adjustVideoVolume,
    close,
    open,
    playVideoSoon,
    renderItem,
    showVideo,
    updateNav,
    updateVideoModeUI,
  };
}
