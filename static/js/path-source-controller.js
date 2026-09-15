import { VIEWER_ICONS, setIconButton } from "./viewer-icons.js";

const MEDIA_EXTENSIONS = /\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|webp|bmp)$/i;

function pathKey(value) {
  return String(value || "").trim().replace(/[\\/]+$/, "").toLowerCase();
}

async function readJsonResponse(response, label) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const text = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(`${label} returned HTTP ${response.status} instead of JSON.`);
  }
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `${label} failed with HTTP ${response.status}.`);
  }
  return data;
}

export function createSharedPathStateStore({ api }) {
  let config = { path_history: [], path_favorites: [] };
  const listeners = new Set();

  function snapshot() {
    return {
      ...config,
      path_history: Array.isArray(config.path_history) ? [...config.path_history] : [],
      path_favorites: Array.isArray(config.path_favorites) ? [...config.path_favorites] : [],
    };
  }

  function notify() {
    const value = snapshot();
    for (const listener of listeners) listener(value);
  }

  function update(next) {
    config = { ...config, ...(next || {}) };
    notify();
    return snapshot();
  }

  async function load() {
    const response = await fetch("/api/config", { cache: "no-store" });
    const data = await readJsonResponse(response, "Config");
    return update(data.config || {});
  }

  async function mutate(action, path = "") {
    const response = await api.request("/api/path-state", {
      method: "POST",
      body: JSON.stringify({ action, path }),
    });
    const data = await readJsonResponse(response, "Path state");
    return update(data.config || {});
  }

  return {
    load,
    get: snapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    recordHistory(path) { return mutate("history", path); },
    removeHistory(path) { return mutate("remove_history", path); },
    clearHistory() { return mutate("clear_history"); },
    addFavorite(path) { return mutate("favorite", path); },
    removeFavorite(path) { return mutate("unfavorite", path); },
  };
}

