import fs from 'fs';
import path from 'path';
import { llmClient } from '../llm/client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, PROMPT_VERSION } from '../llm/prompts/hypotheses-v1';
import { logger } from '../shared/logger';

const AGGREGATION_FILE = path.join(__dirname, '../../data/phase4/phase4c_aggregation.json');
const THEMES_FILE = path.join(__dirname, '../../data/phase4/phase4d_themes.json');
const SEGMENTS_FILE = path.join(__dirname, '../../data/phase4/phase4e_segments.json');
const OUTPUT_FILE = path.join(__dirname, '../../data/phase4/phase4f_hypotheses.json');

async function runHypothesisGeneration() {
  logger.info('Starting Phase 4F: Hypothesis Generation');

  if (!fs.existsSync(AGGREGATION_FILE) || !fs.existsSync(THEMES_FILE) || !fs.existsSync(SEGMENTS_FILE)) {
    logger.error('Input files not found. Please ensure Phase 4C, 4D, and 4E have run.');
    process.exit(1);
  }

  const aggregationData = JSON.parse(fs.readFileSync(AGGREGATION_FILE, 'utf-8'));
  const themesData = JSON.parse(fs.readFileSync(THEMES_FILE, 'utf-8'));
  const segmentsData = JSON.parse(fs.readFileSync(SEGMENTS_FILE, 'utf-8'));
  
  logger.info('Loaded data from previous phases');

  let userPrompt = USER_PROMPT_TEMPLATE.replace('{aggregation_data}', JSON.stringify(aggregationData, null, 2));
  userPrompt = userPrompt.replace('{themes_data}', JSON.stringify(themesData, null, 2));
  userPrompt = userPrompt.replace('{segments_data}', JSON.stringify(segmentsData, null, 2));

  try {
    logger.info('Sending data to LLM to generate testable hypotheses...');
    const result = await llmClient.getStructuredOutput<any>(
      SYSTEM_PROMPT,
      userPrompt
    );

    const output = {
      ...result,
      metadata: {
        llm_model: llmClient.getModelName(),
        llm_prompt_version: PROMPT_VERSION,
        processed_at: new Date().toISOString()
      }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    logger.info(`Successfully generated ${output.hypotheses?.length || 0} research hypotheses!`);
    logger.info(`Saved to ${OUTPUT_FILE}`);
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to generate hypotheses');
    process.exit(1);
  }
}

runHypothesisGeneration();
