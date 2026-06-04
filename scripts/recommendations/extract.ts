import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ExtractedProduct } from './types.js';
import { stripHtml } from './html-stripper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_FIXTURES_DIR = '/home/alexey/workspace/oscar-3.1/fixtures';
export const DEFAULT_EXTRACTED_OUTPUT = path.resolve(__dirname, 'data/extracted-products.json');

// --- Types for fixture records ---

interface ProductFields {
  structure: string;
  is_public: boolean;
  title_en?: string;
  description_en?: string;
  author_en?: string;
  publisher?: string;
  text_script?: string;
  requires_shipping: boolean;
  [key: string]: unknown;
}

interface ProductCategoryFields {
  product: number;
  category: number;
}

interface FixtureRecord<T> {
  model: string;
  pk: number;
  fields: T;
}

export interface ExtractOptions {
  fixturesDir?: string;
  outputPath?: string;
  verbose?: boolean;
}

/** Read Oscar fixtures and return public standalone/parent products for the recommender. */
export function extractProductsFromFixtures(fixturesDir: string): ExtractedProduct[] {
  const productFixture = path.resolve(fixturesDir, 'product.json');
  const productCategoryFixture = path.resolve(fixturesDir, 'productcategory.json');
  const categoryFixture = path.resolve(fixturesDir, 'category.json');

  const productsRaw = JSON.parse(
    fs.readFileSync(productFixture, 'utf-8')
  ) as FixtureRecord<ProductFields>[];

  const productCategoriesRaw = JSON.parse(
    fs.readFileSync(productCategoryFixture, 'utf-8')
  ) as FixtureRecord<ProductCategoryFields>[];

  // Read categories so missing fixture fails fast (names not used in ExtractedProduct).
  JSON.parse(fs.readFileSync(categoryFixture, 'utf-8'));

  const filteredProducts = productsRaw.filter(
    (p) =>
      (p.fields.structure === 'standalone' || p.fields.structure === 'parent') &&
      p.fields.is_public === true
  );

  const productCategoryMap = new Map<number, number[]>();
  for (const pc of productCategoriesRaw) {
    const productId = pc.fields.product;
    const categoryId = pc.fields.category;
    const existing = productCategoryMap.get(productId);
    if (existing) {
      existing.push(categoryId);
    } else {
      productCategoryMap.set(productId, [categoryId]);
    }
  }

  return filteredProducts.map((p) => ({
    id: p.pk,
    title: p.fields.title_en ?? '',
    description: stripHtml(p.fields.description_en ?? ''),
    author: p.fields.author_en ?? '',
    publisher: p.fields.publisher ?? '',
    textScript: p.fields.text_script ?? '',
    categoryIds: productCategoryMap.get(p.pk) ?? [],
    requiresShipping: p.fields.requires_shipping,
  }));
}

export function writeExtractedProducts(
  products: ExtractedProduct[],
  outputPath: string = DEFAULT_EXTRACTED_OUTPUT
): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
}

/** Extract from fixtures and write extracted-products.json. */
export function runExtraction(options: ExtractOptions = {}): ExtractedProduct[] {
  const fixturesDir = options.fixturesDir ?? DEFAULT_FIXTURES_DIR;
  const outputPath = options.outputPath ?? DEFAULT_EXTRACTED_OUTPUT;
  const verbose = options.verbose ?? false;

  if (verbose) {
    console.log('=== Product Data Extraction ===\n');
    console.log('Reading fixture files...');
    console.log(`  Fixtures dir:      ${fixturesDir}`);
    console.log(`  Products:          ${path.resolve(fixturesDir, 'product.json')}`);
    console.log(`  ProductCategories: ${path.resolve(fixturesDir, 'productcategory.json')}`);
    console.log(`  Categories:        ${path.resolve(fixturesDir, 'category.json')}\n`);
  }

  const extractedProducts = extractProductsFromFixtures(fixturesDir);
  writeExtractedProducts(extractedProducts, outputPath);

  if (verbose) {
    const withCategories = extractedProducts.filter((p) => p.categoryIds.length > 0).length;
    console.log(`  Extracted ${extractedProducts.length} products (${withCategories} with categories)`);
    console.log(`  Output written to: ${outputPath}\n`);
  }

  return extractedProducts;
}

function main(): void {
  const fixturesDir =
    process.argv.includes('--fixtures-path') &&
    process.argv.indexOf('--fixtures-path') + 1 < process.argv.length
      ? process.argv[process.argv.indexOf('--fixtures-path') + 1]
      : DEFAULT_FIXTURES_DIR;

  const products = runExtraction({ fixturesDir, verbose: true });

  const withTitle = products.filter((p) => p.title.trim() !== '').length;
  const withDescription = products.filter((p) => p.description.trim() !== '').length;
  const withAuthor = products.filter((p) => p.author.trim() !== '').length;
  const withCategories = products.filter((p) => p.categoryIds.length > 0).length;

  console.log('=== Summary ===');
  console.log(`  Total products extracted:    ${products.length}`);
  console.log(`  With non-empty title:        ${withTitle}`);
  console.log(`  With non-empty description:  ${withDescription}`);
  console.log(`  With non-empty author:       ${withAuthor}`);
  console.log(`  With categories:             ${withCategories}`);

  console.log('\n=== Sample Entries (first 3) ===');
  for (const product of products.slice(0, 3)) {
    console.log(JSON.stringify(product, null, 2));
    console.log('---');
  }
}

const isCliEntry =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCliEntry) {
  main();
}
