import fs from 'fs';
import path from 'path';
import { llmClient } from '../llm/client';
import { batchManager } from '../llm/batch-manager';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, PROMPT_VERSION } from '../llm/prompts/journey-extract-v1';
import { logger } from '../shared/logger';

const INPUT_FILE = path.join(__dirname, '../../data/phase4/phase4a_relevant.json');
const OUTPUT_DIR = path.join(__dirname, '../../data/phase4');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const JOURNEYS_FILE = path.join(OUTPUT_DIR, 'phase4b_journeys.json');
const FAILED_FILE = path.join(OUTPUT_DIR, 'phase4b_failed.json');
const STATS_FILE = path.join(OUTPUT_DIR, 'phase4b_stats.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'phase4b_progress.json');

interface ExtractedJourney {
  record_id: string;
  source: string;
  source_url: string;
  original_text: string;
  retrieval_scenario: string;
  what_user_remembers: any;
  what_user_forgot: string[];
  search_journey: any;
  search_outcome: string;
  failure_points: string[];
  failure_description: string;
  user_behaviour_after: string;
  workaround: string | null;
  final_outcome: string;
  frustration_level: string;
  frustration_signals: string[];
  user_segment_signals: string[];
  evidence_quote: string;
  confidence: number;
}

async function run() {
  logger.info('Starting Phase 4B: User Journey Extraction');

  if (!fs.existsSync(INPUT_FILE)) {
    logger.warn(`Input file not found: ${INPUT_FILE}. Please wait for Phase 4A to generate relevant records.`);
    process.exit(0); // Exit gracefully if 4A hasn't produced anything yet
  }

  const relevantReviews = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  logger.info(`Loaded ${relevantReviews.length} relevant reviews from Phase 4A`);

  let processedIds = new Set<string>();
  if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    processedIds = new Set(progress.processedIds || []);
    logger.info(`Resuming from progress: ${processedIds.size} already processed`);
  }

  let journeys: ExtractedJourney[] = [];
  let failedReviews: any[] = [];

  if (fs.existsSync(JOURNEYS_FILE)) journeys = JSON.parse(fs.readFileSync(JOURNEYS_FILE, 'utf-8'));
  if (fs.existsSync(FAILED_FILE)) failedReviews = JSON.parse(fs.readFileSync(FAILED_FILE, 'utf-8'));

  const itemsToProcess = relevantReviews.filter((r: any) => !processedIds.has(r.id));
  logger.info(`${itemsToProcess.length} reviews remaining to process`);

  if (itemsToProcess.length === 0) {
    logger.info('All currently available relevant reviews have been processed for journeys.');
    return;
  }

  await batchManager.processInBatches(itemsToProcess, async (batch) => {
    const results = [];

    for (const review of batch as any[]) {
      const textToAnalyze = review.cleaned_text || review.raw_text || review.text || review.content || '';
      
      if (!textToAnalyze.trim()) {
        processedIds.add(review.id);
        continue;
      }

      const userPrompt = USER_PROMPT_TEMPLATE.replace('{text}', textToAnalyze);
      
      try {
        const extraction = await llmClient.getStructuredOutput<any>(
          SYSTEM_PROMPT,
          userPrompt
        );

        const fullJourney: ExtractedJourney = {
          ...extraction,
          record_id: review.id,
          source: review.source || review.region ? 'app_store' : 'play_store',
          source_url: review.source_url || review.url || '',
          original_text: textToAnalyze,
          llm_model: llmClient.getModelName(),
          llm_prompt_version: PROMPT_VERSION,
        };

        journeys.push(fullJourney);
        processedIds.add(review.id);
        results.push(fullJourney);
      } catch (err: any) {
        logger.error({ id: review.id, error: err.message }, 'Failed to extract journey');
        failedReviews.push({ review, error: err.message });
        processedIds.add(review.id); // Mark as processed so we don't infinitely retry failed ones
      }
      
      // Wait between individual calls to respect rate limit for deep extractions
      await new Promise(r => setTimeout(r, 2000));
    }

    fs.writeFileSync(JOURNEYS_FILE, JSON.stringify(journeys, null, 2));
    fs.writeFileSync(FAILED_FILE, JSON.stringify(failedReviews, null, 2));
    
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
      processedIds: Array.from(processedIds),
      lastUpdated: new Date().toISOString()
    }, null, 2));

    const stats = {
      total_processed: processedIds.size,
      journeys_extracted: journeys.length,
      failed_extractions: failedReviews.length,
      last_updated: new Date().toISOString()
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    
    logger.info(stats, 'Batch completed & checkpoint saved');
    return results;
  });

  logger.info('Phase 4B incremental run completed successfully!');
}

run().catch((err) => {
  logger.error({ error: err }, 'Fatal error in Phase 4B');
  process.exit(1);
});
