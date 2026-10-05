import { Job } from 'bullmq';
import { pool } from '../db/connection';
import { cleaner } from '../pipeline/cleaner';
import { deduplicator } from '../pipeline/deduplicator';
import { cleanedRecordRepository } from '../db/repositories/cleaned-records';
import { logger } from '../shared/logger';
import { RawRecord } from '../shared/types';

export async function processCleaningJob(job: Job) {
  const { batchSize } = job.data;
  
  logger.info({ jobId: job.id }, 'Processing cleaning job');

  // Fetch unprocessed raw records
  const result = await pool.query(`
    SELECT r.* FROM raw_records r
    LEFT JOIN cleaned_records c ON r.id = c.raw_record_id
    WHERE c.id IS NULL
    LIMIT $1
  `, [batchSize || 100]);

  const rawRecords: RawRecord[] = result.rows;

  let processedCount = 0;
  let deduplicatedCount = 0;
  let skippedCount = 0;

  for (const raw of rawRecords) {
    // 1. Clean
    const cleanResult = cleaner.clean(raw.raw_text);

    if (!cleanResult.isValid) {
      skippedCount++;
      // We could store it anyway with a flag, but instruction says "flagged as skip"
      // For full traceability, we still insert it but mark it skipped in metadata
      cleanResult.meta.skipped = true;
    }

    // 2. Dedup
    const isDup = await deduplicator.isDuplicate(cleanResult.cleanedText, raw.source);
    if (isDup) deduplicatedCount++;

    // 3. Store
    await cleanedRecordRepository.insert({
      raw_record_id: raw.id!,
      record_id: raw.record_id,
      cleaned_text: cleanResult.cleanedText,
      source: raw.source,
      source_url: raw.source_url,
      source_date: raw.source_date,
      collection_date: raw.collection_date,
      language: cleanResult.language,
      is_duplicate: isDup,
      cleaning_meta: cleanResult.meta
    });

    processedCount++;
  }

  logger.info({ 
    processedCount, 
    deduplicatedCount,
    skippedCount 
  }, 'Cleaning job complete');

  return { processedCount, deduplicatedCount, skippedCount };
}
