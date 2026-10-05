import { llmClient } from './client';
import { CLASSIFY_SYSTEM_PROMPT, CLASSIFY_PROMPT_VERSION } from './prompts/classify-v1';
import { RelevanceClassification } from '../shared/types';
import { CLASSIFICATIONS } from '../shared/constants';

interface LLMClassificationResponse {
  classification: RelevanceClassification;
  confidence: number;
  reasoning: string;
}

export class LLMClassifier {
  
  public async classifyRecord(text: string): Promise<LLMClassificationResponse> {
    const userPrompt = `Classify this user conversation:\n\n"""\n${text}\n"""`;
    
    try {
      const result = await llmClient.getStructuredOutput<LLMClassificationResponse>(
        CLASSIFY_SYSTEM_PROMPT,
        userPrompt
      );
      return result;
    } catch (error) {
      // If it completely fails, fallback to potentially_relevant to not lose data
      return {
        classification: CLASSIFICATIONS.POTENTIALLY_RELEVANT,
        confidence: 0,
        reasoning: "LLM classification failed"
      };
    }
  }

}

export const llmClassifier = new LLMClassifier();
