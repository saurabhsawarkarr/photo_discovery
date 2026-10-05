import { RelevanceClassification } from '../shared/types';
import { CLASSIFICATIONS } from '../shared/constants';

export class RelevanceFilter {
  
  private relevantKeywords = [
    "can't find", "search", "looking for photo", "find old photo",
    "search not working", "can't locate", "retrieve",
    "where is my photo", "remember a photo", "search results",
    "find a specific"
  ];

  private irrelevantKeywords = [
    "storage full", "backup", "subscription", "pricing",
    "sync", "sharing", "editing", "account locked",
    "payment", "Google One"
  ];

  /**
   * Pass 1: Keyword-based heuristic classification
   */
  public pass1Classify(text: string): RelevanceClassification {
    const lowerText = text.toLowerCase();
    
    let hasRelevant = false;
    for (const kw of this.relevantKeywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        hasRelevant = true;
        break;
      }
    }

    let hasIrrelevant = false;
    for (const kw of this.irrelevantKeywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        hasIrrelevant = true;
        break;
      }
    }

    if (hasRelevant && !hasIrrelevant) {
      return CLASSIFICATIONS.POTENTIALLY_RELEVANT; 
    }
    
    if (!hasRelevant && hasIrrelevant) {
      return CLASSIFICATIONS.IRRELEVANT;
    }

    // Ambiguous
    return CLASSIFICATIONS.POTENTIALLY_RELEVANT;
  }

  /**
   * Pass 2: LLM Classification (Stub - fully implemented in Phase 4)
   */
  public async pass2ClassifyLLM(texts: string[]): Promise<RelevanceClassification[]> {
    // In Phase 4, this will send a batch to Groq
    return texts.map(() => CLASSIFICATIONS.POTENTIALLY_RELEVANT);
  }
}

export const relevanceFilter = new RelevanceFilter();
