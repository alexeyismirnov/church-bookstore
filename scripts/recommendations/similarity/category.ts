import type { ExtractedProduct } from '../types';

/**
 * Compute Jaccard similarity between two products based on their category ID sets.
 *
 * Formula: |categories(A) ∩ categories(B)| / |categories(A) ∪ categories(B)|
 * Returns 0 if the union is empty (both have no categories).
 */
export function categorySimilarity(
  a: ExtractedProduct,
  b: ExtractedProduct
): number {
  const setA = new Set(a.categoryIds);
  const setB = new Set(b.categoryIds);

  if (setA.size === 0 && setB.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const id of setA) {
    if (setB.has(id)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;

  if (unionSize === 0) {
    return 0;
  }

  return intersectionSize / unionSize;
}
