const DEFAULT_MEDIA_EXTENSIONS = new Set([
  ".mp4", ".webm", ".mov", ".m4v",
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
]);

function normalizeWindowsPath(value) {
  return String(value || "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/\//g, "\\")
    .replace(/\\+$/g, "");
}

function pathKey(value) {
  return normalizeWindowsPath(value).toLocaleLowerCase();
}

function isPathWithinRoot(path, root) {
  const target = pathKey(path);
  const boundary = pathKey(root);
  if (!target || !boundary) return false;
  return target === boundary || target.startsWith(`${boundary}\\`);
}

function pathBasename(value) {
  const normalized = normalizeWindowsPath(value);
  if (/^[a-z]:$/i.test(normalized)) return normalized;
  const parts = normalized.split("\\").filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

function extensionOf(name) {
  const match = String(name || "").toLocaleLowerCase().match(/\.[^.\\/]+$/);
  return match ? match[0] : "";
}

function stripSelectedRoot(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  return parts.slice(1).join("\\");
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function buildVerificationSamples(files, maxSamples = 5) {
  if (!Array.isArray(files) || !files.length) return [];
  const last = files.length - 1;
  const indexes = [0, Math.floor(last / 4), Math.floor(last / 2), Math.floor(last * 3 / 4), last];
  const uniqueIndexes = [...new Set(indexes)].slice(0, Math.max(1, maxSamples));
  const samples = [];
  for (const index of uniqueIndexes) {
    const file = files[index];
    const rel = stripSelectedRoot(file?.webkitRelativePath || file?.name || "");
    if (!file || !rel) continue;
    samples.push({
      rel,
      size: Number(file.size || 0),
      last_modified: Number(file.lastModified || 0),
    });
  }
  return samples;
}

export function createDragOutController({
  onChange = () => {},
  mediaExtensions = DEFAULT_MEDIA_EXTENSIONS,
  verifySelection = async () => ({ ok: true }),
} = {}) {
  let configuredRoots = [];
  const grants = new Map();

  function notify() {
    try { onChange(); } catch (error) { console.error(error); }
  }

  function normalizeRoots(roots) {
    const candidates = [];
    const seen = new Set();
    for (const value of Array.isArray(roots) ? roots : []) {
      const root = normalizeWindowsPath(value);
      const key = pathKey(root);
      if (!root || seen.has(key)) continue;
      seen.add(key);
      candidates.push(root);
    }
    candidates.sort((a, b) => a.length - b.length || a.localeCompare(b));
    const result = [];
    for (const root of candidates) {
      if (result.some(parent => isPathWithinRoot(root, parent))) continue;
      result.push(root);
    }
    return result;
  }

  function setConfiguredRoots(roots) {
    configuredRoots = normalizeRoots(roots);
    const keep = new Set(configuredRoots.map(pathKey));
    for (const [key, grant] of grants) {
      if (keep.has(key)) continue;
      grant.input?.remove?.();
      grants.delete(key);
    }
    notify();
  }

  function getConfiguredRoots() {
    return [...configuredRoots];
  }

  function findCoveringRoot(path) {
    return configuredRoots
      .filter(root => isPathWithinRoot(path, root))
      .sort((a, b) => b.length - a.length)[0] || "";
  }

  function getGrant(root) {
    return grants.get(pathKey(root)) || null;
  }

  function getStatus(path) {
    const root = findCoveringRoot(path);
    if (!root) return { state: "unconfigured", root: "", reason: "" };
    const grant = getGrant(root);
    if (!grant || grant.stale) {
      return {
        state: "refresh",
        root,
        reason: grant?.staleReason || "restore",
        grant,
      };
    }
    return { state: "ready", root, reason: "", grant };
  }

  function discardGrant(root) {
    const key = pathKey(root);
    const grant = grants.get(key);
    grant?.input?.remove?.();
    grants.delete(key);
    notify();
  }

  function markStale(root, reason = "missing-file") {
    const grant = getGrant(root);
    if (!grant) return;
    grant.stale = true;
    grant.staleReason = reason;
    notify();
  }

  function createDirectoryInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.className = "drag-directory-input";
    document.body.appendChild(input);
    return input;
  }

  function authorize(rootPath) {
    const root = normalizeWindowsPath(rootPath);
    if (!root) return Promise.resolve({ ok: false, reason: "missing-root" });
    const input = createDirectoryInput();

    return new Promise(resolve => {
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      input.addEventListener("cancel", () => {
        input.remove();
        finish({ ok: false, reason: "cancelled" });
      }, { once: true });

      input.addEventListener("change", async () => {
        const files = Array.from(input.files || []);
        if (!files.length) {
          input.remove();
          finish({ ok: false, reason: "cancelled" });
          return;
        }

        const firstRelative = String(files[0].webkitRelativePath || "");
        const selectedRootName = firstRelative.replace(/\\/g, "/").split("/").filter(Boolean)[0] || "";
        const expectedRootName = pathBasename(root);
        const driveRoot = /^[a-z]:$/i.test(expectedRootName);
        if (!driveRoot && selectedRootName && selectedRootName.toLocaleLowerCase() !== expectedRootName.toLocaleLowerCase()) {
          input.remove();
          finish({
            ok: false,
            reason: "folder-mismatch",
            selectedRootName,
            expectedRootName,
          });
          return;
        }

        const samples = buildVerificationSamples(files);
        let verification = null;
        try {
          verification = await verifySelection({
            root,
            selectedRootName,
            totalFiles: files.length,
            samples,
          });
        } catch (error) {
          input.remove();
          finish({
            ok: false,
            reason: "verification-failed",
            selectedRootName,
            expectedRootName,
            verification: { ok: false, error: error?.message || String(error) },
          });
          return;
        }
        if (!verification?.ok) {
          input.remove();
          finish({
            ok: false,
            reason: "verification-failed",
            selectedRootName,
            expectedRootName,
            verification,
          });
          return;
        }

        const started = performance.now();
        const fileMap = new Map();
        let mediaFiles = 0;
        for (let index = 0; index < files.length; index += 1) {
          if (index > 0 && index % 2000 === 0) await nextFrame();
          const file = files[index];
          if (!mediaExtensions.has(extensionOf(file.name))) continue;
          const relative = stripSelectedRoot(file.webkitRelativePath || file.name);
          if (!relative) continue;
          const fullPath = `${root.replace(/\\+$/, "")}\\${relative}`;
          fileMap.set(pathKey(fullPath), file);
          mediaFiles += 1;
        }
        const buildMs = Math.round(performance.now() - started);
        const previous = getGrant(root);
        previous?.input?.remove?.();
        const grant = {
          root,
          input,
          fileMap,
          totalFiles: files.length,
          mediaFiles,
          buildMs,
          grantedAt: Date.now(),
          stale: false,
          staleReason: "",
        };
        grants.set(pathKey(root), grant);
        notify();
        finish({ ok: true, grant, selectedRootName, verification });
      }, { once: true });

      input.click();
    });
  }

  function resolveFile(fullPath) {
    const status = getStatus(fullPath);
    if (status.state !== "ready") return { ok: false, ...status };
    const file = status.grant.fileMap.get(pathKey(fullPath));
    if (!file) {
      markStale(status.root, "missing-file");
      return { ok: false, state: "refresh", root: status.root, reason: "missing-file" };
    }
    return { ok: true, state: "ready", root: status.root, file, grant: status.grant };
  }

  function getRootInfo(root) {
    const normalized = normalizeWindowsPath(root);
    const grant = getGrant(normalized);
    return {
      root: normalized,
      state: grant && !grant.stale ? "ready" : "refresh",
      reason: grant?.staleReason || "restore",
      totalFiles: grant?.totalFiles || 0,
      mediaFiles: grant?.mediaFiles || 0,
      buildMs: grant?.buildMs || 0,
      grantedAt: grant?.grantedAt || 0,
    };
  }

  return {
    authorize,
    discardGrant,
    findCoveringRoot,
    getConfiguredRoots,
    getRootInfo,
    getStatus,
    markStale,
    resolveFile,
    setConfiguredRoots,
  };
}
