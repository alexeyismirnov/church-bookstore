import { readFileSync } from 'fs';
import { join } from 'path';

interface RecommendationEntry {
  id: number;
  score: number;
  algoScore: number;
  llmScore: number;
}

interface RecommendationsData {
  version: string;
  generatedAt: string;
  productCount: number;
  llmEnhanced: boolean;
  blendWeights: { algo: number; llm: number };
  recommendations: Record<string, RecommendationEntry[]>;
}

let _data: RecommendationsData | null = null;

function loadRecommendations(): RecommendationsData | null {
  if (!_data) {
    try {
      const filePath = join(process.cwd(), 'app/data/recommendations.json');
      const raw = readFileSync(filePath, 'utf-8');
      _data = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to load recommendations.json:', err);
      return null;
    }
  }
  return _data;
}

/**
 * Get recommended product IDs for a given product.
 * Returns an array of product IDs (numbers), or empty array if not found.
 */
export function getRecommendedProductIds(
  productId: string,
  limit: number = 4
): number[] {
  const data = loadRecommendations();
  if (!data) return [];
  const entries = data.recommendations[productId];
  if (!entries || entries.length === 0) return [];
  return entries.slice(0, limit).map((e) => e.id);
}
