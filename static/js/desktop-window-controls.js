export const desktopBridge = window.localVideoWallDesktop || null;
export const IS_DESKTOP_HOST = desktopBridge?.isDesktop === true;

function applyDesktopHostState() {
  document.documentElement.classList.toggle("desktop-host", IS_DESKTOP_HOST);
  document.body?.classList.toggle("desktop-host", IS_DESKTOP_HOST);
}

applyDesktopHostState();

export function initDesktopWindowControls({ minimizeButton = null, closeButton = null } = {}) {
  applyDesktopHostState();
  minimizeButton?.classList.toggle("hidden", !IS_DESKTOP_HOST);
  closeButton?.classList.toggle("hidden", !IS_DESKTOP_HOST);

  if (!IS_DESKTOP_HOST) return;

  minimizeButton?.addEventListener("click", event => {
    event.stopPropagation();
    desktopBridge?.minimizeWindow?.();
  });

  closeButton?.addEventListener("click", event => {
    event.stopPropagation();
    desktopBridge?.closeWindow?.();
  });
}

export function getPageScrollHost(mainArea) {
  return IS_DESKTOP_HOST && mainArea ? mainArea : window;
}
