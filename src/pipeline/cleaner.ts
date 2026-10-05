import sanitizeHtml from 'sanitize-html';
import { franc } from 'franc-min';

export interface CleaningResult {
  cleanedText: string;
  language: string | null;
  isValid: boolean;
  meta: Record<string, any>;
}

export class TextCleaner {
  
  public clean(rawText: string): CleaningResult {
    const meta: Record<string, any> = {};
    let text = rawText;

    // 1. Strip HTML
    const beforeHtmlLen = text.length;
    text = sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {}
    });
    meta.htmlRemoved = beforeHtmlLen - text.length;

    // 2. Normalize whitespace
    text = text.replace(/[\r\n]+/g, '\n') // Normalize newlines
               .replace(/[ \t]+/g, ' ')   // Collapse spaces/tabs
               .trim();

    // 3. Language detection
    // franc returns 'und' if it cannot determine
    let detectedLang = franc(text);
    if (detectedLang === 'und') detectedLang = 'unknown';

    // 4. Validation
    // Mark as invalid if too short (e.g. less than 20 chars after cleaning)
    const isValid = text.length >= 20;
    if (!isValid) {
      meta.skipReason = 'too_short';
    }

    return {
      cleanedText: text,
      language: detectedLang !== 'unknown' ? detectedLang : null,
      isValid,
      meta
    };
  }

}

export const cleaner = new TextCleaner();
