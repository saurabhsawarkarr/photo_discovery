import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import { logger } from '../shared/logger';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  logger.debug('Connected to Redis');
});

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
};

export const collectionQueue = new Queue('collection', defaultQueueOptions);
export const cleaningQueue = new Queue('cleaning', defaultQueueOptions);
export const classificationQueue = new Queue('classification', defaultQueueOptions);
export const extractionQueue = new Queue('extraction', defaultQueueOptions);
export const segmentationQueue = new Queue('segmentation', defaultQueueOptions);

// Function to gracefully close connections
export async function closeQueues() {
  await collectionQueue.close();
  await cleaningQueue.close();
  await classificationQueue.close();
  await extractionQueue.close();
  await segmentationQueue.close();
  connection.disconnect();
}
