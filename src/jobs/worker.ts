import { Worker, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import { logger } from '../shared/logger';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const defaultWorkerOptions: Omit<WorkerOptions, 'connection'> = {
  concurrency: 1, // Override per worker
};

export function createWorker(queueName: string, processor: any, concurrency: number = 1): Worker {
  const worker = new Worker(queueName, processor, {
    connection,
    ...defaultWorkerOptions,
    concurrency,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queueName }, 'Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queueName, err }, 'Job failed');
  });

  return worker;
}
