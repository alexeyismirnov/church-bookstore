# Recommendation System

## Overview

The church bookstore uses a **hybrid algorithmic + LLM recommendation system** to suggest related books to customers. The system pre-computes recommendations offline and serves them at runtime via a JSON file with a 3-tier fallback strategy.

The pipeline consists of:
1. **Data extraction** from Oscar fixture files
2. **5 algorithmic similarity signals** combined into a composite score
3. **LLM enhancement** via an OpenAI-compatible API (nano-gpt)
4. **Score blending** (configurable algo/LLM weights, default 0.4/0.6)
5. **Pre-computed JSON** storage in `app/data/recommendations.json`
6. **3-tier runtime fallback** in the Next.js product page

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Offline Pipeline                            │
│                                                                 │
│  Oscar fixtures ──► extract.ts ──► extracted-products.json      │
│                                           │                     │
│                                           ▼                     │
│                    ┌─────────────────────────────────────┐      │
│                    │   Similarity Engine (5 signals)     │      │
│                    │   • Category (Jaccard)     w=0.45   │      │
│                    │   • Text TF-IDF cosine      w=0.25  │      │
│                    │   • Author match            w=0.15  │      │
│                    │   • Publisher match         w=0.10  │      │
│                    │   • Language (Jaccard)      w=0.05  │      │
│                    └──────────────┬──────────────────────┘      │
│                                   │ algo top-20 per product     │
│                                   ▼                             │
│                    ┌─────────────────────────────────────┐      │
│                    │   LLM Enhancement (optional)        │      │
│                    │   • OpenAI-compatible API           │      │
│                    │   • Top-8 recs per product          │      │
│                    │   • Concurrency-controlled          │      │
│                    └──────────────┬──────────────────────┘      │
│                                   │                             │
│                                   ▼                             │
│                    ┌─────────────────────────────────────┐      │
│                    │   Blending Engine                    │      │
│                    │   blended = 0.4×norm(algo)          │      │
│                    │           + 0.6×norm(llm)           │      │
│                    │   → top-N per product                │      │
│                    └──────────────┬──────────────────────┘      │
│                                   │                             │
│                                   ▼                             │
│                  app/data/recommendations.json                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Runtime (Next.js)                           │
│                                                                 │
│  Product page ──► getCachedRelatedProducts()                   │
│                      │                                          │
│                      ├─ Tier 1: Pre-computed recommendations   │
│                      │          from recommendations.json       │
│                      │                                          │
│                      ├─ Tier 2: Category-based products        │
│                      │          from Oscar API                  │
│                      │                                          │
│                      └─ Tier 3: Catalog page 1                 │
│                                 (original behavior)             │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Regenerate All Recommendations

```bash
npm run recommendations:generate
```

### Algorithmic Only (no LLM, faster)

```bash
npm run recommendations:generate -- --algo-only
```

### Validate Recommendations

```bash
npm run recommendations:validate
```

### Compare Changes

```bash
npm run recommendations:diff
```

## CLI Reference

### `npm run recommendations:generate`

Full pipeline: extract → algo → LLM → blend → write.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--algo-only` | boolean | `false` | Skip LLM pass, use algorithmic scores only |
| `--blend-weights` | string | `0.4,0.6` | Custom blend weights (algo,llm) |
| `--fixtures-path` | string | `/home/alexey/workspace/oscar-3.1/fixtures` | Override default fixture directory |
| `--output-path` | string | `app/data/recommendations.json` | Override default output file path |
| `--top-n` | number | `4` | How many recommendations per product |
| `--verbose` | boolean | `false` | Enable detailed logging throughout the pipeline |
| `--dry-run` | boolean | `false` | Compute everything but do NOT write the output file |

#### Examples

```bash
# Full pipeline with default settings
npm run recommendations:generate

# Algorithmic only (no LLM, faster)
npm run recommendations:generate -- --algo-only

# Detailed logging
npm run recommendations:generate -- --verbose

# Compute but don't write
npm run recommendations:generate -- --dry-run

