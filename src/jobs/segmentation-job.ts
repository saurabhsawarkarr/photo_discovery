import { Job } from 'bullmq';
import { pool } from '../db/connection';
import { llmSegmenter } from '../llm/segmenter';
import { logger } from '../shared/logger';

export async function processSegmentationJob(job: Job) {
  logger.info({ jobId: job.id }, 'Processing segmentation job');

  // 1. Aggregate analysis results from the DB
  const aggregatedData = await aggregateAnalysisData();
  
  // 2. Send to LLM Segmenter
  await llmSegmenter.generateSegments(aggregatedData);

  logger.info('Segmentation job complete');
  return { status: 'completed' };
}

async function aggregateAnalysisData() {
  // Aggregate by failure point
  const failurePoints = await pool.query(`
    SELECT failure_point, COUNT(*) as count 
    FROM analysis_results 
    WHERE processing_status = 'completed' AND failure_point IS NOT NULL
    GROUP BY failure_point
    ORDER BY count DESC
  `);

  // Aggregate by behavior
  const behaviours = await pool.query(`
    SELECT user_behaviour_after, COUNT(*) as count 
    FROM analysis_results 
    WHERE processing_status = 'completed' AND user_behaviour_after IS NOT NULL
    GROUP BY user_behaviour_after
    ORDER BY count DESC
    LIMIT 20
  `);

  // Sample raw evidence for context
  const samples = await pool.query(`
    SELECT record_id, failure_point, evidence_quote 
    FROM analysis_results 
    WHERE processing_status = 'completed' AND evidence_quote IS NOT NULL
    LIMIT 50
  `);

  return {
    totalAnalyzed: await pool.query(`SELECT COUNT(*) FROM analysis_results WHERE processing_status = 'completed'`).then(r => parseInt(r.rows[0].count)),
    failurePointDistribution: failurePoints.rows,
    commonBehaviours: behaviours.rows,
    evidenceSamples: samples.rows
  };
}
