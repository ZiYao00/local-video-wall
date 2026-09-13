export function createWorkflowStatusController({ getScanId, getText, icons, escapeCssIdent }) {
  const cache = new Map();
  const queuedKeys = new Set();
  let queue = [];
  let active = 0;
  let version = 0;

  function statusKey(item) {
    return `${getScanId() || ""}::${item?.key || ""}`;
  }

  function applyToCard(card, item) {
    const badge = card?.querySelector(".workflow-badge");
    if (!badge || !item) return;
    const tx = getText();
    const status = cache.get(statusKey(item));
    const pending = status?.state === "pending";
    const kind = status?.workflow_kind || (status?.has_generation ? "generation" : status?.has_workflow ? "workflow_only" : "none");
    const visible = pending || kind === "generation" || kind === "workflow_only";
    badge.classList.toggle("hidden", !visible);
    badge.classList.toggle("pending", pending);
    badge.classList.toggle("generation", !pending && kind === "generation");
    badge.classList.toggle("workflow-only", !pending && kind === "workflow_only");
    badge.innerHTML = pending ? icons.searchIcon : icons.workflow;
    badge.title = pending ? tx.workflowChecking : kind === "generation" ? tx.workflowGeneration : kind === "workflow_only" ? tx.workflowOnly : tx.workflowBadge;
  }

  function applyForItem(item) {
    if (!item) return;
    document.querySelectorAll(`.video-card[data-key="${escapeCssIdent(item.key)}"]`).forEach(card => {
      applyToCard(card, item);
    });
  }

  function queueItem(item) {
    const scanId = getScanId();
    if (!item || !scanId) return;
    const cacheKey = statusKey(item);
    if (cache.has(cacheKey) || queuedKeys.has(cacheKey)) return;
    queuedKeys.add(cacheKey);
    cache.set(cacheKey, { state: "pending", has_workflow: false });
    applyForItem(item);
    queue.push({ item, version });
    pump();
  }

  function queueCard(card) {
    queueItem(card?._mediaItem || null);
  }

  async function pump() {
    while (active < 2 && queue.length) {
      const queued = queue.shift();
      const item = queued?.item;
      const requestVersion = queued?.version;
      if (!item || requestVersion !== version) continue;
      const cacheKey = statusKey(item);
      active += 1;
      try {
        const params = new URLSearchParams({ path: item.rel, scan_id: getScanId() });
        const res = await fetch(`/api/workflow-status?${params.toString()}`);
        const data = await res.json();
        if (requestVersion === version) {
          const nextState = data.workflow_kind === "none" ? "empty" : data.workflow_kind === "unknown" ? "unknown" : "ok";
          cache.set(cacheKey, data.ok
            ? { ...data, state: nextState }
            : { state: "error", workflow_kind: "none", has_workflow: false, error: data.error || "" });
        }
      } catch (err) {
        if (requestVersion === version) {
          cache.set(cacheKey, { state: "error", workflow_kind: "none", has_workflow: false, error: String(err || "") });
        }
      } finally {
        queuedKeys.delete(cacheKey);
        active -= 1;
        if (requestVersion === version) applyForItem(item);
        pump();
      }
    }
  }

  function syncFromFullMetadata(item, metadata) {
    if (!item || !metadata) return;
    const hasWorkflow = !!metadata.workflow;
    const hasGeneration = !!(
      metadata.prompt
      || metadata.negative_prompt
      || metadata.model
      || (Array.isArray(metadata.loras) ? metadata.loras.length : metadata.loras)
    );
    const workflowKind = hasGeneration ? "generation" : hasWorkflow ? "workflow_only" : "none";
    cache.set(statusKey(item), {
      state: workflowKind === "none" ? "empty" : "ok",
      has_workflow: hasWorkflow,
      has_generation: hasGeneration,
      workflow_kind: workflowKind,
      probe_complete: true,
      needs_full_probe: false,
    });
    applyForItem(item);
  }

  function reset() {
    version += 1;
    cache.clear();
    queue = [];
    queuedKeys.clear();
  }

  return {
    applyToCard,
    queueCard,
    reset,
    syncFromFullMetadata,
  };
}
