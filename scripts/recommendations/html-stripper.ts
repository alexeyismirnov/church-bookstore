/**
 * Strips HTML tags and decodes common HTML entities from a string.
 * Pure regex-based approach — no external dependencies.
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  let text = html;

  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Collapse multiple whitespace/newlines into single spaces
  text = text.replace(/\s+/g, ' ');

  // Trim the result
  return text.trim();
}
