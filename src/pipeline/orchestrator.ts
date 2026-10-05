import { collectionQueue, cleaningQueue, classificationQueue, extractionQueue, segmentationQueue } from '../jobs/queue';
import { pool } from '../db/connection';
import { SOURCES } from '../shared/constants';

export class PipelineOrchestrator {
  
  public async triggerFullPipeline() {
    // 1. Trigger Collection for all sources
    const sources = Object.values(SOURCES).filter(s => s !== SOURCES.OTHER);
    for (const source of sources) {
      await collectionQueue.add('collect_batch', { source, options: { batchSize: 50 } });
    }

    // Since these queues process independently, we can schedule dependent steps
    // with some delay, or rely on event completion to trigger the next phase.
    // For now, we queue them all and let BullMQ workers process when data is available.

    // 2. Trigger Cleaning
    await cleaningQueue.add('clean_batch', { batchSize: 200 });

    // 3. Trigger Classification
    await classificationQueue.add('classify_batch', { batchSize: 200 });

    // 4. Trigger Extraction
    await extractionQueue.add('extract_batch', { batchSize: 20 });

    // 5. Trigger Segmentation
    await segmentationQueue.add('segment_batch', {});
  }

  public async getPipelineStatus() {
    // Query job status and queue depths
    const counts = {
      raw: await pool.query('SELECT COUNT(*) FROM raw_records').then(res => parseInt(res.rows[0].count)),
      cleaned: await pool.query('SELECT COUNT(*) FROM cleaned_records').then(res => parseInt(res.rows[0].count)),
      classified: await pool.query('SELECT COUNT(*) FROM relevance_classifications').then(res => parseInt(res.rows[0].count)),
      analyzed: await pool.query('SELECT COUNT(*) FROM analysis_results').then(res => parseInt(res.rows[0].count)),
    };

    return {
      status: 'active',
      records: counts
    };
  }
}

export const orchestrator = new PipelineOrchestrator();
