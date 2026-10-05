import * as crypto from 'crypto';

/**
 * Generates a deterministic record ID based on source, URL, and text.
 */
export function generateRecordId(source: string, sourceUrl: string | null, rawText: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(source);
  if (sourceUrl) {
    hash.update(sourceUrl);
  }
  hash.update(rawText);
  return hash.digest('hex');
}

/**
 * Ensures a date is safely parsed or returns null.
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}
