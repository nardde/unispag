'use client';

/**
 * Lightweight per-user engagement counters kept in localStorage, used only to
 * decide when to show the one-time feedback modal. Dispatches a window event
 * so a mounted listener can re-evaluate triggers immediately.
 */

const EVT = 'unifiles:engagement';

function dlKey(userId: string) {
  return `uf:dl:${userId}`;
}
function upKey(userId: string) {
  return `uf:up:${userId}`;
}

export function recordDownload(userId: string | undefined) {
  if (!userId || typeof window === 'undefined') return;
  const n = getDownloads(userId) + 1;
  localStorage.setItem(dlKey(userId), String(n));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function recordUpload(userId: string | undefined) {
  if (!userId || typeof window === 'undefined') return;
  localStorage.setItem(upKey(userId), '1');
  window.dispatchEvent(new CustomEvent(EVT));
}

export function getDownloads(userId: string): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(dlKey(userId)) ?? '0');
}

export function getUploads(userId: string): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(upKey(userId)) ?? '0');
}

export function onEngagement(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
