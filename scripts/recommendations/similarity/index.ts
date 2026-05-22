import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { ExtractedProduct } from '../types';
import { categorySimilarity } from './category';
import { computeTextSimilarityMatrix } from './text';
import { authorSimilarity } from './author';
import { publisherSimilarity } from './publisher';
import { languageSimilarity } from './language';
import {
  computeCompositeScore,
  DEFAULT_WEIGHTS,
} from './composite';
import type { SimilarityScores, Weights } from './composite';

export type { SimilarityScores, Weights };

export interface ScoredCandidate {
  id: number;
  score: number;
  scores: SimilarityScores;
}

/**
 * Compute all-pairs similarity for a list of products.
 *
 * For each product, returns the top 20 most similar products ranked by
 * composite score.
 *
 * @param products - Array of ExtractedProduct objects
 * @param weights - Optional custom weights for the composite score
 * @returns Map<productId, ScoredCandidate[]> (top 20 per product)
 */
export function computeAllPairsSimilarity(
  products: ExtractedProduct[],
  weights: Weights = DEFAULT_WEIGHTS
): Map<number, ScoredCandidate[]> {
  const N = products.length;

  // Pre-compute the text similarity matrix (expensive, do once)
  const textMatrix = computeTextSimilarityMatrix(products);

  // Build a lookup from product ID to index for fast access
  const idToIndex = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    idToIndex.set(products[i].id, i);
  }

  // For each product, collect all candidates
  const result = new Map<number, ScoredCandidate[]>();

  for (let i = 0; i < N; i++) {
    const productA = products[i];
    const candidates: ScoredCandidate[] = [];

    for (let j = 0; j < N; j++) {
      if (i === j) continue;

      const productB = products[j];

      const scores: SimilarityScores = {
        category: categorySimilarity(productA, productB),
        text: textMatrix.get(productA.id)?.get(productB.id) ?? 0,
        author: authorSimilarity(productA, productB),
        publisher: publisherSimilarity(productA, productB),
        language: languageSimilarity(productA, productB),
      };

      const compositeScore = computeCompositeScore(scores, weights);

      candidates.push({
        id: productB.id,
        score: compositeScore,
        scores,
      });
    }

    // Sort by composite score descending
    candidates.sort((a, b) => b.score - a.score);

    // Keep top 20
    result.set(productA.id, candidates.slice(0, 20));
  }

  return result;
}

/**
 * Convenience function: load products from JSON file and compute all-pairs similarity.
 *
 * @param dataPath - Path to extracted-products.json. Defaults to ../data/extracted-products.json
 * @returns Map<productId, ScoredCandidate[]>
 */
export function loadProductsAndCompute(
  dataPath?: string
): Map<number, ScoredCandidate[]> {
  const defaultPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../data/extracted-products.json'
  );

  const filePath = dataPath ?? defaultPath;

  const raw = readFileSync(filePath, 'utf-8');
  const products: ExtractedProduct[] = JSON.parse(raw);

  return computeAllPairsSimilarity(products);
}
