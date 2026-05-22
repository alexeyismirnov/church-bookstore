/**
 * LLM Prompt Templates — system and user prompts for book recommendations.
 *
 * Sprint 4: Builds prompts that ask the LLM to select thematically related
 * Orthodox Christian books from the full catalog.
 */

import type { ExtractedProduct } from '../types';

/**
 * Build the system prompt that instructs the LLM how to behave.
 */
export function buildSystemPrompt(): string {
  return `You are an expert in Orthodox Christian literature. Given a source book and a catalog of available titles, select the most thematically and spiritually related books. Consider theological themes, liturgical context, author tradition, and reader interest patterns.

Return a JSON array of objects with fields: id (number), score (1-10 integer), reason (brief string).
Return ONLY valid JSON, no markdown, no explanation.`;
}

/**
 * Build the user prompt for a specific source product against the full catalog.
 *
 * Excludes the source product from the catalog list.
 * Truncates descriptions to 500 characters.
 */
export function buildUserPrompt(
  sourceProduct: ExtractedProduct,
  catalog: ExtractedProduct[]
): string {
  const author = sourceProduct.author || 'Unknown Author';
  const description = truncateDescription(sourceProduct.description, 500);
  const categoryIds = sourceProduct.categoryIds.join(', ');

  const catalogLines = catalog
    .filter((p) => p.id !== sourceProduct.id)
    .map((p) => {
      const catIds = p.categoryIds.join(', ');
      const pAuthor = p.author || 'Unknown Author';
      return `[ID:${p.id}] "${p.title}" by ${pAuthor} — Categories: ${catIds}`;
    })
    .join('\n');

  return `Source book: "${sourceProduct.title}" by ${author}. Categories: ${categoryIds}. Description: ${description}

Catalog of available books:
${catalogLines}

Select the 8 most related books from the catalog. Return a JSON array.`;
}

/**
 * Truncate a description to `maxLength` characters, appending "..." if truncated.
 */
function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
