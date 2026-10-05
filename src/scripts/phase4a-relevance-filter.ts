import fs from 'fs';
import path from 'path';
import { logger } from '../shared/logger';

const INPUT_FILE = path.join(__dirname, '../../relevant_reviews.json');
const OUTPUT_DIR = path.join(__dirname, '../../data/phase4');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const RELEVANT_FILE = path.join(OUTPUT_DIR, 'phase4a_relevant.json');
const POTENTIAL_FILE = path.join(OUTPUT_DIR, 'phase4a_potentially_relevant.json');
const IRRELEVANT_FILE = path.join(OUTPUT_DIR, 'phase4a_irrelevant.json');
const STATS_FILE = path.join(OUTPUT_DIR, 'phase4a_stats.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'phase4a_progress.json');

interface Review {
  id?: string;
  url?: string;
  title?: string;
  text?: string;
  score?: number;
  date?: string;
  source?: string;
  [key: string]: any;
}

interface ProcessedReview extends Review {
  classification_method: string;
  classification: 'relevant' | 'potentially_relevant' | 'irrelevant';
  reasoning: string;
  processed_at: string;
}

// Complex heuristics to replace the LLM
const POSITIVE_PATTERNS = [
  /can'?t\s+find/i,
  /search\s+doesn'?t/i,
  /search\s+is/i,
  /unable\s+to\s+locate/i,
  /find\s+a\s+(photo|picture|video|memory)/i,
  /looking\s+for\s+(a\s+)?(photo|picture)/i,
  /where\s+is\s+my\s+photo/i,
  /search\s+(result|results)/i,
  /face\s+recognition\s+(fail|doesn|not)/i,
  /remember\s+a\s+photo/i,
  /scroll(ing)?\s+(forever|endlessly|too\s+long)/i,
  /find\s+old\s+photo/i,
  /search\s+not\s+working/i
];

const NEGATIVE_PATTERNS = [
  /storage\s+(full|limit)/i,
  /pay\s+for/i,
  /buy\s+more/i,
  /subscription/i,
  /premium/i,
  /pricing/i,
  /Google\s+One/i,
  /back(\s+|-)?up/i,
  /sync/i,
  /locked\s+folder/i,
  /edit(ing)?/i,
  /magic\s+eraser/i,
  /share|sharing/i,
  /account/i,
  /download/i
];

function classifyReview(text: string): { classification: 'relevant' | 'potentially_relevant' | 'irrelevant', reasoning: string } {
  let positiveScore = 0;
  let negativeScore = 0;
  
  const reasons: string[] = [];

  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      positiveScore++;
      reasons.push(`Matched positive pattern: ${pattern.toString()}`);
    }
  }

  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(text)) {
      negativeScore++;
      reasons.push(`Matched negative pattern: ${pattern.toString()}`);
    }
  }

  if (positiveScore > 0 && negativeScore === 0) {
    return { classification: 'relevant', reasoning: reasons.join('; ') };
  } else if (positiveScore > 0 && negativeScore > 0) {
    // If it mentions both (e.g., searching AND backup), we mark it potentially relevant so we don't lose it
    return { classification: 'potentially_relevant', reasoning: 'Mixed signals: ' + reasons.join('; ') };
  } else if (positiveScore === 0 && text.toLowerCase().includes('search')) {
    // Mentions search but didn't trigger strong positive patterns
    return { classification: 'potentially_relevant', reasoning: 'Mentions search broadly' };
  } else {
    // No strong signals, or only negative signals
    return { classification: 'irrelevant', reasoning: reasons.length > 0 ? reasons.join('; ') : 'No retrieval signals detected' };
  }
}

async function run() {
  logger.info('Starting Phase 4A: Deep Relevance Filter (Code-based / No LLM)');

  if (!fs.existsSync(INPUT_FILE)) {
    logger.error(`Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const allReviews: Review[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  logger.info(`Loaded ${allReviews.length} reviews from ${INPUT_FILE}`);

  let processedIndices = new Set<number>();
  if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    processedIndices = new Set(progress.processedIndices || []);
    logger.info(`Resuming from progress: ${processedIndices.size} already processed`);
  }

  let relevant: ProcessedReview[] = [];
  let potential: ProcessedReview[] = [];
  let irrelevant: ProcessedReview[] = [];

  if (fs.existsSync(RELEVANT_FILE)) relevant = JSON.parse(fs.readFileSync(RELEVANT_FILE, 'utf-8'));
  if (fs.existsSync(POTENTIAL_FILE)) potential = JSON.parse(fs.readFileSync(POTENTIAL_FILE, 'utf-8'));
  if (fs.existsSync(IRRELEVANT_FILE)) irrelevant = JSON.parse(fs.readFileSync(IRRELEVANT_FILE, 'utf-8'));

  const itemsToProcess = allReviews
    .map((review, index) => ({ review, index }))
    .filter(({ index }) => !processedIndices.has(index));

  logger.info(`${itemsToProcess.length} reviews remaining to process`);

  if (itemsToProcess.length === 0) {
    logger.info('All reviews have been processed.');
    return;
  }

  // We can process extremely fast in pure code
  let count = 0;
  for (const item of itemsToProcess) {
    const textToAnalyze = item.review.cleaned_text || item.review.raw_text || item.review.text || item.review.content || item.review.review || '';
    
    if (!textToAnalyze.trim()) {
      irrelevant.push({
        ...item.review,
        classification_method: 'heuristic',
        classification: 'irrelevant',
        reasoning: 'Empty text',
        processed_at: new Date().toISOString()
      });
      processedIndices.add(item.index);
      continue;
    }

    const { classification, reasoning } = classifyReview(textToAnalyze);

    const processed: ProcessedReview = {
      ...item.review,
      id: item.review.id || `review_${item.index}`,
      classification_method: 'heuristic_v1',
      classification,
      reasoning,
      processed_at: new Date().toISOString()
    };

    if (classification === 'relevant') {
      relevant.push(processed);
    } else if (classification === 'potentially_relevant') {
      potential.push(processed);
    } else {
      irrelevant.push(processed);
    }

    processedIndices.add(item.index);
    count++;

    // Save checkpoints every 1000 items to avoid writing 13k times
    if (count % 1000 === 0) {
      fs.writeFileSync(RELEVANT_FILE, JSON.stringify(relevant, null, 2));
      fs.writeFileSync(POTENTIAL_FILE, JSON.stringify(potential, null, 2));
      fs.writeFileSync(IRRELEVANT_FILE, JSON.stringify(irrelevant, null, 2));
      
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        processedIndices: Array.from(processedIndices),
        lastUpdated: new Date().toISOString()
      }, null, 2));

      logger.info(`Processed ${count}/${itemsToProcess.length} records...`);
    }
  }

  // Final save
  fs.writeFileSync(RELEVANT_FILE, JSON.stringify(relevant, null, 2));
  fs.writeFileSync(POTENTIAL_FILE, JSON.stringify(potential, null, 2));
  fs.writeFileSync(IRRELEVANT_FILE, JSON.stringify(irrelevant, null, 2));
  
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    processedIndices: Array.from(processedIndices),
    lastUpdated: new Date().toISOString()
  }, null, 2));

  const stats = {
    total_processed: processedIndices.size,
    relevant_count: relevant.length,
    potentially_relevant_count: potential.length,
    irrelevant_count: irrelevant.length,
    last_updated: new Date().toISOString()
  };
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

  logger.info(stats, 'Phase 4A (Heuristic) completed successfully!');
}

run().catch((err) => {
  logger.error({ error: err }, 'Fatal error in Phase 4A');
  process.exit(1);
});
