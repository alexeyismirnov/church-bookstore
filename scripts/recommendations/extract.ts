import * as fs from 'fs';
import * as path from 'path';
import { ExtractedProduct } from './types.js';
import { stripHtml } from './html-stripper.js';

// Absolute fixture paths
const FIXTURES_DIR = '/home/alexey/workspace/oscar-3.1/fixtures';
const PRODUCT_FIXTURE = path.resolve(FIXTURES_DIR, 'product.json');
const PRODUCT_CATEGORY_FIXTURE = path.resolve(FIXTURES_DIR, 'productcategory.json');
const CATEGORY_FIXTURE = path.resolve(FIXTURES_DIR, 'category.json');

// Output path
const OUTPUT_DIR = path.resolve(import.meta.dirname, 'data');
const OUTPUT_FILE = path.resolve(OUTPUT_DIR, 'extracted-products.json');

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

// --- Main extraction logic ---

function main(): void {
  console.log('=== Product Data Extraction ===\n');

  // 1. Read and parse fixture files
  console.log('Reading fixture files...');
  console.log(`  Products:         ${PRODUCT_FIXTURE}`);
  console.log(`  ProductCategories: ${PRODUCT_CATEGORY_FIXTURE}`);
  console.log(`  Categories:       ${CATEGORY_FIXTURE}\n`);

  const productsRaw = JSON.parse(
    fs.readFileSync(PRODUCT_FIXTURE, 'utf-8')
  ) as FixtureRecord<ProductFields>[];

  const productCategoriesRaw = JSON.parse(
    fs.readFileSync(PRODUCT_CATEGORY_FIXTURE, 'utf-8')
  ) as FixtureRecord<ProductCategoryFields>[];

  // We read categories for reference but don't need them for extraction
  // (category names are not part of ExtractedProduct, only IDs)
  JSON.parse(fs.readFileSync(CATEGORY_FIXTURE, 'utf-8'));

  console.log(`  Total product records in fixture: ${productsRaw.length}`);
  console.log(`  Total product-category mappings:  ${productCategoriesRaw.length}\n`);

  // 2. Filter products: standalone or parent + public
  const filteredProducts = productsRaw.filter(
    (p) => (p.fields.structure === 'standalone' || p.fields.structure === 'parent')
           && p.fields.is_public === true
  );
  console.log(`  Filtered (standalone|parent + public): ${filteredProducts.length}\n`);

  // 3. Build product → category IDs map
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

  // 4. Extract product data
  const extractedProducts: ExtractedProduct[] = filteredProducts.map((p) => ({
    id: p.pk,
    title: p.fields.title_en ?? '',
    description: stripHtml(p.fields.description_en ?? ''),
    author: p.fields.author_en ?? '',
    publisher: p.fields.publisher ?? '',
    textScript: p.fields.text_script ?? '',
    categoryIds: productCategoryMap.get(p.pk) ?? [],
    requiresShipping: p.fields.requires_shipping,
  }));

  // 5. Write output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(extractedProducts, null, 2), 'utf-8');
  console.log(`Output written to: ${OUTPUT_FILE}\n`);

  // 6. Print summary
  const total = extractedProducts.length;
  const withTitle = extractedProducts.filter((p) => p.title.trim() !== '').length;
  const withDescription = extractedProducts.filter((p) => p.description.trim() !== '').length;
  const withAuthor = extractedProducts.filter((p) => p.author.trim() !== '').length;
  const withCategories = extractedProducts.filter((p) => p.categoryIds.length > 0).length;

  console.log('=== Summary ===');
  console.log(`  Total products extracted:    ${total}`);
  console.log(`  With non-empty title:        ${withTitle}`);
  console.log(`  With non-empty description:  ${withDescription}`);
  console.log(`  With non-empty author:       ${withAuthor}`);
  console.log(`  With categories:             ${withCategories}`);

  // Print first 3 entries for verification
  console.log('\n=== Sample Entries (first 3) ===');
  for (const product of extractedProducts.slice(0, 3)) {
    console.log(JSON.stringify(product, null, 2));
    console.log('---');
  }
}

main();
