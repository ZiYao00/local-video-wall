export const VIEWER_ICONS = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/><path d="M9 12h11"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2"/></svg>',
  folderTree: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6l2 2h8v5H4z"/><path d="M8 12v3"/><path d="M8 15h8"/><path d="M12 15v4"/><path d="M16 15v4"/><path d="M10 19h4"/><path d="M14 19h4"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M21 16v5h-5"/><path d="M8 21H3v-5"/></svg>',
  fullscreenExit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v6H3"/><path d="M15 3v6h6"/><path d="M15 21v-6h6"/><path d="M9 21v-6H3"/></svg>',
  list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>',
  minimize: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14"/><path d="M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h3"/><path d="M17 4h3v3"/><path d="M20 17v3h-3"/><path d="M7 20H4v-3"/><path d="M7 12h10"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 7h3c4 0 5 10 9 10h5"/><path d="M16 21h5v-5"/><path d="M4 17h3c1.7 0 2.9-1.8 4-4"/><path d="M14 7c.8-.7 1.8-1 3-1h4"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/></svg>',
  starFilled: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z"/></svg>',
};

export function setIconButton(button, iconName, title, { active = false } = {}) {
  if (!button) return;
  button.innerHTML = VIEWER_ICONS[iconName] || "";
  button.title = title || "";
  button.setAttribute("aria-label", title || "");
  button.classList.add("icon-only");
  button.classList.toggle("active", Boolean(active));
}

export function setSegmentIcon(button, iconName, title, active = false) {
  if (!button) return;
  button.innerHTML = VIEWER_ICONS[iconName] || "";
  button.title = title || "";
  button.setAttribute("aria-label", title || "");
  button.classList.toggle("active", Boolean(active));
}