# 8 recommendations per product
npm run recommendations:generate -- --top-n 8

# Custom blend weights (30% algo, 70% LLM)
npm run recommendations:generate -- --blend-weights 0.3,0.7

# Custom fixture directory
npm run recommendations:generate -- --fixtures-path /path/to/fixtures

# Custom output path
npm run recommendations:generate -- --output-path /path/to/output.json

# Combine flags
npm run recommendations:generate -- --algo-only --dry-run --verbose --top-n 8
```

### `npm run recommendations:validate`

Validates the integrity of `app/data/recommendations.json`:
- Checks JSON structure and required fields
- Verifies all product IDs in the catalog have recommendations
- Checks for orphaned references (recommendations pointing to non-existent products)
- Reports products with fewer than expected recommendations

### `npm run recommendations:diff`

Compares two recommendation files and reports differences.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--old` | string | `app/data/recommendations.json` | Path to the old file |
| `--new` | string | `app/data/recommendations.json` | Path to the new file |

#### Examples

```bash
# Compare current file with itself (no diff expected)
npm run recommendations:diff

# Compare current with a newly generated file
npm run recommendations:generate -- --dry-run --output-path /tmp/new-recs.json
npm run recommendations:diff -- --new /tmp/new-recs.json

# Compare two specific files
npm run recommendations:diff -- --old old-recs.json --new new-recs.json
```

Exit codes: **0** = no differences, **1** = differences found (useful for CI).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RECOMMENDATIONS_LLM_API_KEY` | (empty) | API key for the LLM service |
| `RECOMMENDATIONS_LLM_BASE_URL` | `https://nano-gpt.com/api/v1` | API base URL |
| `RECOMMENDATIONS_LLM_MODEL` | `gemini-3.1-flash-lite` | Model to use for recommendations |
| `RECOMMENDATIONS_LLM_CONCURRENCY` | `5` | Number of parallel API calls |

## Similarity Signals

The algorithmic engine uses 5 weighted signals to compute a composite similarity score between every pair of products:

| Signal | Weight | File | Description |
|--------|--------|------|-------------|
| Category overlap (Jaccard) | 0.45 | `scripts/recommendations/similarity/category.ts` | Shared category IDs via Jaccard index |
| Text similarity (TF-IDF) | 0.25 | `scripts/recommendations/similarity/text.ts` | Description cosine similarity using TF-IDF vectors |
| Author match | 0.15 | `scripts/recommendations/similarity/author.ts` | Normalized exact string match on author name |
| Publisher match | 0.10 | `scripts/recommendations/similarity/publisher.ts` | Normalized exact string match on publisher name |
| Language match (Jaccard) | 0.05 | `scripts/recommendations/similarity/language.ts` | Shared `text_script` values via Jaccard index |

Weights are defined in `scripts/recommendations/similarity/composite.ts` as `DEFAULT_WEIGHTS`.

### Composite Score Formula

```
compositeScore = 0.45 × S_category + 0.25 × S_text + 0.15 × S_author + 0.10 × S_publisher + 0.05 × S_language
```

## Blending Formula

When LLM enhancement is enabled, algorithmic and LLM scores are blended:

```
blendedScore = algoWeight × normalise(algoScore) + llmWeight × normalise(llmScore)
```

Default weights: `algoWeight = 0.4`, `llmWeight = 0.6`.

Normalisation maps each score column to [0, 1] using min-max scaling. If all scores in a column are identical, they are normalised to 1.0.

The blending logic is in `scripts/recommendations/llm/blend.ts` (`blendRecommendations()`).

## File Structure

