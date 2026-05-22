/**
 * Minimal `.env.local` loader for standalone scripts.
 *
 * Next.js automatically loads `.env.local` at runtime, but scripts executed
 * with `npx tsx` do not. This module bridges that gap by reading `.env.local`
 * from the project root and populating `process.env` before any other code
 * reads environment variables.
 *
 * Usage (MUST be the very first import in the entry script):
 *
 *     import './load-env.js';  // side-effect import — do not remove
 *
 * No external dependencies — uses only Node.js built-ins.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root is two levels up from scripts/recommendations/
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const ENV_FILE = resolve(PROJECT_ROOT, '.env.local');

/**
 * Parse a single `.env` line into a `[key, value]` tuple.
 * Returns `null` for comments and blank lines.
 */
function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();

  // Skip empty lines and comments
  if (trimmed === '' || trimmed.startsWith('#')) {
    return null;
  }

  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) {
    return null; // malformed line — skip
  }

  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();

  // Strip surrounding quotes (single or double)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

/**
 * Load `.env.local` from the project root into `process.env`.
 *
 * - Silently skips if the file does not exist (e.g., in CI).
 * - Never overwrites existing environment variables — real env vars take precedence.
 * - Idempotent — safe to call multiple times.
 */
export function loadEnvLocal(): void {
  if (!existsSync(ENV_FILE)) {
    return;
  }

  let contents: string;
  try {
    contents = readFileSync(ENV_FILE, 'utf-8');
  } catch {
    // Permission error or similar — silently skip
    return;
  }

  const lines = contents.split('\n');
  let loaded = 0;

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed === null) {
      continue;
    }

    const [key, value] = parsed;

    // Only set if not already defined (real env vars take precedence)
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded++;
    }
  }

  if (loaded > 0 && process.env.RECOMMENDATIONS_VERBOSE === 'true') {
    console.log(`[load-env] Loaded ${loaded} variables from ${ENV_FILE}`);
  }
}

// Auto-load on import (side-effect)
loadEnvLocal();
