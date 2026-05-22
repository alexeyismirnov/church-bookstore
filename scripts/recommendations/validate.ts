import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { ExtractedProduct, RecommendationsData, RecommendationEntry } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RECOMMENDATIONS_PATH = resolve(__dirname, '../../app/data/recommendations.json');
const EXTRACTED_DATA_PATH = resolve(__dirname, 'data/extracted-products.json');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function validate(): ValidationResult {
  const result: ValidationResult = { passed: true, errors: [], warnings: [] };

  // Load recommendations
  let recData: RecommendationsData;
  try {
    const raw = readFileSync(RECOMMENDATIONS_PATH, 'utf-8');
    recData = JSON.parse(raw);
  } catch (e) {
    result.passed = false;
    result.errors.push(`Failed to load recommendations.json: ${e}`);
    return result;
  }

  // Load extracted products
  let products: ExtractedProduct[];
  try {
    const raw = readFileSync(EXTRACTED_DATA_PATH, 'utf-8');
    products = JSON.parse(raw);
  } catch (e) {
    result.passed = false;
    result.errors.push(`Failed to load extracted-products.json: ${e}`);
    return result;
  }

  const productIds = new Set(products.map((p) => p.id));

  console.log('=== Recommendation Validation ===\n');

  // Check 1: JSON structure
  console.log('[1/6] Checking JSON structure...');
  const requiredFields = ['version', 'generatedAt', 'productCount', 'recommendations'];
  for (const field of requiredFields) {
    if (!(field in recData)) {
      result.errors.push(`Missing required field: "${field}"`);
      result.passed = false;
    }
  }
  if (!('blendWeights' in recData)) {
    result.errors.push('Missing required field: "blendWeights"');
    result.passed = false;
  }
  if (!('llmEnhanced' in recData)) {
    result.errors.push('Missing required field: "llmEnhanced"');
    result.passed = false;
  }
  console.log(result.errors.length === 0 ? '      ✓ Structure valid\n' : `      ✗ ${result.errors.length} issue(s)\n`);

  // Check 2: Every product ID has an entry in recommendations
  console.log('[2/6] Checking product coverage...');
  let missingCount = 0;
  for (const product of products) {
    const key = String(product.id);
    if (!(key in recData.recommendations)) {
      result.errors.push(`Product ${product.id} (${product.title}) has no recommendations entry`);
      result.passed = false;
      missingCount++;
    }
  }
  const coverageCount = products.filter((p) => String(p.id) in recData.recommendations).length;
  const coveragePct = ((coverageCount / products.length) * 100).toFixed(1);
  console.log(`      Coverage: ${coverageCount}/${products.length} products (${coveragePct}%)`);
  if (missingCount > 0) {
    console.log(`      ✗ ${missingCount} product(s) missing\n`);
  } else {
    console.log('      ✓ All products covered\n');
  }

  // Check 3: No product recommends itself
  console.log('[3/6] Checking self-recommendation...');
  let selfRecCount = 0;
  for (const [productId, entries] of Object.entries(recData.recommendations)) {
    for (const entry of entries as RecommendationEntry[]) {
      if (entry.id === Number(productId)) {
        result.errors.push(`Product ${productId} recommends itself`);
        result.passed = false;
        selfRecCount++;
      }
    }
  }
  if (selfRecCount > 0) {
    console.log(`      ✗ ${selfRecCount} self-recommendation(s) found\n`);
  } else {
    console.log('      ✓ No self-recommendations\n');
  }

  // Check 4: All recommended product IDs exist in extracted products
  console.log('[4/6] Checking recommended product IDs exist...');
  let invalidRefCount = 0;
  for (const [productId, entries] of Object.entries(recData.recommendations)) {
    for (const entry of entries as RecommendationEntry[]) {
      if (!productIds.has(entry.id)) {
        result.errors.push(`Product ${productId} recommends unknown product ${entry.id}`);
        result.passed = false;
        invalidRefCount++;
      }
    }
  }
  if (invalidRefCount > 0) {
    console.log(`      ✗ ${invalidRefCount} invalid reference(s)\n`);
  } else {
    console.log('      ✓ All recommended IDs valid\n');
  }

  // Check 5: All scores in [0, 1] range
  console.log('[5/6] Checking score ranges...');
  let invalidScoreCount = 0;
  for (const [productId, entries] of Object.entries(recData.recommendations)) {
    for (const entry of entries as RecommendationEntry[]) {
      if (entry.score < 0 || entry.score > 1) {
        result.errors.push(`Product ${productId}: score ${entry.score} out of [0,1] range`);
        result.passed = false;
        invalidScoreCount++;
      }
      if (entry.algoScore < 0 || entry.algoScore > 1) {
        result.errors.push(`Product ${productId}: algoScore ${entry.algoScore} out of [0,1] range`);
        result.passed = false;
        invalidScoreCount++;
      }
      if (entry.llmScore < 0 || entry.llmScore > 1) {
        result.errors.push(`Product ${productId}: llmScore ${entry.llmScore} out of [0,1] range`);
        result.passed = false;
        invalidScoreCount++;
      }
    }
  }
  if (invalidScoreCount > 0) {
    console.log(`      ✗ ${invalidScoreCount} invalid score(s)\n`);
  } else {
    console.log('      ✓ All scores in valid range\n');
  }

  // Check 6: llmEnhanced is boolean
  console.log('[6/6] Checking metadata types...');
  if (typeof recData.llmEnhanced !== 'boolean') {
    result.errors.push(`llmEnhanced is not a boolean: ${typeof recData.llmEnhanced}`);
    result.passed = false;
  }
  if (typeof recData.version !== 'string') {
    result.errors.push(`version is not a string: ${typeof recData.version}`);
    result.passed = false;
  }
  if (typeof recData.generatedAt !== 'string') {
    result.errors.push(`generatedAt is not a string: ${typeof recData.generatedAt}`);
    result.passed = false;
  }
  console.log('      ✓ Metadata types valid\n');

  // Summary
  console.log('=== Validation Summary ===');
  const totalEntries = Object.values(recData.recommendations).reduce(
    (sum, entries) => sum + (entries as RecommendationEntry[]).length,
    0
  );
  console.log(`  Total recommendation entries: ${totalEntries}`);
  console.log(`  Errors:   ${result.errors.length}`);
  console.log(`  Warnings: ${result.warnings.length}`);

  if (result.errors.length > 0) {
    console.log('\n  Errors:');
    for (const err of result.errors) {
      console.log(`    ✗ ${err}`);
    }
  }

  if (result.passed) {
    console.log('\n  ✓ All checks passed!');
  } else {
    console.log('\n  ✗ Some checks failed.');
  }

  return result;
}

// Run validation and exit with appropriate code
const result = validate();
process.exit(result.passed ? 0 : 1);
