const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('localVideoWallDesktop', {
  isDesktop: true,
  name: 'Local Video Wall Desktop',
  startDrag: (filePath, scanId) => {
    ipcRenderer.send('native-drag:start', {
      filePath: String(filePath || ''),
      scanId: String(scanId || ''),
    });
    return true;
  },
  closeWindow: () => {
    ipcRenderer.send('desktop-window:close');
    return true;
  },
  onDragResult: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on('native-drag:result', listener);
    return () => ipcRenderer.removeListener('native-drag:result', listener);
  },
});
