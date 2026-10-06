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

router.post('/collect', async (req, res, next) => {
  try {
    const { source } = req.body;
    await orchestrator.triggerCollection(source);
    res.json({ message: 'Collection triggered' });
  } catch (error) {
    next(error);
  }
});

router.post('/clean', async (req, res, next) => {
  try {
    await orchestrator.triggerCleaning();
    res.json({ message: 'Cleaning triggered' });
  } catch (error) {
    next(error);
  }
});

router.post('/classify', async (req, res, next) => {
  try {
    await orchestrator.triggerClassification();
    res.json({ message: 'Classification triggered' });
  } catch (error) {
    next(error);
  }
});

router.post('/analyze', async (req, res, next) => {
  try {
    await orchestrator.triggerExtraction();
    res.json({ message: 'Analysis extraction triggered' });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-segments', async (req, res, next) => {
  try {
    await orchestrator.triggerSegmentation();
    res.json({ message: 'Segmentation triggered' });
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
