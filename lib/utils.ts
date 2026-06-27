/** Small shared helpers used across the UI. */

/** Format a byte count as a human-readable string (B / KB / MB). */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/** Format an ISO timestamp as a short, locale-friendly date. */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Relative time in Spanish, e.g. "hace 3 h". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'hace un momento';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months === 1 ? '' : 'es'}`;
  return `hace ${Math.floor(days / 365)} a`;
}

/** Turn a free-text name into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Sanitize a filename for safe use inside a storage path. */
export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const safeBase = slugify(base) || 'file';
  return `${safeBase}${ext.toLowerCase()}`;
}

/** Derive the storage object path from a public file URL (or null). */
export function storagePathFromUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/files/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
