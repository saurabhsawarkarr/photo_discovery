import { ISourceCollector, CollectionOptions, CollectionResult } from './interfaces';
import { RawRecord } from '../shared/types';
import { logger } from '../shared/logger';
import { generateRecordId } from '../shared/utils';

export abstract class BaseCollector implements ISourceCollector {
  public abstract readonly sourceName: string;

  abstract testConnection(): Promise<boolean>;
  
  protected abstract fetchBatch(options: CollectionOptions): Promise<CollectionResult>;

  public async collect(options: CollectionOptions): Promise<CollectionResult> {
    try {
      logger.info({ source: this.sourceName, options }, 'Starting collection batch');
      
      const result = await this.fetchBatch(options);
      
      logger.info({ 
        source: this.sourceName, 
        collectedCount: result.records.length,
        hasMore: result.hasMore 
      }, 'Completed collection batch');
      
      return result;
    } catch (error) {
      logger.error({ source: this.sourceName, error, options }, 'Error during collection batch');
      throw error;
    }
  }

  protected createRawRecord(
    rawText: string, 
    sourceUrl: string | null, 
    sourceDate: Date | null,
    rating: number | null,
    reviewerMeta: Record<string, any> | null,
    collectorMeta: Record<string, any> = {}
  ): RawRecord {
    const recordId = generateRecordId(this.sourceName, sourceUrl, rawText);
    
    return {
      record_id: recordId,
      source: this.sourceName,
      source_url: sourceUrl,
      source_date: sourceDate,
      collection_date: new Date(),
      raw_text: rawText,
      language: null, // Language detection happens in cleaning phase
      rating,
      reviewer_meta: reviewerMeta,
      collector_meta: {
        ...collectorMeta,
        scraper_version: '1.0.0'
      }
    };
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
