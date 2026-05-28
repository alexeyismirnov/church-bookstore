import type { Book } from '../types';

export function slugifyProductTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildProductSlug(id: string | number, title: string, fallback?: string): string {
  const safeId = String(id);
  const base = slugifyProductTitle(title) || slugifyProductTitle(fallback || '') || 'product';
  return `${base}_${safeId}`;
}

export function ensureSlugWithId(
  id: string | number,
  candidateSlug: string | null | undefined,
  fallbackTitle: string
): string {
  const safeId = String(id);
  const cleanCandidate = (candidateSlug || '').trim().toLowerCase();
  if (
    cleanCandidate &&
    (cleanCandidate.endsWith(`-${safeId}`) || cleanCandidate.endsWith(`_${safeId}`))
  ) {
    return cleanCandidate;
  }
  if (cleanCandidate && /^\d+$/.test(cleanCandidate)) {
    return buildProductSlug(safeId, fallbackTitle);
  }
  return buildProductSlug(safeId, cleanCandidate || fallbackTitle, fallbackTitle);
}

export function extractProductIdFromSlug(slugOrId: string): string | null {
  const value = (slugOrId || '').trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return value;
  const match = value.match(/[-_](\d+)$/);
  return match ? match[1] : null;
}

export function buildProductPath(input: Pick<Book, 'id' | 'title' | 'slug'>): string {
  const slug = ensureSlugWithId(input.id, input.slug, input.title);
  return `/product/${slug}`;
}
