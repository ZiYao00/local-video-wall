const { app, BrowserWindow, ipcMain, shell } = require('electron/main');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const APP_URL = 'http://127.0.0.1:8787';
const APP_NAME = 'Local Video Wall Desktop';
const APPDATA_ROOT = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const SCAN_REGISTRY_FILE = path.join(APPDATA_ROOT, 'LocalVideoWall', 'desktop-scans.json');
const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.webm', '.mov', '.m4v',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
]);

app.setName(APP_NAME);

let mainWindow = null;
let dragIcon = null;
let dragIconError = '';

function normalizePath(value) {
  return path.normalize(String(value || '').trim().replace(/^"+|"+$/g, ''));
}

function realPath(value) {
  try {
    return fs.realpathSync.native(normalizePath(value));
  } catch (_error) {
    return '';
  }
}

function isPathWithinRoot(filePath, rootPath) {
  const fileReal = realPath(filePath);
  const rootReal = realPath(rootPath);
  if (!fileReal || !rootReal) return false;
  const relative = path.relative(rootReal, fileReal);
  return relative === '' || (
    relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function readScanRegistry() {
  try {
    const data = JSON.parse(fs.readFileSync(SCAN_REGISTRY_FILE, 'utf8'));
    return data && typeof data === 'object' && data.scans && typeof data.scans === 'object'
      ? data.scans
      : {};
  } catch (error) {
    console.error('[desktop] could not read active scan registry:', error?.message || error);
    return {};
  }
}

function validateDragFile(request = {}) {
  const requestedPath = request?.filePath;
  const scanId = String(request?.scanId || '').trim();
  if (!/^[a-f0-9]{32}$/i.test(scanId)) {
    return { ok: false, reason: 'invalid-scan-context', error: 'This media is not attached to an active scan.' };
  }
  if (typeof requestedPath !== 'string' || !requestedPath.trim() || requestedPath.length > 4096) {
    return { ok: false, reason: 'invalid-path', error: 'Invalid drag file path.' };
  }

  const scans = readScanRegistry();
  const scanRoot = normalizePath(scans[scanId] || '');
  if (!scanRoot) {
    return { ok: false, reason: 'scan-context-unavailable', error: 'The active scan is no longer available. Scan the folder again.' };
  }

  const candidate = normalizePath(requestedPath);
  const extension = path.extname(candidate).toLowerCase();
  if (!MEDIA_EXTENSIONS.has(extension)) {
    return { ok: false, reason: 'unsupported-type', error: 'This file type is not allowed for native drag-out.' };
  }

  let stat = null;
  try {
    stat = fs.statSync(candidate);
  } catch (_error) {
    return { ok: false, reason: 'missing-file', error: 'The media file no longer exists.' };
  }
  if (!stat.isFile()) {
    return { ok: false, reason: 'not-file', error: 'The drag target is not a file.' };
  }

  if (!isPathWithinRoot(candidate, scanRoot)) {
    return { ok: false, reason: 'outside-scan-context', error: 'This file is outside the folder that produced the active scan.' };
  }

  const resolved = realPath(candidate);
  if (!resolved) {
    return { ok: false, reason: 'unavailable-file', error: 'The media file is not accessible.' };
  }
  return { ok: true, filePath: resolved, scanId, scanRoot };
}

async function prepareDragIcon() {
  try {
    const image = await app.getFileIcon(process.execPath, { size: 'normal' });
    if (!image || image.isEmpty()) throw new Error('Windows drag icon is unavailable');
    dragIcon = image;
    dragIconError = '';
    console.log('[desktop] native drag icon ready');
  } catch (error) {
    dragIcon = null;
    dragIconError = error?.message || String(error);
    console.error('[desktop] drag icon preparation failed:', dragIconError);
  }
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function refreshMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.reloadIgnoringCache();
}

async function loadLatestApp(window) {
  if (!window || window.isDestroyed()) return;
  try {
    await window.webContents.session.clearCache();
  } catch (error) {
    console.warn('[desktop] could not clear renderer cache:', error?.message || error);
  }
  if (!window.isDestroyed()) await window.loadURL(APP_URL);
}

function isTrustedAppUrl(url) {
  const value = String(url || '');
  return value === APP_URL || value.startsWith(`${APP_URL}/`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1040,
    minHeight: 680,
    title: APP_NAME,
    backgroundColor: '#17181b',
    autoHideMenuBar: true,
    frame: false,
    thickFrame: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.on('page-title-updated', event => {
    event.preventDefault();
    mainWindow?.setTitle(APP_NAME);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(`${APP_URL}/`) || url === APP_URL) return { action: 'allow' };
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(`${APP_URL}/`) || url === APP_URL) return;
    event.preventDefault();
    void shell.openExternal(url);
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  void loadLatestApp(mainWindow);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    refreshMainWindow();
    focusMainWindow();
  });

  app.whenReady().then(async () => {
    await prepareDragIcon();

    ipcMain.on('native-drag:start', (event, request) => {
      const senderUrl = String(event.senderFrame?.url || '');
      if (!isTrustedAppUrl(senderUrl)) {
        event.sender.send('native-drag:result', {
          ok: false,
          reason: 'invalid-sender',
          error: 'Native drag request rejected because it did not come from Local Video Wall.',
        });
        return;
      }

      const validation = validateDragFile(request);
      if (!validation.ok) {
        event.sender.send('native-drag:result', validation);
        return;
      }
      if (!dragIcon) {
        event.sender.send('native-drag:result', {
          ok: false,
          reason: 'icon-unavailable',
          error: dragIconError || 'Native drag icon is unavailable.',
        });
        return;
      }

      try {
        event.sender.startDrag({
          file: validation.filePath,
          icon: dragIcon,
        });
        event.sender.send('native-drag:result', { ok: true, reason: '', error: '' });
      } catch (error) {
        event.sender.send('native-drag:result', {
          ok: false,
          reason: 'start-drag-failed',
          error: error?.message || String(error),
        });
      }
    });

    ipcMain.on('desktop-window:close', event => {
      const senderUrl = String(event.senderFrame?.url || '');
      if (!isTrustedAppUrl(senderUrl)) return;
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window && !window.isDestroyed()) window.close();
    });

    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else focusMainWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
