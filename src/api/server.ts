import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from '../shared/logger';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { collectionQueue, cleaningQueue, classificationQueue, extractionQueue, segmentationQueue } from '../jobs/queue';

// Routes
import dashboardRoutes from './routes/dashboard';
import evidenceRoutes from './routes/evidence';
import segmentRoutes from './routes/segments';
import pipelineRoutes from './routes/pipeline';

const app = express();
const port = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger: logger as any }));

// Setup Bull Board for Queue Monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(collectionQueue),
    new BullMQAdapter(cleaningQueue),
    new BullMQAdapter(classificationQueue),
    new BullMQAdapter(extractionQueue),
    new BullMQAdapter(segmentationQueue),
  ],
  // @ts-ignore - Ignore type mismatch caused by legacy-peer-deps version drift
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Register API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/pipeline', pipelineRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, req }, 'Unhandled API Error');
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

export function startServer() {
  app.listen(port, () => {
    logger.info({ port }, 'API Server listening on port');
    logger.info(`Bull Board available at http://localhost:${port}/admin/queues`);
  });
}
