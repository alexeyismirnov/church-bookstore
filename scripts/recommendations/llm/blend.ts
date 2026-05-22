/**
 * Blending Engine — Merges algorithmic and LLM recommendation scores.
 *
 * Sprint 4: Takes algo top-20 candidates and LLM top-8 candidates per product,
 * normalizes scores, blends with configurable weights, and returns top-N.
 */

import type { RecommendationEntry } from '../types';
import type { LLMRecommendation } from './enhance';

export interface BlendInput {
  algoCandidates: Map<number, { id: number; score: number }[]>;
  llmCandidates: Map<number, LLMRecommendation[]>;
  productIds: Set<number>;
  algoWeight?: number; // default 0.4
  llmWeight?: number; // default 0.6
  topN?: number; // default 4
}

/**
 * Normalize an array of scores to [0, 1] range.
 * If all scores are identical (range is 0), set all normalized values to 1.0.
 */
function normalizeScores(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;

  if (range === 0) {
    return scores.map(() => 1.0);
  }

  return scores.map((s) => (s - min) / range);
}

/**
 * Blend algorithmic and LLM recommendation scores for all products.
 *
 * For each product:
 * 1. Collect union of candidate IDs from both sources
 * 2. Normalize each score column to [0, 1]
 * 3. Compute blended score = algoWeight * normalizedAlgo + llmWeight * normalizedLlm
 * 4. Sort by blended score descending, take top N
 *
 * Edge cases:
 * - No LLM results → algo-only (algoWeight=1.0, llmWeight=0.0)
 * - No algo results → LLM-only
 * - All identical scores in a column → normalized to 1.0
 */
export function blendRecommendations(
  input: BlendInput
): Map<number, RecommendationEntry[]> {
  const {
    algoCandidates,
    llmCandidates,
    productIds,
    topN = 4,
  } = input;

  const result = new Map<number, RecommendationEntry[]>();

  for (const productId of productIds) {
    const algoList = algoCandidates.get(productId) ?? [];
    const llmList = llmCandidates.get(productId) ?? [];

    // Determine effective weights
    let algoWeight: number;
    let llmWeight: number;

    const hasAlgo = algoList.length > 0;
    const hasLlm = llmList.length > 0;

    if (!hasLlm) {
      // No LLM results — use algo-only
      algoWeight = 1.0;
      llmWeight = 0.0;
    } else if (!hasAlgo) {
      // No algo results — use LLM-only
      algoWeight = 0.0;
      llmWeight = 1.0;
    } else {
      algoWeight = input.algoWeight ?? 0.4;
      llmWeight = input.llmWeight ?? 0.6;
    }

    // Build lookup maps for quick access
    const algoMap = new Map<number, number>();
    for (const c of algoList) {
      algoMap.set(c.id, c.score);
    }

    const llmMap = new Map<number, number>();
    for (const r of llmList) {
      // Normalize LLM score from 1-10 to 0-1
      llmMap.set(r.id, r.score / 10);
    }

    // Build union set of all candidate IDs
    const candidateIds = new Set<number>();
    for (const id of algoMap.keys()) {
      candidateIds.add(id);
    }
    for (const id of llmMap.keys()) {
      candidateIds.add(id);
    }

    if (candidateIds.size === 0) {
      result.set(productId, []);
      continue;
    }

    // Collect raw scores for normalization
    const candidates: {
      id: number;
      rawAlgo: number;
      rawLlm: number;
    }[] = [];

    for (const id of candidateIds) {
      candidates.push({
        id,
        rawAlgo: algoMap.get(id) ?? 0,
        rawLlm: llmMap.get(id) ?? 0,
      });
    }

    // Normalize each score column
    const normalizedAlgo = normalizeScores(candidates.map((c) => c.rawAlgo));
    const normalizedLlm = normalizeScores(candidates.map((c) => c.rawLlm));

    // Compute blended scores
    const scored: RecommendationEntry[] = candidates.map((c, i) => {
      const blendedScore =
        algoWeight * normalizedAlgo[i] + llmWeight * normalizedLlm[i];

      return {
        id: c.id,
        score: Math.round(blendedScore * 10000) / 10000,
        algoScore: Math.round(c.rawAlgo * 10000) / 10000,
        llmScore: Math.round(c.rawLlm * 10000) / 10000,
      };
    });

    // Sort by blended score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top N
    result.set(productId, scored.slice(0, topN));
  }

  return result;
}
