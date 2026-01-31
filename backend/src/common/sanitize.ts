/**
 * Input sanitization utilities to prevent XSS and code injection
 */

/**
 * Strips HTML tags and dangerous patterns from text
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove vbscript: URLs
    .replace(/vbscript:/gi, '')
    // Remove data: URLs (can contain scripts)
    .replace(/data:/gi, '')
    // Remove on* event handlers that might have slipped through
    .replace(/\bon\w+\s*=/gi, '')
    // Decode HTML entities that could be used to bypass filters
    .replace(/&#x?[0-9a-f]+;?/gi, '')
    // Remove null bytes
    .replace(/\x00/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes text content (descriptions, comments, etc.)
 * Strips HTML but preserves safe characters like emojis
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized string
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = stripHtml(input);

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes a title field (short text, stricter rules)
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized string
 */
export function sanitizeTitle(input: string, maxLength: number = 200): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = stripHtml(input);

  // For titles, also remove newlines
  sanitized = sanitized.replace(/[\r\n]+/g, ' ');

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes an agent name (very strict: alphanumeric, underscores, hyphens only)
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default: 50)
 * @returns Sanitized string
 */
export function sanitizeName(input: string, maxLength: number = 50): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove anything that's not alphanumeric, underscore, or hyphen
  let sanitized = input.replace(/[^a-zA-Z0-9_-]/g, '');

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}
