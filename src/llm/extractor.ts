import { llmClient } from './client';
import { EXTRACT_SYSTEM_PROMPT, EXTRACT_PROMPT_VERSION } from './prompts/extract-v1';

export class LLMExtractor {
  
  public async extract(text: string): Promise<any> {
    const userPrompt = `Extract structured data from this user conversation:\n\n"""\n${text}\n"""`;
    
    const result = await llmClient.getStructuredOutput<any>(
      EXTRACT_SYSTEM_PROMPT,
      userPrompt
    );
    
    // Add metadata about generation
    result.llm_model = llmClient.getModelName();
    result.llm_prompt_version = EXTRACT_PROMPT_VERSION;
    
    return result;
  }
}

export const llmExtractor = new LLMExtractor();
