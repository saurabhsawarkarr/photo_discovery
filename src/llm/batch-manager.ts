import { logger } from '../shared/logger';

export class BatchManager {
  private batchSize: number;

  constructor() {
    this.batchSize = parseInt(process.env.LLM_BATCH_SIZE || '15', 10);
  }

  /**
   * Chunks an array of items into smaller batches of a specific size.
   */
  public chunk<T>(items: T[]): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      chunks.push(items.slice(i, i + this.batchSize));
    }
    return chunks;
  }

  /**
   * Processes an array of items using a processor function, respecting batch limits.
   * Processes batches sequentially to avoid hitting rate limits.
   */
  public async processInBatches<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>): Promise<R[]> {
    const chunks = this.chunk(items);
    const results: R[] = [];

    for (let i = 0; i < chunks.length; i++) {
      logger.info({ batch: i + 1, totalBatches: chunks.length, size: chunks[i].length }, 'Processing batch');
      try {
        const batchResults = await processor(chunks[i]);
        results.push(...batchResults);
        
        // Wait between batches to respect rate limits (unless it's the last batch)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err: any) {
        logger.error({ batch: i + 1, error: err.message }, 'Batch processing failed');
        // Depending on design, we might want to throw or just continue. 
        // For pipeline reliability, failing the job is safer so it retries.
        throw err;
      }
    }

    return results;
  }
}

export const batchManager = new BatchManager();
