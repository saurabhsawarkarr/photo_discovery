import { Job } from 'bullmq';
import { pool } from '../db/connection';
import { batchManager } from '../llm/batch-manager';
import { llmExtractor } from '../llm/extractor';
import { analysisResultRepository } from '../db/repositories/analysis-results';
import { logger } from '../shared/logger';
import { CLASSIFICATIONS } from '../shared/constants';

export async function processExtractionJob(job: Job) {
  const { batchSize } = job.data;
  
  logger.info({ jobId: job.id }, 'Processing extraction job');

  // Fetch relevant and potentially_relevant records that haven't been extracted yet
  const result = await pool.query(`
    SELECT c.id as cleaned_record_id, c.record_id, c.source, c.source_url, c.source_date, c.cleaned_text 
    FROM cleaned_records c
    JOIN relevance_classifications rc ON c.id = rc.cleaned_record_id
    LEFT JOIN analysis_results ar ON c.id = ar.cleaned_record_id
    WHERE rc.classification IN ($1, $2) AND ar.id IS NULL
    LIMIT $3
  `, [CLASSIFICATIONS.RELEVANT, CLASSIFICATIONS.POTENTIALLY_RELEVANT, batchSize || 50]);

  const records = result.rows;

  if (records.length === 0) {
    logger.info('No records to extract');
    return { processedCount: 0 };
  }

  // Process in batches via the batch manager
  const results = await batchManager.processInBatches(records, async (batch) => {
    const batchResults = [];
    
    for (const record of batch) {
      try {
        const extracted = await llmExtractor.extract(record.cleaned_text);
        
        // Merge DB fields with extracted JSON
        const finalResult = {
          ...extracted,
          cleaned_record_id: record.cleaned_record_id,
          record_id: record.record_id,
          source: record.source,
          source_url: record.source_url,
          source_date: record.source_date,
          processing_status: 'completed',
          processed_at: new Date()
        };

        const id = await analysisResultRepository.insert(finalResult);
        batchResults.push(id);
      } catch (err: any) {
        logger.error({ recordId: record.record_id, error: err.message }, 'Failed to extract record');
        
        // Save failed status
        await analysisResultRepository.insert({
          cleaned_record_id: record.cleaned_record_id,
          record_id: record.record_id,
          source: record.source,
          source_url: record.source_url,
          source_date: record.source_date,
          processing_status: 'failed',
          error_message: err.message,
          processed_at: new Date()
        } as any);
      }
    }
    
    return batchResults;
  });

  logger.info({ processedCount: results.length }, 'Extraction job complete');
  return { processedCount: results.length };
}
