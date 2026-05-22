import type { ExtractedProduct } from '../types';

/**
 * Normalize a string: trim, lowercase, collapse internal whitespace to single space.
 */
function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Compute normalized exact-match author similarity.
 *
 * Returns 1.0 if both normalized authors are non-empty AND identical, 0.0 otherwise.
 * Returns 0.0 if either author is empty after normalization.
 */
export function authorSimilarity(
  a: ExtractedProduct,
  b: ExtractedProduct
): number {
  const normA = normalize(a.author);
  const normB = normalize(b.author);

  if (normA.length === 0 || normB.length === 0) {
    return 0;
  }

  return normA === normB ? 1.0 : 0.0;
}
