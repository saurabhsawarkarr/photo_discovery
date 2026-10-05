import { Job } from 'bullmq';
import { pool } from '../db/connection';
import { relevanceFilter } from '../pipeline/relevance-filter';
import { logger } from '../shared/logger';
import { CLASSIFICATIONS } from '../shared/constants';

export async function processClassificationJob(job: Job) {
  const { batchSize } = job.data;
  
  logger.info({ jobId: job.id }, 'Processing classification job');

  // Fetch unclassified cleaned records
  const result = await pool.query(`
    SELECT c.id, c.cleaned_text FROM cleaned_records c
    LEFT JOIN relevance_classifications rc ON c.id = rc.cleaned_record_id
    WHERE rc.id IS NULL AND c.is_duplicate = FALSE
    LIMIT $1
  `, [batchSize || 100]);

  const records = result.rows;
  let pass1RelevantCount = 0;
  let pass1IrrelevantCount = 0;

  for (const record of records) {
    const classification = relevanceFilter.pass1Classify(record.cleaned_text);
    
    if (classification === CLASSIFICATIONS.IRRELEVANT) pass1IrrelevantCount++;
    else pass1RelevantCount++;

    // Store Pass 1 classification
    await pool.query(`
      INSERT INTO relevance_classifications (cleaned_record_id, classification, classification_method, confidence)
      VALUES ($1, $2, 'keyword', 1.0)
    `, [record.id, classification]);
  }

  // Phase 4: Pass 2 (LLM) will be executed on POTENTIALLY_RELEVANT records

  logger.info({ pass1RelevantCount, pass1IrrelevantCount }, 'Classification job complete');

  return { processedCount: records.length, pass1RelevantCount, pass1IrrelevantCount };
}
