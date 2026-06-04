// Load .env.local into process.env BEFORE any other imports read env vars
import './load-env.js';

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { ExtractedProduct, RecommendationEntry, RecommendationsData } from './types';
import { runExtraction, DEFAULT_EXTRACTED_OUTPUT } from './extract';
import { loadProductsAndCompute } from './similarity/index';
import { enhanceWithLLM } from './llm/enhance';
import { blendRecommendations } from './llm/blend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_EXTRACTED_DATA_PATH = DEFAULT_EXTRACTED_OUTPUT;
const DEFAULT_OUTPUT_PATH = resolve(__dirname, '../../app/data/recommendations.json');
const DEFAULT_FIXTURES_PATH = '/home/alexey/workspace/oscar-3.1/fixtures';

// --- CLI flag parsing ---

interface CliFlags {
  algoOnly: boolean;
  algoWeight: number;
  llmWeight: number;
  fixturesPath: string;
  outputPath: string;
  topN: number;
  verbose: boolean;
  dryRun: boolean;
  skipExtract: boolean;
}

function parseCliArgs(args: string[]): CliFlags {
  const flags: CliFlags = {
    algoOnly: false,
    algoWeight: 0.4,
    llmWeight: 0.6,
    fixturesPath: DEFAULT_FIXTURES_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    topN: 4,
    verbose: false,
    dryRun: false,
    skipExtract: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--algo-only') {
      flags.algoOnly = true;
    }

    if (arg === '--blend-weights' && i + 1 < args.length) {
      const parts = args[i + 1].split(',');
      if (parts.length === 2) {
        const algo = parseFloat(parts[0]);
        const llm = parseFloat(parts[1]);
        if (!isNaN(algo) && !isNaN(llm)) {
          flags.algoWeight = algo;
          flags.llmWeight = llm;
        }
      }
      i++; // skip the value argument
    }

    if (arg === '--fixtures-path' && i + 1 < args.length) {
      flags.fixturesPath = args[i + 1];
      i++; // skip the value argument
    }

    if (arg === '--output-path' && i + 1 < args.length) {
      flags.outputPath = resolve(args[i + 1]);
      i++; // skip the value argument
    }

    if (arg === '--top-n' && i + 1 < args.length) {
      const val = parseInt(args[i + 1], 10);
      if (!isNaN(val) && val > 0) {
        flags.topN = val;
      }
      i++; // skip the value argument
    }

    if (arg === '--verbose') {
      flags.verbose = true;
    }

    if (arg === '--dry-run') {
      flags.dryRun = true;
    }

    if (arg === '--skip-extract') {
      flags.skipExtract = true;
    }
  }

  return flags;
}

// --- Main pipeline ---

