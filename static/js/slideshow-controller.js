export function createSlideshowController({
  state,
  elements,
  getText,
  getImageItems,
  showModalImage,
  openModal,
  closeModal,
  hideFloatingPager,
  pauseInlinePlayback,
  resumeInlinePlayback,
  releaseMediaElement,
  updateGridPager,
  applyActionButtons,
  applyLanguage,
  scheduleAutoHideControls,
  compactText,
  labelText,
  showToast,
  updateFullscreenLabels,
}) {
  const {
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
  } = elements;

  function resolveEffect() {
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
    const direction = dirs[Math.floor(Math.random() * dirs.length)];
    return {
      "--sx": direction[0],
      "--sy": direction[1],
      "--ex": direction[2],
      "--ey": direction[3],
    };
  }

  function render(direction = 1) {
    const item = state.slideshowItems[state.slideshowIndex];
    if (!item) return;

    const incoming = state.slideshowActiveLayer === 0 ? slideshowImageB : slideshowImageA;
    const outgoing = state.slideshowActiveLayer === 0 ? slideshowImageA : slideshowImageB;
    const effect = resolveEffect();

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

    const duration = effect === "drift"
      ? Math.max(1, state.slideshowInterval) * 1000
      : effect === "fade"
        ? 650
        : effect === "slide"
          ? 560
          : 0;
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
    schedule();
  }

  function schedule() {
    clearTimeout(state.slideshowTimer);
    if (!state.slideshowPlaying || slideshow.classList.contains("hidden")) return;
    state.slideshowTimer = setTimeout(() => showNext(1), state.slideshowInterval * 1000);
  }

  function setPlaying(playing) {
    state.slideshowPlaying = !!playing;
    if (!state.slideshowPlaying) clearTimeout(state.slideshowTimer);
    applyActionButtons();
    if (state.slideshowPlaying) schedule();
  }

  function togglePlay() {
    setPlaying(!state.slideshowPlaying);
  }

  function showNext(direction = 1) {
    if (!state.slideshowItems.length) return;
    let next = state.slideshowIndex + direction;
    if (next >= state.slideshowItems.length) {
      if (!state.slideshowLoop) {
        setPlaying(false);
        return;
      }
      next = 0;
    }
    if (next < 0) next = state.slideshowLoop ? state.slideshowItems.length - 1 : 0;
    state.slideshowIndex = next;
    render(direction);
  }

  function syncControlValues() {
    slideshowInterval.value = String(state.slideshowInterval);
    slideshowEffect.value = state.slideshowEffect;
    slideshowFit.value = state.slideshowFit;
    slideshowLoop.checked = state.slideshowLoop;
  }

  function openFromCurrent(options = {}) {
    hideFloatingPager();
    const current = state.currentModalItem;
    const images = getImageItems();
    if (!current || current.type !== "image" || !images.length) {
      showToast(getText().noImages);
      return;
    }

    state.slideshowItems = images;
    state.slideshowIndex = Math.max(0, images.findIndex(item => item.key === current.key));
    state.slideshowPlaying = true;
    syncControlValues();
    setControlsHidden(false);
    closeModal();
    slideshow.classList.remove("hidden");
    pauseInlinePlayback();
    applyLanguage();
    render(1);
    applyActionButtons();
    scheduleAutoHideControls("slideshow", 1000, true);
    if (options.requestFullscreen) slideshow.requestFullscreen?.().catch(() => {});
  }

  function openFullscreenFromCurrent() {
    openFromCurrent({ requestFullscreen: true });
  }

  function scheduleModal() {
    clearTimeout(state.modalSlideshowTimer);
    if (!state.modalSlideshowPlaying || modal.classList.contains("hidden") || state.currentModalItem?.type !== "image") return;
    state.modalSlideshowTimer = setTimeout(() => {
      showModalImage(1, { fromTimer: true });
      scheduleModal();
    }, state.slideshowInterval * 1000);
  }

  function applyModalDrift() {
    modalImage.classList.remove("modal-drift-active");
    const vars = driftVars();
    for (const [key, value] of Object.entries(vars)) modalImage.style.setProperty(key, value);
    modalImage.style.setProperty("--modal-drift-duration", `${Math.max(1, state.slideshowInterval) * 1000}ms`);
    void modalImage.offsetWidth;
    modalImage.classList.add("modal-drift-active");
  }

  function clearModalDrift() {
    modalImage.classList.remove("modal-drift-active");
    modalImage.style.removeProperty("--modal-drift-duration");
    modalImage.style.removeProperty("--sx");
    modalImage.style.removeProperty("--sy");
    modalImage.style.removeProperty("--ex");
    modalImage.style.removeProperty("--ey");
  }

  function setModalPlaying(playing) {
    clearTimeout(state.modalSlideshowTimer);
    state.modalSlideshowTimer = null;
    const images = getImageItems();
    state.modalSlideshowPlaying = !!playing
      && !modal.classList.contains("hidden")
      && state.currentModalItem?.type === "image"
      && images.length > 1;
    modalContent.classList.toggle("modal-slideshow-playing", state.modalSlideshowPlaying);
    if (state.modalSlideshowPlaying) applyModalDrift();
    else clearModalDrift();
    applyActionButtons();
    if (state.modalSlideshowPlaying) scheduleModal();
  }

  function toggleModal() {
    const images = getImageItems();
    if (state.currentModalItem?.type !== "image" || images.length < 2) {
      showToast(getText().noImages);
      return;
    }
    setModalPlaying(!state.modalSlideshowPlaying);
  }

  function isFullscreen() {
    return document.fullscreenElement === slideshow;
  }

  function releasePreviewMedia() {
    releaseMediaElement(slideshowImageA);
    releaseMediaElement(slideshowImageB);
  }

  function close(options = {}) {
    const shouldResumeInline = options.resumeInline !== false;
    if (isFullscreen()) document.exitFullscreen?.();
    clearTimeout(state.slideshowTimer);
    clearTimeout(state.slideshowCleanupTimer);
    clearTimeout(state.mediaNavTimer);
    clearTimeout(state.slideshowToolbarTimer);
    state.slideshowToolbarTimer = null;
    setControlsHidden(false);
    slideshowHiddenActions.classList.add("hidden");
    slideshowExitFullscreen.classList.add("hidden");
    slideshow.classList.remove("nav-active");
    slideshow.classList.add("hidden");
    releasePreviewMedia();
    updateGridPager();
    if (shouldResumeInline && state.playingEnabled) resumeInlinePlayback();
  }

  function returnToModal() {
    const item = state.slideshowItems[state.slideshowIndex];
    state.slideshowReturnAfterFullscreenExit = false;
    close({ resumeInline: false });
    if (item) openModal(item);
  }

  function setControlsHidden(hidden) {
    state.slideshowControlsHidden = !!hidden;
    slideshow.classList.toggle("controls-hidden", state.slideshowControlsHidden);
    slideshowHiddenActions.classList.add("hidden");
    slideshowUiToggle.textContent = compactText("hideUi", "Hide");
    slideshowUiShow.textContent = labelText("showUi", "Show UI", "显示控制");
    if (state.slideshowControlsHidden) slideshow.classList.remove("nav-active");
    applyActionButtons();
  }

  function toggleFullscreen() {
    if (isFullscreen()) {
      state.slideshowReturnAfterFullscreenExit = false;
      document.exitFullscreen?.();
    } else {
      state.slideshowReturnAfterFullscreenExit = true;
      slideshow.requestFullscreen?.().catch(() => {});
    }
  }

  function handleFullscreenChange() {
    updateFullscreenLabels();
    if (!document.fullscreenElement
      && state.slideshowReturnAfterFullscreenExit
      && !slideshow.classList.contains("hidden")) {
      returnToModal();
    }
  }

  function refreshItems(items, preferredIndex = state.slideshowIndex) {
    state.slideshowItems = Array.isArray(items) ? items : [];
    if (!state.slideshowItems.length) {
      close();
      return false;
    }
    state.slideshowIndex = Math.max(0, Math.min(preferredIndex, state.slideshowItems.length - 1));
    render(1);
    applyActionButtons();
    return true;
  }

  return {
    applyModalDrift,
    clearModalDrift,
    close,
    handleFullscreenChange,
    isFullscreen,
    openFromCurrent,
    openFullscreenFromCurrent,
    refreshItems,
    releasePreviewMedia,
    render,
    returnToModal,
    schedule,
    scheduleModal,
    setControlsHidden,
    setModalPlaying,
    setPlaying,
    showNext,
    syncControlValues,
    toggleFullscreen,
    toggleModal,
    togglePlay,
  };
}
