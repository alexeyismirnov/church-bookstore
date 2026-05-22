export interface SimilarityScores {
  category: number;
  text: number;
  author: number;
  publisher: number;
  language: number;
}

export interface Weights {
  category: number;  // default 0.45
  text: number;      // default 0.25
  author: number;    // default 0.15
  publisher: number; // default 0.10
  language: number;  // default 0.05
}

export const DEFAULT_WEIGHTS: Weights = {
  category: 0.45,
  text: 0.25,
  author: 0.15,
  publisher: 0.10,
  language: 0.05,
};

/**
 * Compute the weighted composite similarity score.
 *
 * Formula: w_cat × S_cat + w_text × S_text + w_author × S_author + w_pub × S_pub + w_lang × S_lang
 */
export function computeCompositeScore(
  scores: SimilarityScores,
  weights: Weights = DEFAULT_WEIGHTS
): number {
  return (
    weights.category * scores.category +
    weights.text * scores.text +
    weights.author * scores.author +
    weights.publisher * scores.publisher +
    weights.language * scores.language
  );
}
