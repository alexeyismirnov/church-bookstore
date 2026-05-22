/**
 * Recommendations Diff Tool — Compares old and new recommendations.json files.
 *
 * Sprint 6: Provides a human-readable diff report showing added, removed,
 * changed, and unchanged products between two recommendation files.
 *
 * Usage:
 *   npx tsx scripts/recommendations/diff.ts                          # Compare current file with itself
 *   npx tsx scripts/recommendations/diff.ts --new path/to/new.json   # Compare current with new
 *   npx tsx scripts/recommendations/diff.ts --old old.json --new new.json
 *
 * Exit codes: 0 = no differences, 1 = differences found
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { RecommendationsData, RecommendationEntry } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CLI arg parsing ---

interface DiffCliFlags {
  oldPath: string;
  newPath: string;
}

function parseDiffArgs(args: string[]): DiffCliFlags {
  const DEFAULT_PATH = resolve(__dirname, '../../app/data/recommendations.json');

  const flags: DiffCliFlags = {
    oldPath: DEFAULT_PATH,
    newPath: DEFAULT_PATH,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--old' && i + 1 < args.length) {
      flags.oldPath = resolve(args[i + 1]);
      i++;
    }

    if (arg === '--new' && i + 1 < args.length) {
      flags.newPath = resolve(args[i + 1]);
      i++;
    }
  }

  return flags;
}

// --- Diff logic ---

interface DiffResult {
  oldMeta: {
    productCount: number;
    generatedAt: string;
    version: string;
    llmEnhanced: boolean;
    blendWeights: { algo: number; llm: number };
  };
  newMeta: {
    productCount: number;
    generatedAt: string;
    version: string;
    llmEnhanced: boolean;
    blendWeights: { algo: number; llm: number };
  };
  metaChanges: string[];
  added: number[];
  removed: number[];
  changed: {
    productId: number;
    oldIds: number[];
    newIds: number[];
    oldScores: number[];
    newScores: number[];
    avgScoreChange: number;
  }[];
  unchangedCount: number;
}

function loadRecommendations(filePath: string): RecommendationsData {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RecommendationsData;
}

function compareRecommendations(oldData: RecommendationsData, newData: RecommendationsData): DiffResult {
  // Metadata comparison
  const metaChanges: string[] = [];

  if (oldData.version !== newData.version) {
    metaChanges.push(`version: ${oldData.version} → ${newData.version}`);
  }
  if (oldData.generatedAt !== newData.generatedAt) {
    metaChanges.push(`generatedAt: ${oldData.generatedAt} → ${newData.generatedAt}`);
  }
  if (oldData.productCount !== newData.productCount) {
    metaChanges.push(`productCount: ${oldData.productCount} → ${newData.productCount}`);
  }
  if (oldData.llmEnhanced !== newData.llmEnhanced) {
    metaChanges.push(`llmEnhanced: ${oldData.llmEnhanced} → ${newData.llmEnhanced}`);
  }
  if (oldData.blendWeights.algo !== newData.blendWeights.algo || oldData.blendWeights.llm !== newData.blendWeights.llm) {
    metaChanges.push(`blendWeights: algo=${oldData.blendWeights.algo},llm=${oldData.blendWeights.llm} → algo=${newData.blendWeights.algo},llm=${newData.blendWeights.llm}`);
  }

  // Product ID sets
  const oldIds = new Set(Object.keys(oldData.recommendations));
  const newIds = new Set(Object.keys(newData.recommendations));

  const added = [...newIds].filter((id) => !oldIds.has(id)).map(Number).sort((a, b) => a - b);
  const removed = [...oldIds].filter((id) => !newIds.has(id)).map(Number).sort((a, b) => a - b);

  // Changed products (exist in both but have different recommendations)
  const changed: DiffResult['changed'] = [];
  let unchangedCount = 0;

  const commonIds = [...oldIds].filter((id) => newIds.has(id));
  for (const idStr of commonIds) {
    const id = Number(idStr);
    const oldRecs = oldData.recommendations[idStr] ?? [];
    const newRecs = newData.recommendations[idStr] ?? [];

    const oldRecIds = oldRecs.map((r: RecommendationEntry) => r.id);
    const newRecIds = newRecs.map((r: RecommendationEntry) => r.id);
    const oldRecScores = oldRecs.map((r: RecommendationEntry) => r.score);
    const newRecScores = newRecs.map((r: RecommendationEntry) => r.score);

    // Check if recommendations differ (by IDs or scores)
    const idsDiffer = JSON.stringify(oldRecIds) !== JSON.stringify(newRecIds);
    const scoresDiffer = JSON.stringify(oldRecScores) !== JSON.stringify(newRecScores);

    if (idsDiffer || scoresDiffer) {
      // Compute average score change
      const minLen = Math.min(oldRecScores.length, newRecScores.length);
      let totalChange = 0;
      for (let i = 0; i < minLen; i++) {
        totalChange += newRecScores[i] - oldRecScores[i];
      }
      const avgChange = minLen > 0 ? totalChange / minLen : 0;

      changed.push({
        productId: id,
        oldIds: oldRecIds,
        newIds: newRecIds,
        oldScores: oldRecScores,
        newScores: newRecScores,
        avgScoreChange: avgChange,
      });
    } else {
      unchangedCount++;
    }
  }

  return {
    oldMeta: {
      productCount: oldData.productCount,
      generatedAt: oldData.generatedAt,
      version: oldData.version,
      llmEnhanced: oldData.llmEnhanced,
      blendWeights: oldData.blendWeights,
    },
    newMeta: {
      productCount: newData.productCount,
      generatedAt: newData.generatedAt,
      version: newData.version,
      llmEnhanced: newData.llmEnhanced,
      blendWeights: newData.blendWeights,
    },
    metaChanges,
    added,
    removed,
    changed,
    unchangedCount,
  };
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().split('T')[0];
  } catch {
    return iso;
  }
}

function printReport(diff: DiffResult): void {
  console.log('Recommendations Diff Report');
  console.log('===========================');
  console.log(`Old: ${diff.oldMeta.productCount} products (generated ${formatTimestamp(diff.oldMeta.generatedAt)})`);
  console.log(`New: ${diff.newMeta.productCount} products (generated ${formatTimestamp(diff.newMeta.generatedAt)})`);

  // Metadata changes
  if (diff.metaChanges.length > 0) {
    console.log('\nMetadata changes:');
    for (const change of diff.metaChanges) {
      console.log(`  ${change}`);
    }
  }

  // Added products
  console.log(`\nAdded: ${diff.added.length} products`);
  for (const id of diff.added) {
    console.log(`  + Product ${id}`);
  }

  // Removed products
  console.log(`\nRemoved: ${diff.removed.length} products`);
  for (const id of diff.removed) {
    console.log(`  - Product ${id}`);
  }

  // Changed products
  console.log(`\nChanged: ${diff.changed.length} products`);
  for (const change of diff.changed) {
    console.log(`  Product ${change.productId}:`);
    console.log(`    Old: [${change.oldIds.join(', ')}]`);
    console.log(`    New: [${change.newIds.join(', ')}]`);
    const sign = change.avgScoreChange >= 0 ? '+' : '';
    console.log(`    Score changes: ${sign}${change.avgScoreChange.toFixed(4)} avg`);
  }

  // Unchanged
  console.log(`\nUnchanged: ${diff.unchangedCount} products`);

  // Summary line
  console.log(`\nSummary: ${diff.added.length} added, ${diff.removed.length} removed, ${diff.changed.length} changed, ${diff.unchangedCount} unchanged`);
}

// --- Main ---

function main(): void {
  const flags = parseDiffArgs(process.argv.slice(2));

  console.log(`Comparing:`);
  console.log(`  Old: ${flags.oldPath}`);
  console.log(`  New: ${flags.newPath}\n`);

  const oldData = loadRecommendations(flags.oldPath);
  const newData = loadRecommendations(flags.newPath);

  const diff = compareRecommendations(oldData, newData);
  printReport(diff);

  const hasDifferences =
    diff.metaChanges.length > 0 ||
    diff.added.length > 0 ||
    diff.removed.length > 0 ||
    diff.changed.length > 0;

  if (hasDifferences) {
    console.log('\nDifferences found.');
    process.exit(1);
  } else {
    console.log('\nNo differences found.');
    process.exit(0);
  }
}

main();
