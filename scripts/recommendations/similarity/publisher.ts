import type { ExtractedProduct } from '../types';

/**
 * Normalize a string: trim, lowercase, collapse internal whitespace to single space.
 */
function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Compute normalized exact-match publisher similarity.
 *
 * Returns 1.0 if both normalized publishers are non-empty AND identical, 0.0 otherwise.
 * Returns 0.0 if either publisher is empty after normalization.
 */
export function publisherSimilarity(
  a: ExtractedProduct,
  b: ExtractedProduct
): number {
  const normA = normalize(a.publisher);
  const normB = normalize(b.publisher);

  if (normA.length === 0 || normB.length === 0) {
    return 0;
  }

  return normA === normB ? 1.0 : 0.0;
}