export function createPathSourceController({
  root,
  api,
  store,
  initialPath = "",
  initialRecursive = false,
  onScan,
  onPathStateChange = () => {},
  showStatus = () => {},
  text = {},
}) {
  const combo = root.querySelector(".path-combo");
  const input = root.querySelector(".path-input");
  const favoriteButton = root.querySelector(".favorite-path-btn");
  const historyButton = root.querySelector(".path-history-toggle");
  const historyMenu = root.querySelector(".path-history-menu");
  const suggestMenu = root.querySelector(".path-suggest-menu");
  const chooseFolderButton = root.querySelector(".choose-folder-btn");
  const scanButton = root.querySelector(".scan-btn");
  const recursiveButton = root.querySelector(".recursive-toggle-btn");

  let enabled = true;
  let recursive = Boolean(initialRecursive);
  let sourceType = "";
  let suggestionTimer = null;
  let suggestions = [];
  let suggestionIndex = -1;
  let sharedState = store.get();
  const tx = (key, fallback) => text[key] || fallback;

  input.value = initialPath || "";
  setIconButton(historyButton, "list", tx("pathHistory", "Path history"));
  setIconButton(chooseFolderButton, "folder", tx("chooseFolder", "Choose folder"));
  setIconButton(scanButton, "scan", tx("scan", "Scan"));

  function looksLikeMediaFile(path) {
    return MEDIA_EXTENSIONS.test(String(path || "").trim());
  }

  function emitPathState() {
    onPathStateChange({ path: input.value.trim(), recursive });
  }

  function updateRecursiveButton() {
    setIconButton(recursiveButton, "folderTree", tx("recursive", "Scan subfolders (max 2 levels)"), { active: recursive });
    recursiveButton.setAttribute("aria-pressed", recursive ? "true" : "false");
  }

  function isFavorite(path = input.value) {
    const key = pathKey(path);
    return Boolean(key) && sharedState.path_favorites.some((item) => pathKey(item) === key);
  }

  function updateFavoriteButton() {
    const path = input.value.trim();
    const favorite = isFavorite(path);
    setIconButton(favoriteButton, favorite ? "starFilled" : "star", favorite ? tx("removeFavorite", "Remove favorite") : tx("addFavorite", "Add favorite"), { active: favorite });
    favoriteButton.disabled = !enabled || !path || sourceType === "file" || looksLikeMediaFile(path);
  }

  function positionDropdown(menu) {
    const rect = combo.getBoundingClientRect();
    const gutter = 12;
    const width = Math.min(rect.width, window.innerWidth - gutter * 2);
    let left = Math.max(gutter, rect.left);
    if (left + width > window.innerWidth - gutter) left = window.innerWidth - gutter - width;
    menu.style.top = `${Math.round(rect.bottom + 8)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.width = `${Math.round(width)}px`;
  }

  function closeSuggestions() {
    window.clearTimeout(suggestionTimer);
    suggestions = [];
    suggestionIndex = -1;
    suggestMenu.innerHTML = "";
    suggestMenu.classList.add("hidden");
  }

  function closeHistory() {
    historyMenu.classList.add("hidden");
  }

  function renderSuggestions() {
    suggestMenu.innerHTML = "";
    if (!suggestions.length) {
      closeSuggestions();
      return;
    }
    suggestions.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "path-suggest-item";
      button.classList.toggle("active", index === suggestionIndex);
      button.textContent = item.path;
      button.title = item.path;
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => applySuggestion(index, true));
      suggestMenu.appendChild(button);
    });
    closeHistory();
    positionDropdown(suggestMenu);
    suggestMenu.classList.remove("hidden");
  }

  async function loadSuggestions() {
    const value = input.value.trim();
    if (value.length < 2 || looksLikeMediaFile(value)) {
      closeSuggestions();
      return;
    }
    try {
      const response = await fetch(`/api/fs/suggest?path=${encodeURIComponent(value)}`);
      const data = await readJsonResponse(response, "Path suggestions");
      suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      suggestionIndex = suggestions.length ? 0 : -1;
      renderSuggestions();
    } catch {
      closeSuggestions();
    }
  }

  function scheduleSuggestions() {
    window.clearTimeout(suggestionTimer);
    suggestionTimer = window.setTimeout(loadSuggestions, 220);
  }

  function moveSuggestion(direction) {
    if (suggestMenu.classList.contains("hidden") || !suggestions.length) return false;
    suggestionIndex = (suggestionIndex + direction + suggestions.length) % suggestions.length;
    renderSuggestions();
    return true;
  }

  function applySuggestion(index = suggestionIndex, scan = false) {
    const item = suggestions[index];
    if (!item) return;
    input.value = item.path;
    sourceType = "";
    updateFavoriteButton();
    closeSuggestions();
    emitPathState();
    if (scan) void scanSource();
  }

  function renderHistory() {
    historyMenu.innerHTML = "";
    const title = document.createElement("div");
    title.className = "path-history-title";
    title.textContent = tx("pathHistory", "Path history");
    historyMenu.appendChild(title);

    if (!sharedState.path_history.length) {
      const empty = document.createElement("div");
      empty.className = "path-history-empty";
      empty.textContent = tx("noHistory", "No history yet");
      historyMenu.appendChild(empty);
    } else {
      for (const path of sharedState.path_history) {
        const row = document.createElement("div");
        row.className = "path-history-row";
        const item = document.createElement("button");
        item.type = "button";
        item.className = "path-history-item";
        item.textContent = path;
        item.title = path;
        item.addEventListener("click", () => {
          closeHistory();
          input.value = path;
          sourceType = "folder";
          updateFavoriteButton();
          emitPathState();
          void scanSource();
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "path-history-remove";
        remove.innerHTML = VIEWER_ICONS.close;
        remove.title = tx("removeHistory", "Remove history");
        remove.setAttribute("aria-label", tx("removeHistory", "Remove history"));
        remove.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            await store.removeHistory(path);
          } catch (error) {
            showStatus(error?.message || tx("removeHistoryFail", "Could not remove history"), 3200);
          }
        });
        row.append(item, remove);
        historyMenu.appendChild(row);
      }
    }

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "path-history-clear";
    clear.textContent = tx("clearHistory", "Clear history");
    clear.addEventListener("click", async () => {
      try {
        await store.clearHistory();
        closeHistory();
      } catch (error) {
        showStatus(error?.message || tx("clearHistoryFail", "Could not clear history"), 3200);
      }
    });
    historyMenu.appendChild(clear);
  }

  function toggleHistory() {
    const shouldOpen = historyMenu.classList.contains("hidden");
    closeSuggestions();
    if (!shouldOpen) {
      closeHistory();
      return;
    }
    renderHistory();
    positionDropdown(historyMenu);
    historyMenu.classList.remove("hidden");
  }

  async function toggleFavorite() {
    const path = input.value.trim();
    if (!path || looksLikeMediaFile(path) || sourceType === "file") return;
    favoriteButton.disabled = true;
    try {
      if (isFavorite(path)) await store.removeFavorite(path);
      else await store.addFavorite(path);
    } catch (error) {
      showStatus(error?.message || tx("favoriteFail", "Could not update favorite"), 3200);
    } finally {
      updateFavoriteButton();
    }
  }

  async function chooseFolder() {
    if (!enabled) return;
    chooseFolderButton.disabled = true;
    try {
      const response = await api.request("/api/choose-folder", { method: "POST", body: "{}" });
      const data = await readJsonResponse(response, "Folder picker");
      if (data.path) {
        input.value = data.path;
        sourceType = "folder";
        updateFavoriteButton();
        emitPathState();
        input.focus();
      }
    } catch (error) {
      showStatus(error?.message || tx("folderPickerFail", "Could not open folder picker"), 3800);
    } finally {
      chooseFolderButton.disabled = !enabled;
    }
  }

  async function scanSource() {
    if (!enabled) return null;
    const path = input.value.trim();
    if (!path) {
      showStatus(tx("enterPath", "Enter a file or folder path first."), 2600);
      input.focus();
      return null;
    }

    scanButton.disabled = true;
    try {
      const result = await onScan({ path, recursive });
      if (!result) return null;
      if (result.path) input.value = result.path;
      sourceType = result.sourceType || "";
      if (sourceType === "folder" && result.path) {
        try {
          await store.recordHistory(result.path);
        } catch (error) {
          console.warn("Could not record shared path history", error);
        }
      }
      updateFavoriteButton();
      emitPathState();
      return result;
    } finally {
      scanButton.disabled = !enabled;
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    input.disabled = !enabled;
    chooseFolderButton.disabled = !enabled;
    scanButton.disabled = !enabled;
    recursiveButton.disabled = !enabled;
    historyButton.disabled = !enabled;
    updateFavoriteButton();
  }

  function setPath(value, { type = "" } = {}) {
    input.value = value || "";
    sourceType = type || "";
    updateFavoriteButton();
    emitPathState();
  }

  function setRecursive(value) {
    recursive = Boolean(value);
    updateRecursiveButton();
    emitPathState();
  }

  const unsubscribe = store.subscribe((next) => {
    sharedState = next;
    updateFavoriteButton();
    if (!historyMenu.classList.contains("hidden")) {
      renderHistory();
      positionDropdown(historyMenu);
    }
  });

  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void toggleFavorite();
  });
  historyButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleHistory();
  });
  chooseFolderButton.addEventListener("click", () => void chooseFolder());
  scanButton.addEventListener("click", () => void scanSource());
  recursiveButton.addEventListener("click", () => {
    recursive = !recursive;
    updateRecursiveButton();
    emitPathState();
  });

  input.addEventListener("input", () => {
    sourceType = "";
    updateFavoriteButton();
    emitPathState();
    scheduleSuggestions();
  });
  input.addEventListener("focus", scheduleSuggestions);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && moveSuggestion(1)) {
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowUp" && moveSuggestion(-1)) {
      event.preventDefault();
      return;
    }
    if (event.key === "Escape" && !suggestMenu.classList.contains("hidden")) {
      event.preventDefault();
      closeSuggestions();
      return;
    }
    if (event.key === "Enter") {
      if (!suggestMenu.classList.contains("hidden") && suggestionIndex >= 0) {
        event.preventDefault();
        applySuggestion(suggestionIndex, true);
        return;
      }
      event.preventDefault();
      void scanSource();
    }
  });

  historyMenu.addEventListener("pointerdown", (event) => event.stopPropagation());
  suggestMenu.addEventListener("pointerdown", (event) => event.stopPropagation());
  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      closeHistory();
      closeSuggestions();
    }
  });
  window.addEventListener("resize", () => {
    if (!historyMenu.classList.contains("hidden")) positionDropdown(historyMenu);
    if (!suggestMenu.classList.contains("hidden")) positionDropdown(suggestMenu);
  });

  updateRecursiveButton();
  updateFavoriteButton();

  return {
    scan: scanSource,
    setEnabled,
    setPath,
    setRecursive,
    getPath: () => input.value.trim(),
    getRecursive: () => recursive,
    destroy() {
      unsubscribe();
      window.clearTimeout(suggestionTimer);
    },
  };
}
