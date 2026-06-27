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
