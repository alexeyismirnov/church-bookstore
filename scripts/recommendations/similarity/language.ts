import type { ExtractedProduct } from '../types';

/**
 * Compute Jaccard similarity on split textScript field.
 *
 * Splits textScript on "/", trims each part, lowercases, then computes
 * Jaccard similarity on the resulting sets.
 * Returns 0 if both sets are empty.
 */
export function languageSimilarity(
  a: ExtractedProduct,
  b: ExtractedProduct
): number {
  const setA = parseScriptSet(a.textScript);
  const setB = parseScriptSet(b.textScript);

  if (setA.size === 0 && setB.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;

  if (unionSize === 0) {
    return 0;
  }

  return intersectionSize / unionSize;
}

/**
 * Parse a textScript string into a set of normalized language/script names.
 */
function parseScriptSet(textScript: string): Set<string> {
  const result = new Set<string>();
  if (!textScript || textScript.trim().length === 0) {
    return result;
  }

  const parts = textScript.split('/');
  for (const part of parts) {
    const normalized = part.trim().toLowerCase();
    if (normalized.length > 0) {
      result.add(normalized);
    }
  }

  return result;
}