```
scripts/recommendations/
├── generate.ts              # Main pipeline orchestrator (CLI entry point)
├── extract.ts               # Extracts product data from Oscar fixtures
├── html-stripper.ts         # Strips HTML from product descriptions
├── types.ts                 # Shared TypeScript interfaces
├── validate.ts              # Validates recommendations.json integrity
├── diff.ts                  # Compares old vs new recommendation files
├── tsconfig.scripts.json    # TypeScript config for scripts
├── data/
│   ├── extracted-products.json   # Intermediate: extracted product data
│   └── llm-recommendations.json  # Intermediate: raw LLM results
├── similarity/
│   ├── index.ts             # All-pairs similarity orchestrator
│   ├── composite.ts         # Weighted composite score computation
│   ├── category.ts          # Category Jaccard similarity
│   ├── text.ts              # TF-IDF text similarity
│   ├── author.ts            # Author match similarity
│   ├── publisher.ts         # Publisher match similarity
│   ├── language.ts          # Language Jaccard similarity
│   └── test.ts              # Similarity engine tests
└── llm/
    ├── client.ts            # OpenAI-compatible API client with retry/concurrency
    ├── prompt.ts            # System and user prompt builders
    ├── enhance.ts           # LLM enhancement orchestrator
    └── blend.ts             # Score blending engine

app/
├── data/
│   └── recommendations.json # Pre-computed recommendations (served at runtime)
└── lib/
    └── recommendations.ts   # Runtime: loads recommendations, 3-tier fallback
```

## Runtime Fallback (3 Tiers)

The runtime function `getCachedRelatedProducts()` in `app/lib/recommendations.ts` uses a 3-tier fallback:

1. **Tier 1 — Pre-computed recommendations**: Loads from `app/data/recommendations.json`. This is the fastest path and serves the hybrid algo+LLM results.

2. **Tier 2 — Category-based products**: Falls back to the Oscar API to fetch products in the same category. Provides reasonable relevance when pre-computed data is unavailable.

3. **Tier 3 — Catalog page 1**: Falls back to the first page of the catalog. This is the original behavior before the recommendation system was built, ensuring the page always shows some products.

## When to Regenerate

Regenerate recommendations when:
- **New books are added** to the catalog (new Oscar fixtures)
- **Book metadata changes** significantly (title, description, author, categories)
- **Adjusting similarity signal weights** in `composite.ts`
- **Adjusting blend weights** (algo vs LLM ratio)
- **Switching LLM models** or prompt templates

## CI Integration

Example GitHub Actions workflow:

```yaml
- name: Generate recommendations
  run: npm run recommendations:generate -- --algo-only

- name: Validate recommendations
  run: npm run recommendations:validate

- name: Check for changes
  run: |
    git diff --exit-code app/data/recommendations.json || \
    git commit -am "chore: update recommendations"
```

For full LLM-enhanced generation in CI, ensure `RECOMMENDATIONS_LLM_API_KEY` is set as a repository secret.

## Extending the System

### Adding a New Similarity Signal

1. Create `scripts/recommendations/similarity/yoursignal.ts`:
   ```typescript
   import type { ExtractedProduct } from '../types';

   export function yourSignalSimilarity(a: ExtractedProduct, b: ExtractedProduct): number {
     // Return a score between 0 and 1
     return 0;
   }
   ```

2. Add the weight to `scripts/recommendations/similarity/composite.ts`:
   - Add field to `SimilarityScores` interface
   - Add field to `Weights` interface
   - Add default value to `DEFAULT_WEIGHTS`
   - Add term to `computeCompositeScore()`

3. Integrate into `scripts/recommendations/similarity/index.ts`:
   - Import your similarity function
   - Add it to the `scores` object in `computeAllPairsSimilarity()`

4. Regenerate and validate:
   ```bash
   npm run recommendations:generate -- --algo-only --verbose
   npm run recommendations:validate
   ```

### Adjusting Blend Weights

Use the `--blend-weights` flag to experiment without code changes:

```bash
# More weight on algorithmic
npm run recommendations:generate -- --blend-weights 0.7,0.3

# More weight on LLM
npm run recommendations:generate -- --blend-weights 0.2,0.8
```

### Changing the LLM Prompt

Edit `scripts/recommendations/llm/prompt.ts` to modify the system or user prompts sent to the LLM. After changes, regenerate:

```bash
npm run recommendations:generate -- --verbose
```
