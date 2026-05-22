/**
 * Test/validation script for the similarity engine.
 *
 * Run with: npx tsx scripts/recommendations/similarity/test.ts
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import type { ExtractedProduct } from '../types';
import { categorySimilarity } from './category';
import { cosineSimilarity, computeTextSimilarityMatrix } from './text';
import { authorSimilarity } from './author';
import { publisherSimilarity } from './publisher';
import { languageSimilarity } from './language';
import { computeCompositeScore, DEFAULT_WEIGHTS } from './composite';
import { computeAllPairsSimilarity, loadProductsAndCompute } from './index';

// ─── Helpers ────────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function assertApprox(
  actual: number,
  expected: number,
  tolerance: number,
  message: string
): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `ASSERTION FAILED: ${message}\n  Expected: ${expected}\n  Actual:   ${actual}\n  Tolerance: ${tolerance}`
    );
  }
}

function makeProduct(
  overrides: Partial<ExtractedProduct> & { id: number }
): ExtractedProduct {
  return {
    title: '',
    description: '',
    author: '',
    publisher: '',
    textScript: '',
    categoryIds: [],
    requiresShipping: true,
    ...overrides,
  };
}

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    if (err instanceof Error) {
      console.error(`     ${err.message}`);
    }
    testsFailed++;
  }
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

console.log('\n🧪 Similarity Engine — Test Suite\n');

// ── 1. Category Similarity (Jaccard) ────────────────────────────────────────

console.log('📦 Category Similarity');

runTest('identical categories → 1.0', () => {
  const a = makeProduct({ id: 1, categoryIds: [1, 2, 3] });
  const b = makeProduct({ id: 2, categoryIds: [1, 2, 3] });
  assertApprox(categorySimilarity(a, b), 1.0, 0.001, 'identical categories');
});

runTest('no overlap → 0.0', () => {
  const a = makeProduct({ id: 1, categoryIds: [1, 2] });
  const b = makeProduct({ id: 2, categoryIds: [3, 4] });
  assertApprox(categorySimilarity(a, b), 0.0, 0.001, 'no overlap');
});

runTest('partial overlap → 1/3', () => {
  const a = makeProduct({ id: 1, categoryIds: [1, 2] });
  const b = makeProduct({ id: 2, categoryIds: [2, 3] });
  // intersection = {2} → 1, union = {1,2,3} → 3, Jaccard = 1/3
  assertApprox(categorySimilarity(a, b), 1 / 3, 0.001, 'partial overlap');
});

runTest('both empty → 0.0', () => {
  const a = makeProduct({ id: 1, categoryIds: [] });
  const b = makeProduct({ id: 2, categoryIds: [] });
  assertApprox(categorySimilarity(a, b), 0.0, 0.001, 'both empty');
});

runTest('one empty → 0.0', () => {
  const a = makeProduct({ id: 1, categoryIds: [1, 2] });
  const b = makeProduct({ id: 2, categoryIds: [] });
  assertApprox(categorySimilarity(a, b), 0.0, 0.001, 'one empty');
});

// ── 2. Author Similarity ────────────────────────────────────────────────────

console.log('\n👤 Author Similarity');

runTest('exact match (case-insensitive) → 1.0', () => {
  const a = makeProduct({ id: 1, author: 'John Smith' });
  const b = makeProduct({ id: 2, author: 'john smith' });
  assertApprox(authorSimilarity(a, b), 1.0, 0.001, 'case-insensitive match');
});

runTest('different authors → 0.0', () => {
  const a = makeProduct({ id: 1, author: 'John Smith' });
  const b = makeProduct({ id: 2, author: 'Jane Doe' });
  assertApprox(authorSimilarity(a, b), 0.0, 0.001, 'different authors');
});

runTest('whitespace normalization → 1.0', () => {
  const a = makeProduct({ id: 1, author: '  John   Smith  ' });
  const b = makeProduct({ id: 2, author: 'John Smith' });
  assertApprox(
    authorSimilarity(a, b),
    1.0,
    0.001,
    'whitespace normalization'
  );
});

runTest('empty author → 0.0', () => {
  const a = makeProduct({ id: 1, author: '' });
  const b = makeProduct({ id: 2, author: 'John Smith' });
  assertApprox(authorSimilarity(a, b), 0.0, 0.001, 'empty author');
});

runTest('both empty → 0.0', () => {
  const a = makeProduct({ id: 1, author: '' });
  const b = makeProduct({ id: 2, author: '' });
  assertApprox(authorSimilarity(a, b), 0.0, 0.001, 'both empty');
});

// ── 3. Publisher Similarity ─────────────────────────────────────────────────

console.log('\n🏢 Publisher Similarity');

runTest('exact match (case-insensitive) → 1.0', () => {
  const a = makeProduct({ id: 1, publisher: 'Holy Press' });
  const b = makeProduct({ id: 2, publisher: 'holy press' });
  assertApprox(
    publisherSimilarity(a, b),
    1.0,
    0.001,
    'case-insensitive match'
  );
});

runTest('different publishers → 0.0', () => {
  const a = makeProduct({ id: 1, publisher: 'Holy Press' });
  const b = makeProduct({ id: 2, publisher: 'Divine Books' });
  assertApprox(publisherSimilarity(a, b), 0.0, 0.001, 'different publishers');
});

runTest('empty publisher → 0.0', () => {
  const a = makeProduct({ id: 1, publisher: '' });
  const b = makeProduct({ id: 2, publisher: 'Holy Press' });
  assertApprox(publisherSimilarity(a, b), 0.0, 0.001, 'empty publisher');
});

// ── 4. Language Similarity ──────────────────────────────────────────────────

console.log('\n🌐 Language Similarity');

runTest('"Traditional Chinese / Русский" vs "Traditional Chinese" → ~0.5', () => {
  const a = makeProduct({ id: 1, textScript: 'Traditional Chinese / Русский' });
  const b = makeProduct({ id: 2, textScript: 'Traditional Chinese' });
  // setA = {"traditional chinese", "русский"}, setB = {"traditional chinese"}
  // intersection = 1, union = 2, Jaccard = 0.5
  assertApprox(
    languageSimilarity(a, b),
    0.5,
    0.001,
    'partial language overlap'
  );
});

runTest('identical language → 1.0', () => {
  const a = makeProduct({ id: 1, textScript: 'Simplified Chinese' });
  const b = makeProduct({ id: 2, textScript: 'Simplified Chinese' });
  assertApprox(languageSimilarity(a, b), 1.0, 0.001, 'identical language');
});

runTest('no overlap → 0.0', () => {
  const a = makeProduct({ id: 1, textScript: 'English' });
  const b = makeProduct({ id: 2, textScript: 'Russian' });
  assertApprox(languageSimilarity(a, b), 0.0, 0.001, 'no language overlap');
});

runTest('both empty → 0.0', () => {
  const a = makeProduct({ id: 1, textScript: '' });
  const b = makeProduct({ id: 2, textScript: '' });
  assertApprox(languageSimilarity(a, b), 0.0, 0.001, 'both empty');
});

// ── 5. Composite Score ──────────────────────────────────────────────────────

console.log('\n⚖️  Composite Score');

runTest('known weighted sum', () => {
  const scores = {
    category: 0.5,
    text: 0.8,
    author: 1.0,
    publisher: 0.0,
    language: 0.5,
  };
  const expected =
    0.45 * 0.5 +
    0.25 * 0.8 +
    0.15 * 1.0 +
    0.10 * 0.0 +
    0.05 * 0.5;
  assertApprox(
    computeCompositeScore(scores),
    expected,
    0.0001,
    'composite weighted sum'
  );
});

runTest('all zeros → 0.0', () => {
  const scores = {
    category: 0,
    text: 0,
    author: 0,
    publisher: 0,
    language: 0,
  };
  assertApprox(computeCompositeScore(scores), 0.0, 0.0001, 'all zeros');
});

runTest('all ones → 1.0', () => {
  const scores = {
    category: 1,
    text: 1,
    author: 1,
    publisher: 1,
    language: 1,
  };
  assertApprox(computeCompositeScore(scores), 1.0, 0.0001, 'all ones');
});

runTest('custom weights', () => {
  const scores = {
    category: 1.0,
    text: 0.0,
    author: 0.0,
    publisher: 0.0,
    language: 0.0,
  };
  const customWeights = {
    category: 0.5,
    text: 0.2,
    author: 0.1,
    publisher: 0.1,
    language: 0.1,
  };
  assertApprox(
    computeCompositeScore(scores, customWeights),
    0.5,
    0.0001,
    'custom weights'
  );
});

// ── 6. Cosine Similarity (unit) ─────────────────────────────────────────────

console.log('\n📐 Cosine Similarity');

runTest('identical vectors → 1.0', () => {
  const vec = new Map([
    ['a', 1],
    ['b', 2],
    ['c', 3],
  ]);
  assertApprox(cosineSimilarity(vec, vec), 1.0, 0.001, 'identical vectors');
});

runTest('orthogonal vectors → 0.0', () => {
  const vecA = new Map([['a', 1]]);
  const vecB = new Map([['b', 1]]);
  assertApprox(
    cosineSimilarity(vecA, vecB),
    0.0,
    0.001,
    'orthogonal vectors'
  );
});

runTest('empty vectors → 0.0', () => {
  const vecA = new Map<string, number>();
  const vecB = new Map<string, number>();
  assertApprox(cosineSimilarity(vecA, vecB), 0.0, 0.001, 'empty vectors');
});

// ── 7. Integration Test ─────────────────────────────────────────────────────

console.log('\n🔗 Integration Test — Full Pipeline');

runTest('load data and compute all-pairs similarity', () => {
  const dataPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../data/extracted-products.json'
  );

  const raw = readFileSync(dataPath, 'utf-8');
  const products: ExtractedProduct[] = JSON.parse(raw);

  console.log(`     Products loaded: ${products.length}`);

  const startTime = performance.now();
  const results = computeAllPairsSimilarity(products);
  const elapsed = performance.now() - startTime;

  console.log(`     Computation time: ${elapsed.toFixed(0)} ms`);
  console.log(`     Result map size: ${results.size}`);

  // Verify result map size matches product count
  assert(results.size === products.length, 'Result map size should match product count');

  // Verify all scores are in [0, 1] range
  let totalCandidates = 0;
  let maxScore = -Infinity;
  let minScore = Infinity;

  for (const [productId, candidates] of results) {
    assert(candidates.length <= 20, `Product ${productId} should have ≤ 20 candidates`);
    for (const candidate of candidates) {
      totalCandidates++;
      if (candidate.score > maxScore) maxScore = candidate.score;
      if (candidate.score < minScore) minScore = candidate.score;
      assert(
        candidate.score >= 0 && candidate.score <= 1,
        `Score ${candidate.score} for candidate ${candidate.id} of product ${productId} out of [0,1] range`
      );
    }
  }

  console.log(`     Total candidates: ${totalCandidates}`);
  console.log(`     Score range: [${minScore.toFixed(4)}, ${maxScore.toFixed(4)}]`);

  // Verify candidates are sorted descending
  for (const [productId, candidates] of results) {
    for (let i = 1; i < candidates.length; i++) {
      assert(
        candidates[i - 1].score >= candidates[i].score,
        `Product ${productId}: candidates not sorted at index ${i}`
      );
    }
  }

  // Print top 5 recommendations for 3 sample products
  const sampleIds = [products[0].id, products[Math.floor(products.length / 3)].id, products[Math.floor(products.length * 2 / 3)].id];

  // Build a product lookup for display
  const productLookup = new Map<number, ExtractedProduct>();
  for (const p of products) {
    productLookup.set(p.id, p);
  }

  console.log('\n     📋 Sample Recommendations:\n');
  for (const sampleId of sampleIds) {
    const product = productLookup.get(sampleId)!;
    const candidates = results.get(sampleId)!;
    console.log(`     Product #${sampleId}: "${product.title}" (author: ${product.author})`);
    console.log(`     Categories: [${product.categoryIds.join(', ')}] | Language: ${product.textScript}`);
    console.log('     Top 5:');
    for (let i = 0; i < Math.min(5, candidates.length); i++) {
      const c = candidates[i];
      const cp = productLookup.get(c.id)!;
      console.log(
        `       ${i + 1}. [${c.score.toFixed(4)}] #${c.id} "${cp.title}" (cat=${c.scores.category.toFixed(2)}, text=${c.scores.text.toFixed(2)}, auth=${c.scores.author.toFixed(2)}, pub=${c.scores.publisher.toFixed(2)}, lang=${c.scores.language.toFixed(2)})`
      );
    }
    console.log('');
  }

  // Verify computation completed in under 5 seconds
  assert(elapsed < 5000, `Computation took ${elapsed}ms, expected < 5000ms`);
});

// ── Summary ─────────────────────────────────────────────────────────────────

console.log('─────────────────────────────────────────────');
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.error('\n❌ Some tests FAILED!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
}
