import { Job } from 'bullmq';
import { registry } from '../collectors/registry';
import { rawRecordRepository } from '../db/repositories/raw-records';
import { logger } from '../shared/logger';
import { collectionQueue } from './queue';

export async function processCollectionJob(job: Job) {
  const { source, options } = job.data;
  
  logger.info({ jobId: job.id, source }, 'Processing collection job');
  
  try {
    const collector = registry.get(source);
    const result = await collector.collect(options);
    
    let inserted = 0;
    for (const record of result.records) {
      const id = await rawRecordRepository.insert(record);
      if (id) inserted++;
    }

    // Update job progress
    await job.updateProgress(100);

    // If there is more data, queue the next batch
    if (result.hasMore && result.nextCursor) {
      logger.info({ source, nextCursor: result.nextCursor }, 'Queueing next collection batch');
      await collectionQueue.add('collect_batch', {
        source,
        options: {
          ...options,
          cursor: result.nextCursor
        }
      });
    }

    return { 
      totalCollected: result.totalCollected,
      totalInserted: inserted,
      hasMore: result.hasMore 
    };

  } catch (error) {
    logger.error({ jobId: job.id, source, error }, 'Collection job failed');
    throw error;
  }
}
