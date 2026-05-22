export interface ExtractedProduct {
  id: number;
  title: string;           // from title_en
  description: string;     // from description_en, HTML stripped to plain text
  author: string;          // from author_en
  publisher: string;
  textScript: string;      // from text_script
  categoryIds: number[];   // from productcategory.json mapping
  requiresShipping: boolean;
}

export interface RecommendationEntry {
  id: number;           // product PK
  score: number;        // blended score (0-1)
  algoScore: number;    // algorithmic composite score (0-1)
  llmScore: number;     // LLM relevance score (0-1), 0 if not yet computed
}

export interface RecommendationsData {
  version: string;                    // semver, e.g. "1.0.0"
  generatedAt: string;                // ISO 8601 timestamp
  productCount: number;               // total products processed
  llmEnhanced: boolean;               // false in Sprint 3, true after Sprint 4
  blendWeights: {
    algo: number;
    llm: number;
  };
  recommendations: {
    [productId: string]: RecommendationEntry[];  // top-4 per product
  };
}
