import { Router } from 'express';
import { orchestrator } from '../../pipeline/orchestrator';

const router = Router();

router.post('/start', async (req, res, next) => {
  try {
    await orchestrator.triggerFullPipeline();
    res.json({ message: 'Pipeline triggered successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const status = await orchestrator.getPipelineStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;
