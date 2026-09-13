export function createMetadataPanel({
  state,
  elements,
  getText,
  escapeHtml,
  fmtBytes,
  syncWorkflowStatusFromFullMetadata,
}) {
  const {
    modal,
    modalImage,
    modalVideo,
    modalMetadata,
  } = elements;

  let requestId = 0;
  let currentMetadata = null;
  let currentLoading = false;
  let currentError = "";

  function renderBlock(title, value, options = {}) {
    const safeValue = String(value || "").trim();
    if (!safeValue && options.hideEmpty) return "";
    const tx = getText();
    const body = safeValue || tx.metadataPending;
    const collapsed = !!options.collapsed;
    const copy = safeValue
      ? `<button class="metadata-copy" type="button" data-copy-meta="${escapeHtml(safeValue)}">${escapeHtml(tx.copy)}</button>`
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

  function parseLoraDisplay(raw) {
    const original = String(raw || "").trim();
    const badges = [];
    let name = original;
    name = name.replace(/\s+-\s+(model\s+)?strength\s+([-+]?\d*\.?\d+)/ig, (_, label, value) => {
      badges.push(`${label ? "model " : ""}${value}`);
      return "";
    });
    name = name.replace(/\s+-\s+clip\s+strength\s+([-+]?\d*\.?\d+)/ig, (_, value) => {
      badges.push(`clip ${value}`);
      return "";
    });
    name = name.replace(/\s*\((model|clip|strength)\s*[:=]\s*([-+]?\d*\.?\d+)\)\s*/ig, (_, label, value) => {
      badges.push(label.toLowerCase() === "strength" ? value : `${label.toLowerCase()} ${value}`);
      return " ";
    });
    name = name.trim();
    const fileName = name.split(/[\\/]/).filter(Boolean).pop() || name || original;
    return { original, name: fileName, badges };
  }

  function renderLoraBlock(value, options = {}) {
    const items = Array.isArray(value)
      ? value.map(item => String(item || "").trim()).filter(Boolean)
      : String(value || "").split(",").map(item => item.trim()).filter(Boolean);
    if (!items.length) return "";

    const tx = getText();
    const copyText = items.join("\n");
    const content = `
      <ul class="metadata-lora-list">
        ${items.map(item => {
          const parsed = parseLoraDisplay(item);
          const badges = parsed.badges.map(badge => `<span class="metadata-lora-badge">${escapeHtml(badge)}</span>`).join("");
          return `<li title="${escapeHtml(parsed.original)}"><span class="metadata-lora-name">${escapeHtml(parsed.name)}</span>${badges ? `<span class="metadata-lora-badges">${badges}</span>` : ""}</li>`;
        }).join("")}
      </ul>`;

    if (options.collapsed) {
      return `
        <details class="metadata-block metadata-fold metadata-lora-block">
          <summary><span>${escapeHtml(tx.metadataLora)}</span><button class="metadata-copy" type="button" data-copy-meta="${escapeHtml(copyText)}">${escapeHtml(tx.copy)}</button></summary>
          ${content}
        </details>`;
    }
    return `
      <section class="metadata-block metadata-lora-block">
        <div class="metadata-block-head">
          <strong>${escapeHtml(tx.metadataLora)}</strong>
          <button class="metadata-copy" type="button" data-copy-meta="${escapeHtml(copyText)}">${escapeHtml(tx.copy)}</button>
        </div>
        ${content}
      </section>`;
  }

  function sourceLabel(source) {
    const labels = {
      embedded: "Embedded",
      sidecar: "Sidecar JSON",
      ffprobe: "ffprobe",
      mediainfo: "MediaInfo",
      filesystem: "File",
    };
    return labels[source] || String(source || "").trim();
  }

  function noteText(metadata, options = {}) {
    const tx = getText();
    if (options.error) return options.error;
    if (options.loading) return tx.metadataLoading;
    const sources = Array.isArray(metadata?.metadata_sources)
      ? metadata.metadata_sources.map(sourceLabel).filter(Boolean).join(" / ")
      : "";
    const status = metadata?.metadata_status || "empty";
    if (status === "ok") return sources ? `${tx.metadataDetected}: ${sources}` : tx.metadataDetected;
    if (status === "partial") return sources ? `${tx.metadataPartial} (${sources})` : tx.metadataPartial;
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

  function renderActions(raw, workflow) {
    if (!raw && !workflow) return "";
    const tx = getText();
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

  function renderInfo(items) {
    const rows = items.filter(row => row.value);
    if (!rows.length) return "";
    return `
      <section class="metadata-block metadata-info-block">
        <div class="metadata-block-head"><strong>${escapeHtml(getText().metadataBasic)}</strong></div>
        <dl class="metadata-info-list">
          ${rows.map(row => `<div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`).join("")}
        </dl>
      </section>`;
  }

  function render(item, metadata = currentMetadata, options = {}) {
    if (!item) {
      modalMetadata.classList.add("hidden");
      modalMetadata.innerHTML = "";
      return;
    }

    const tx = getText();
    const loading = options.loading ?? currentLoading;
    const error = options.error ?? currentError;
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
    const raw = metadata?.raw_metadata && Object.keys(metadata.raw_metadata || {}).length
      ? metadataJson(metadata.raw_metadata)
      : "";
    const workflow = metadata?.workflow ? metadataJson(metadata.workflow) : "";

    modalMetadata.innerHTML = `
      ${renderInfo(infoRows)}
      ${error || loading ? `<p class="metadata-note">${escapeHtml(noteText(metadata, { loading, error }))}</p>` : ""}
      ${renderActions(raw, workflow)}
      ${renderBlock(tx.metadataModel, metadata?.model || "", { hideEmpty: true })}
      ${renderLoraBlock(metadata?.loras, { collapsed: true })}
      ${renderBlock(tx.metadataPrompt, metadata?.prompt || "", { hideEmpty: true, collapsed: true })}
      ${renderBlock(tx.metadataNegative, metadata?.negative_prompt || "", { hideEmpty: true, collapsed: true })}
    `;
    modalMetadata.classList.toggle("hidden", !["image", "video"].includes(item.type));
  }

  async function load(item) {
    const activeRequestId = ++requestId;
    currentMetadata = null;
    currentLoading = true;
    currentError = "";
    render(item, null, { loading: true, error: "" });

    try {
      const params = new URLSearchParams({
        path: item.rel || "",
        scan_id: item.scan_id || state.scanId || "",
      });
      const response = await fetch(`/api/metadata?${params.toString()}`);
      const data = await response.json();
      if (activeRequestId !== requestId || state.currentModalItem?.key !== item.key) return;

      if (!response.ok || !data.ok) {
        currentMetadata = null;
        currentLoading = false;
        currentError = data.error || getText().metadataError;
        render(item, null, { loading: false, error: currentError });
        return;
      }

      currentMetadata = data.metadata || {};
      currentLoading = false;
      currentError = "";
      syncWorkflowStatusFromFullMetadata(item, currentMetadata);
      render(item, currentMetadata, { loading: false, error: "" });
    } catch {
      if (activeRequestId !== requestId || state.currentModalItem?.key !== item.key) return;
      currentMetadata = null;
      currentLoading = false;
      currentError = getText().metadataError;
      render(item, null, { loading: false, error: currentError });
    }
  }

  function refresh() {
    if (modal.classList.contains("hidden") || !state.currentModalItem) return;
    render(state.currentModalItem, currentMetadata, {
      loading: currentLoading,
      error: currentError,
    });
  }

  function invalidate() {
    requestId += 1;
    currentMetadata = null;
    currentLoading = false;
    currentError = "";
  }

  return {
    aspectRatioText,
    invalidate,
    load,
    parseLoraDisplay,
    refresh,
    render,
  };
}
