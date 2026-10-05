import fs from 'fs';
import path from 'path';
import { llmClient } from '../llm/client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, PROMPT_VERSION } from '../llm/prompts/segments-v1';
import { logger } from '../shared/logger';

const AGGREGATION_FILE = path.join(__dirname, '../../data/phase4/phase4c_aggregation.json');
const THEMES_FILE = path.join(__dirname, '../../data/phase4/phase4d_themes.json');
const OUTPUT_FILE = path.join(__dirname, '../../data/phase4/phase4e_segments.json');

async function runSegmentSynthesis() {
  logger.info('Starting Phase 4E: User Segment Synthesis');

  if (!fs.existsSync(AGGREGATION_FILE) || !fs.existsSync(THEMES_FILE)) {
    logger.error('Input files not found. Please run Phase 4C and 4D first.');
    process.exit(1);
  }

  const aggregationData = JSON.parse(fs.readFileSync(AGGREGATION_FILE, 'utf-8'));
  const themesData = JSON.parse(fs.readFileSync(THEMES_FILE, 'utf-8'));
  logger.info('Loaded aggregated patterns and themes');

  let userPrompt = USER_PROMPT_TEMPLATE.replace('{aggregation_data}', JSON.stringify(aggregationData, null, 2));
  userPrompt = userPrompt.replace('{themes_data}', JSON.stringify(themesData, null, 2));

  try {
    logger.info('Sending data to LLM to synthesize user segments...');
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
    logger.info(`Successfully synthesized ${output.segments?.length || 0} user segments!`);
    logger.info(`Saved to ${OUTPUT_FILE}`);
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to synthesize segments');
    process.exit(1);
  }
}

runSegmentSynthesis();
