import { RawRecord } from '../shared/types';

export interface CollectionOptions {
  batchSize?: number;
  maxRecords?: number;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  cursor?: string;
  [key: string]: any;
}

export interface CollectionResult {
  records: RawRecord[];
  nextCursor?: string;
  hasMore: boolean;
  totalCollected: number;
}

export interface ISourceCollector {
  readonly sourceName: string;
  
  /**
   * Test connection to the source API/scraper
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Collect a batch of records
   */
  collect(options: CollectionOptions): Promise<CollectionResult>;
}
