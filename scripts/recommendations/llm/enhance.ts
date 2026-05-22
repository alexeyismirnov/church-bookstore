/**
 * LLM Enhancement — Calls the LLM for each product to get recommendations.
 *
 * Sprint 4: Orchestrates LLM calls with concurrency control, parses responses,
 * and saves intermediate results.
 */

// Load .env.local into process.env BEFORE any other imports read env vars
import '../load-env.js';

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { ExtractedProduct } from '../types';
import { callLLM, loadLLMConfigFromEnv, runWithConcurrency } from './client';
import type { LLMConfig } from './client';
import { buildSystemPrompt, buildUserPrompt } from './prompt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LLM_DATA_PATH = resolve(__dirname, '../data/llm-recommendations.json');

export interface LLMRecommendation {
  id: number;
  score: number; // 1-10 from LLM
  reason: string;
}

export interface LLMEnhancementResult {
  productId: number;
  recommendations: LLMRecommendation[];
  error?: string;
}

/**
 * Parse the LLM response, stripping markdown code fences and extra text.
 */
function parseLLMResponse(raw: string): LLMRecommendation[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim();

  // Remove ```json ... ``` or ``` ... ``` wrappers
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try to find a JSON array in the response
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error('No JSON array found in LLM response');
  }

  const parsed = JSON.parse(arrayMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error('LLM response is not a JSON array');
  }

  return parsed.map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    return {
      id: typeof obj.id === 'number' ? obj.id : parseInt(String(obj.id), 10),
      score:
        typeof obj.score === 'number'
          ? Math.max(1, Math.min(10, Math.round(obj.score)))
          : 5,
      reason: typeof obj.reason === 'string' ? obj.reason : '',
    };
  });
}

/**
 * Enhance product recommendations using LLM.
 *
 * For each product, calls the LLM to get the top-8 most related books,
 * then validates and stores the results.
 *
 * @param products - Full list of extracted products
 * @param config - Optional LLM configuration (loaded from env if not provided)
 * @param onProgress - Optional progress callback
 * @returns Map of productId → LLMEnhancementResult
 */
export async function enhanceWithLLM(
  products: ExtractedProduct[],
  config?: LLMConfig,
  onProgress?: (done: number, total: number) => void
): Promise<Map<number, LLMEnhancementResult>> {
  const llmConfig = config ?? loadLLMConfigFromEnv();
  const productIds = new Set(products.map((p) => p.id));
  const results = new Map<number, LLMEnhancementResult>();

  const systemPrompt = buildSystemPrompt();
  let completed = 0;
  const total = products.length;

  console.log(`      Using model: ${llmConfig.model}, concurrency: ${llmConfig.concurrency}`);

  await runWithConcurrency(
    products,
    async (product) => {
      try {
        const userPrompt = buildUserPrompt(product, products);
        const rawResponse = await callLLM(llmConfig, systemPrompt, userPrompt);
        const recommendations = parseLLMResponse(rawResponse);

        // Validate: filter out IDs not in the product set
        const validRecommendations = recommendations.filter(
          (r) => productIds.has(r.id) && r.id !== product.id
        );

        results.set(product.id, {
          productId: product.id,
          recommendations: validRecommendations,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        console.warn(
          `      ⚠ LLM failed for product ${product.id} (${product.title}): ${message}`
        );
        results.set(product.id, {
          productId: product.id,
          recommendations: [],
          error: message,
        });
      }

      completed++;
      if (onProgress && completed % 10 === 0) {
        onProgress(completed, total);
      }
    },
    llmConfig.concurrency
  );

  // Final progress call
  if (onProgress && completed % 10 !== 0) {
    onProgress(completed, total);
  }

  // Save intermediate results
  const serializable: Record<number, LLMEnhancementResult> = {};
  for (const [key, value] of results) {
    serializable[key] = value;
  }

  try {
    const outputDir = dirname(LLM_DATA_PATH);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(
      LLM_DATA_PATH,
      JSON.stringify(serializable, null, 2),
      'utf-8'
    );
    console.log(`      Saved intermediate LLM results to ${LLM_DATA_PATH}`);
  } catch (writeErr: unknown) {
    console.warn(
      `      ⚠ Failed to save intermediate results: ${writeErr instanceof Error ? writeErr.message : writeErr}`
    );
  }

  return results;
}
