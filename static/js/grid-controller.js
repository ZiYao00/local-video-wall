export function createGridController({
  state,
  elements,
  getText,
  icons,
  largeVideoMb,
  escapeHtml,
  fmtBytes,
  isModalOpen,
  beforeRender,
  afterCardsRendered,
  updateSubInfo,
  applyActionButtons,
  applyWorkflowStatusToCard,
  onOpenItem,
  onToggleBatchItem,
  onCardAction,
  onDragItem,
}) {
  const {
    grid,
    gridPager,
    floatingPager,
    topPager,
    topPagePrev,
    topPageNext,
    emptyState,
    mainArea,
  } = elements;

  function pageCount() {
    return Math.max(1, Math.ceil(state.view.length / state.pageSize));
  }

  function shouldShowPager() {
    return state.view.length > state.pageSize;
  }

  function currentPageItems() {
    const pageStart = state.gridPage * state.pageSize;
    return state.view.slice(pageStart, pageStart + state.pageSize);
  }

  function updatePagerButtonState(prevButton, nextButton, pages) {
    if (!prevButton || !nextButton) return;
    prevButton.disabled = state.gridPage <= 0;
    nextButton.disabled = state.gridPage >= pages - 1;
  }

  function visiblePageNumbers(current, pages) {
    const count = window.innerWidth < 760 ? 3 : 5;
    let start = Math.max(1, current - Math.floor(count / 2));
    const end = Math.min(pages, start + count - 1);
    start = Math.max(1, end - count + 1);
    const result = [];
    for (let page = start; page <= end; page += 1) result.push(page);
    return result;
  }

  function pagerButton(label, page, options = {}) {
    const disabled = options.disabled ? " disabled" : "";
    const active = options.active ? " active" : "";
    const title = escapeHtml(options.title || label);
    return `<button class="floating-page-btn${active}" type="button" data-page="${page}" title="${title}" aria-label="${title}"${disabled}>${escapeHtml(label)}</button>`;
  }

  function renderPagerButtons(pages) {
    const tx = getText();
    const current = state.gridPage + 1;
    const numbers = visiblePageNumbers(current, pages);
    const parts = [
      pagerButton(tx.pageFirst, 1, { title: tx.pageFirst, disabled: state.gridPage <= 0 }),
      pagerButton("‹", current - 1, { title: tx.pagePrevious, disabled: state.gridPage <= 0 }),
    ];
    if (numbers[0] > 1) parts.push('<span class="floating-page-ellipsis">...</span>');
    for (const page of numbers) {
      parts.push(pagerButton(String(page), page, { active: page === current, title: tx.pageStatus(page, pages) }));
    }
    if (numbers[numbers.length - 1] < pages) parts.push('<span class="floating-page-ellipsis">...</span>');
    parts.push(
      pagerButton("›", current + 1, { title: tx.pageNext, disabled: state.gridPage >= pages - 1 }),
      pagerButton(tx.pageLast, pages, { title: tx.pageLast, disabled: state.gridPage >= pages - 1 }),
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
      <span class="grid-pager-info">${escapeHtml(getText().pageInfo(state.gridPage + 1, pages, state.view.length))}</span>
    `;
  }

  function renderFloatingPager(pages) {
    const show = shouldShowPager() && state.floatingPagerEnabled && !isModalOpen();
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
    const anchor = grid.offsetParent ? grid : mainArea;
    const rect = anchor.getBoundingClientRect();
    const viewport = window.innerWidth || document.documentElement.clientWidth || 0;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2, viewport - 12));
    floatingPager.style.setProperty("--floating-pager-left", `${Math.round(left)}px`);
    floatingPager.classList.toggle("compact", rect.width < 560);
  }

  function showFloatingPagerTemporarily(ms = 1700) {
    if (!state.floatingPagerEnabled || !shouldShowPager() || isModalOpen()) return;
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

  function updatePager() {
    const pages = pageCount();
    state.gridPage = Math.max(0, Math.min(state.gridPage, pages - 1));
    const show = shouldShowPager();
    topPager.classList.toggle("hidden", !show);
    updatePagerButtonState(topPagePrev, topPageNext, pages);
    applyActionButtons();
    renderBottomPager(pages);
    renderFloatingPager(pages);
  }

  function renderEmptyState() {
    if (!state.scannedPath) {
      emptyState.classList.add("hidden");
      emptyState.innerHTML = "";
      return;
    }
    const tx = getText();
    const filtered = state.all.length > 0;
    emptyState.innerHTML = `
      <h2>${escapeHtml(filtered ? tx.noMatchTitle : tx.noMediaTitle)}</h2>
      <p>${escapeHtml(filtered ? tx.noMatchBody : tx.noMediaBody)}</p>
    `;
    emptyState.classList.remove("hidden");
  }

  function createCard(item, pageIndex) {
    const tx = getText();
    const card = document.createElement("article");
    card.className = "video-card";
    card.draggable = true;
    card.dataset.key = item.key;
    card.dataset.rel = item.rel;
    card._mediaItem = item;

    const largeVideoPlaceholder = item.type === "video"
      && Number(item.size_mb) > largeVideoMb
      && !state.previewLargeVideos;
    card.classList.toggle("large-video-card", largeVideoPlaceholder);

    const mediaHtml = item.type === "image"
      ? `<img class="media-image" data-src="${item.url}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" draggable="false" />`
      : largeVideoPlaceholder
        ? `<div class="large-video-placeholder">${icons.play}<strong>${tx.largeVideoTitle}</strong><span>${fmtBytes(item.size_mb)}</span><small>${tx.largeVideoHint}</small></div>`
        : `<video muted loop playsinline preload="none" data-src="${item.url}" data-rel="${escapeHtml(item.rel)}" data-grid-index="${pageIndex}" draggable="false"></video>`;

    card.innerHTML = `
      <div class="video-wrap" title="${escapeHtml(item.name)}">
        ${mediaHtml}
        <div class="workflow-badge hidden" title="${escapeHtml(tx.workflowBadge)}">${icons.workflow}</div>
        <div class="card-quick-actions">
          <button class="batch-select-btn" data-batch-select="${escapeHtml(item.key)}"></button>
        </div>
        <div class="video-overlay"><div class="video-name">${escapeHtml(item.name)}</div></div>
      </div>
      <div class="card-footer">
        <div class="card-actions">
          <button class="card-action-btn card-favorite-btn" data-card-action="favorite"></button>
          <button class="card-action-btn" data-card-action="copy-path"></button>
          <button class="card-action-btn" data-card-action="open-folder"></button>
          <button class="card-action-btn danger" data-card-action="trash"></button>
          <div class="card-more-actions">
            <button class="card-action-btn card-more-toggle" type="button" aria-expanded="false"></button>
            <div class="card-more-menu hidden">
              <button type="button" data-card-action="copy-path"></button>
              <button type="button" data-card-action="open-folder"></button>
            </div>
          </div>
        </div>
      </div>`;

    card.classList.toggle("is-favorite", !!item.favorite);
    card.classList.toggle("is-batch-selected", state.batchSelected.has(item.key));
    applyWorkflowStatusToCard(card, item);

    card.querySelector(".video-wrap").addEventListener("click", () => {
      if (state.batchMode) {
        onToggleBatchItem(item.key);
        return;
      }
      onOpenItem(item);
    });
    card.querySelector(".batch-select-btn").addEventListener("click", event => {
      event.stopPropagation();
      onToggleBatchItem(item.key);
    });

    const moreToggle = card.querySelector(".card-more-toggle");
    const moreMenu = card.querySelector(".card-more-menu");
    moreToggle?.addEventListener("click", event => {
      event.stopPropagation();
      const open = moreMenu.classList.contains("hidden");
      moreMenu.classList.toggle("hidden", !open);
      moreToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    card.querySelectorAll("[data-card-action]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        moreMenu?.classList.add("hidden");
        moreToggle?.setAttribute("aria-expanded", "false");
        onCardAction(button.dataset.cardAction, item);
      });
    });

    card.addEventListener("dragstart", event => {
      if (state.batchMode || event.target.closest("button, input, select, textarea, [contenteditable=\"true\"]")) {
        event.preventDefault();
        return;
      }
      const allowed = onDragItem?.(event, item, card) === true;
      if (!allowed) {
        event.preventDefault();
        return;
      }
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
    });

    return card;
  }

  function render() {
    const renderStart = performance.now();
    beforeRender();
    grid.innerHTML = "";
    emptyState.classList.add("hidden");

    if (state.view.length === 0) {
      state.perf.pageItems = 0;
      state.perf.loadedMedia = 0;
      state.perf.renderMs = Math.round(performance.now() - renderStart);
      updatePager();
      updateSubInfo();
      renderEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();
    const pageItems = currentPageItems();
    state.perf.pageItems = pageItems.length;
    for (const [pageIndex, item] of pageItems.entries()) {
      fragment.appendChild(createCard(item, pageIndex));
    }
    grid.appendChild(fragment);

    afterCardsRendered();
    updatePager();
    state.perf.renderMs = Math.round(performance.now() - renderStart);
    state.perf.loadedMedia = document.querySelectorAll(".video-wrap video[src], .video-wrap img.media-image[src]").length;
    updateSubInfo();
  }

  function setPage(page) {
    const pages = pageCount();
    state.gridPage = Math.max(0, Math.min(Math.floor(Number(page) || 1) - 1, pages - 1));
    render();
    mainArea?.scrollIntoView({ block: "start" });
    showFloatingPagerTemporarily(2200);
  }

  return {
    currentPageItems,
    hideFloatingPager,
    pageCount,
    positionFloatingPager,
    render,
    renderEmptyState,
    setPage,
    shouldShowPager,
    showFloatingPagerTemporarily,
    updatePager,
  };
}
