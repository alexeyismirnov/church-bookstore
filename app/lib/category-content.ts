import { STATIC_CATEGORIES } from './data';

/** i18n keys for category description copy (under homepage.categories or catalog.categoryDesc). */
const CHILD_CATEGORY_DESC_KEYS: Record<string, string> = {
  '59': 'homepage.categories.booksDesc',
  '5': 'homepage.categories.booksDesc',
  '4': 'homepage.categories.booksDesc',
  '3': 'homepage.categories.booksDesc',
  '2': 'homepage.categories.booksDesc',
  '55': 'homepage.categories.booksDesc',
  '56': 'homepage.categories.booksDesc',
  '61': 'homepage.categories.booksDesc',
  '60': 'homepage.categories.audiovideoDesc',
  '58': 'homepage.categories.audiovideoDesc',
  '64': 'homepage.categories.churchSuppliesDesc',
  '63': 'homepage.categories.churchSuppliesDesc',
};

const PARENT_CATEGORY_DESC_KEYS: Record<string, string> = {
  '1': 'homepage.categories.booksDesc',
  '57': 'homepage.categories.audiovideoDesc',
  '62': 'homepage.categories.churchSuppliesDesc',
};

const CATEGORY_SLUG_DESC_KEYS: Record<string, string> = {};
for (const category of STATIC_CATEGORIES) {
  CATEGORY_SLUG_DESC_KEYS[category.slug] =
    PARENT_CATEGORY_DESC_KEYS[category.id] ?? 'homepage.categories.defaultDesc';
  for (const child of category.children) {
    CATEGORY_SLUG_DESC_KEYS[child.slug] =
      CHILD_CATEGORY_DESC_KEYS[child.id] ?? PARENT_CATEGORY_DESC_KEYS[category.id] ?? 'homepage.categories.defaultDesc';
  }
}

/** Translation key for a catalog category description, if known. */
export function getCategoryDescriptionKey(categoryId: string): string | null {
  return (
    CHILD_CATEGORY_DESC_KEYS[categoryId] ??
    PARENT_CATEGORY_DESC_KEYS[categoryId] ??
    null
  );
}

export function getCategoryDescriptionKeyBySlug(slug: string): string | null {
  return CATEGORY_SLUG_DESC_KEYS[slug] ?? null;
}
