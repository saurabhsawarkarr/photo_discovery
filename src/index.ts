import { logger } from './shared/logger';
import { startServer } from './api/server';
import './jobs/worker'; // Import to start all workers

async function bootstrap() {
  logger.info('Starting Google Photos AI Discovery Engine...');
  
  // Start the REST API and Bull Board
  startServer();
  
  logger.info('All workers and servers initialized successfully');
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start application');
  process.exit(1);
});