async function main(): Promise<void> {
  const flags = parseCliArgs(process.argv.slice(2));

  const mode = flags.algoOnly ? 'Algorithmic Only' : 'Full Pipeline (Algo + LLM)';
  console.log(`=== Recommendation Generation (Sprint 6 — ${mode}) ===\n`);

  if (flags.verbose) {
    console.log('  CLI flags:');
    console.log(`    algoOnly:      ${flags.algoOnly}`);
    console.log(`    algoWeight:    ${flags.algoWeight}`);
    console.log(`    llmWeight:     ${flags.llmWeight}`);
    console.log(`    fixturesPath:  ${flags.fixturesPath}`);
    console.log(`    outputPath:    ${flags.outputPath}`);
    console.log(`    topN:          ${flags.topN}`);
    console.log(`    verbose:       ${flags.verbose}`);
    console.log(`    dryRun:        ${flags.dryRun}`);
    console.log(`    skipExtract:   ${flags.skipExtract}`);
    console.log();
  }

  if (!flags.algoOnly) {
    console.log(`  Blend weights: algo=${flags.algoWeight}, llm=${flags.llmWeight}\n`);
  }

  // Step 1: Extract from fixtures (unless skipped), then load extracted products
  if (!flags.skipExtract) {
    if (flags.verbose) {
      console.log('[1/6] Extracting products from Oscar fixtures...');
      console.log(`      Fixtures path: ${flags.fixturesPath}`);
      console.log(`      Fixtures exist: ${existsSync(flags.fixturesPath)}`);
    } else {
      console.log('[1/6] Extracting products from Oscar fixtures...');
    }

    if (!existsSync(flags.fixturesPath)) {
      throw new Error(`Fixtures directory not found: ${flags.fixturesPath}`);
    }

    const extracted = runExtraction({
      fixturesDir: flags.fixturesPath,
      outputPath: DEFAULT_EXTRACTED_DATA_PATH,
      verbose: flags.verbose,
    });
    console.log(`      Extracted ${extracted.length} products → extracted-products.json\n`);
  } else {
    console.log('[1/6] Skipping fixture extraction (--skip-extract)\n');
  }

  if (flags.verbose) {
    console.log('[2/6] Loading extracted products...');
    console.log(`      Data path: ${DEFAULT_EXTRACTED_DATA_PATH}`);
  } else {
    console.log('[2/6] Loading extracted products...');
  }

  const raw = readFileSync(DEFAULT_EXTRACTED_DATA_PATH, 'utf-8');
  const products: ExtractedProduct[] = JSON.parse(raw);
  console.log(`      Loaded ${products.length} products from extracted-products.json\n`);

  // Step 3: Run similarity engine
  if (flags.verbose) {
    console.log('[3/6] Computing all-pairs similarity (this may take a moment)...');
  } else {
    console.log('[3/6] Computing all-pairs similarity (this may take a moment)...');
  }

  const similarityMap = loadProductsAndCompute(DEFAULT_EXTRACTED_DATA_PATH);
  console.log(`      Computed similarity for ${similarityMap.size} products\n`);

  if (flags.verbose) {
    let totalCandidates = 0;
    for (const [, candidates] of similarityMap) {
      totalCandidates += candidates.length;
    }
    console.log(`      Total candidate pairs: ${totalCandidates}`);
    console.log(`      Average candidates per product: ${(totalCandidates / similarityMap.size).toFixed(1)}`);
    console.log();
  }

  // Build algo candidates map (top-20 per product)
  const algoCandidates = new Map<number, { id: number; score: number }[]>();
  for (const [productId, candidates] of similarityMap) {
    algoCandidates.set(
      productId,
      candidates.slice(0, 20).map((c) => ({ id: c.id, score: c.score }))
    );
  }

  let llmResults: Map<number, { productId: number; recommendations: { id: number; score: number; reason: string }[]; error?: string }> | null = null;

  // Step 4: LLM enhancement (skip if --algo-only)
  if (!flags.algoOnly) {
    if (flags.verbose) {
      console.log('[4/6] Running LLM enhancement...');
      console.log(`      Products to enhance: ${products.length}`);
    } else {
      console.log('[4/6] Running LLM enhancement...');
    }

    const startTime = Date.now();

    llmResults = await enhanceWithLLM(
      products,
      undefined,
      (done, total) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        if (flags.verbose) {
          const failed = [...(llmResults?.values() ?? [])].filter((r) => r.error).length;
          console.log(`      Progress: ${done}/${total} products (${elapsed}s, ${failed} failures so far)`);
        } else {
          console.log(`      Progress: ${done}/${total} products (${elapsed}s)`);
        }
      }
    );

    const elapsedTotal = ((Date.now() - startTime) / 1000).toFixed(1);
    const failed = [...llmResults.values()].filter((r) => r.error).length;
    console.log(`      LLM enhancement complete in ${elapsedTotal}s (${failed} failures)\n`);

    if (flags.verbose) {
      const successCount = llmResults.size - failed;
      console.log(`      LLM success: ${successCount}, failures: ${failed}`);
      console.log(`      Success rate: ${((successCount / llmResults.size) * 100).toFixed(1)}%`);
      console.log();
    }
  } else {
    console.log('[4/6] Skipping LLM enhancement (--algo-only flag)\n');
  }

  // Step 5: Blend algo + LLM results (or use algo-only)
  if (flags.verbose) {
    console.log('[5/6] Building final recommendations...');
    console.log(`      topN: ${flags.topN}`);
    console.log(`      Mode: ${flags.algoOnly ? 'algo-only' : 'blended'}`);
  } else {
    console.log('[5/6] Building final recommendations...');
  }

  const recommendations: RecommendationsData['recommendations'] = {};
  let totalEntries = 0;
  const allScores: number[] = [];
  const productIds = new Set(products.map((p) => p.id));

  if (flags.algoOnly) {
    // Algo-only path
    for (const product of products) {
      const candidates = algoCandidates.get(product.id) ?? [];
      const topCandidates = candidates.slice(0, flags.topN);

      const entries: RecommendationEntry[] = topCandidates.map((c) => {
        const algoScore = Math.round(c.score * 10000) / 10000;
        allScores.push(algoScore);
        return {
          id: c.id,
          score: algoScore,
          algoScore,
          llmScore: 0,
        };
      });

      recommendations[String(product.id)] = entries;
      totalEntries += entries.length;
    }
  } else {
    // Blended path
    const llmCandidates = new Map<number, { id: number; score: number; reason: string }[]>();
    if (llmResults) {
      for (const [productId, result] of llmResults) {
        llmCandidates.set(productId, result.recommendations);
      }
    }

    const blended = blendRecommendations({
      algoCandidates,
      llmCandidates,
      productIds,
      algoWeight: flags.algoWeight,
      llmWeight: flags.llmWeight,
      topN: flags.topN,
    });

    for (const [productId, entries] of blended) {
      for (const entry of entries) {
        allScores.push(entry.score);
      }
      recommendations[String(productId)] = entries;
      totalEntries += entries.length;
    }
  }

  console.log(`      Built recommendations for ${Object.keys(recommendations).length} products\n`);

  if (flags.verbose) {
    console.log(`      Total recommendation entries: ${totalEntries}`);
    console.log(`      Average entries per product: ${(totalEntries / products.length).toFixed(2)}`);
    if (allScores.length > 0) {
      const minScore = Math.min(...allScores);
      const maxScore = Math.max(...allScores);
      const meanScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      console.log(`      Score range: ${minScore.toFixed(4)} — ${maxScore.toFixed(4)} (mean: ${meanScore.toFixed(4)})`);
    }
    console.log();
  }

  // Step 5: Write output (or skip if --dry-run)
  const data: RecommendationsData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    llmEnhanced: !flags.algoOnly,
    blendWeights: {
      algo: flags.algoOnly ? 1.0 : flags.algoWeight,
      llm: flags.algoOnly ? 0.0 : flags.llmWeight,
    },
    recommendations,
  };

  if (flags.dryRun) {
    console.log('[6/6] DRY RUN: output not written');
    console.log(`      Would write to: ${flags.outputPath}`);
    console.log(`      Payload size: ${JSON.stringify(data).length} bytes\n`);
  } else {
    console.log('[6/6] Writing output...');
    const outputDir = dirname(flags.outputPath);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(flags.outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`      Written to ${flags.outputPath}\n`);
  }

  // Summary statistics
  console.log('=== Summary Statistics ===');
  console.log(`  Mode:                           ${mode}`);
  console.log(`  Total products processed:       ${products.length}`);
  console.log(`  Total recommendations generated: ${totalEntries}`);
  console.log(`  Average recommendations/product: ${(totalEntries / products.length).toFixed(2)}`);

  if (flags.algoOnly) {
    console.log(`  Blend weights:                  algo=1.0, llm=0.0`);
  } else {
    console.log(`  Blend weights:                  algo=${flags.algoWeight}, llm=${flags.llmWeight}`);
  }

  if (allScores.length > 0) {
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    const meanScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    console.log(`  Score distribution:`);
    console.log(`    min:  ${minScore.toFixed(4)}`);
    console.log(`    max:  ${maxScore.toFixed(4)}`);
    console.log(`    mean: ${meanScore.toFixed(4)}`);
  }

  if (llmResults) {
    const llmFailed = [...llmResults.values()].filter((r) => r.error).length;
    const llmTotal = llmResults.size;
    console.log(`  LLM success rate:               ${llmTotal - llmFailed}/${llmTotal} (${((1 - llmFailed / llmTotal) * 100).toFixed(1)}%)`);
  }

  // Check for products with fewer than topN recommendations
  const shortProducts = products.filter(
    (p) => (recommendations[String(p.id)] ?? []).length < flags.topN
  );
  if (shortProducts.length > 0) {
    console.log(`\n  ⚠ ${shortProducts.length} product(s) with fewer than ${flags.topN} recommendations:`);
    for (const p of shortProducts) {
      const count = (recommendations[String(p.id)] ?? []).length;
      console.log(`    - Product ${p.id} (${p.title}): ${count} recommendations`);
    }
  } else {
    console.log(`\n  ✓ All products have ${flags.topN} recommendations`);
  }

  if (flags.dryRun) {
    console.log('\n  DRY RUN: no output file was written');
  }

  console.log('\n=== Generation complete ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
