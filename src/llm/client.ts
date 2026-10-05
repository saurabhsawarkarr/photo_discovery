import Groq from 'groq-sdk';
import { logger } from '../shared/logger';
import * as dotenv from 'dotenv';

dotenv.config();

export class LLMClient {
  private groq: Groq;
  private model: string;
  private maxRetries: number;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.maxRetries = parseInt(process.env.LLM_MAX_RETRIES || '3', 10);
  }

  public getModelName(): string {
    return this.model;
  }

  /**
   * Send a prompt to Groq and ensure JSON output.
   */
  public async getStructuredOutput<T>(
    systemPrompt: string, 
    userPrompt: string, 
    attempt = 1
  ): Promise<T> {
    try {
      logger.debug({ model: this.model, attempt }, 'Sending request to Groq');
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: this.model,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Groq');
      }

      return JSON.parse(content) as T;

    } catch (error: any) {
      if (attempt < this.maxRetries) {
        const delay = attempt * 5000; // 5s, 10s
        logger.warn({ error: error.message, attempt, retryIn: delay }, 'LLM request failed, retrying');
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getStructuredOutput<T>(systemPrompt, userPrompt, attempt + 1);
      }
      
      logger.error({ error, attempt }, 'LLM request failed permanently');
      throw error;
    }
  }
}

export const llmClient = new LLMClient();
