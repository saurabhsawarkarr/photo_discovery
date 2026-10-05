import fs from 'fs';
import path from 'path';
import { llmClient } from '../llm/client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, PROMPT_VERSION } from '../llm/prompts/themes-v1';
import { logger } from '../shared/logger';

const AGGREGATION_FILE = path.join(__dirname, '../../data/phase4/phase4c_aggregation.json');
const OUTPUT_FILE = path.join(__dirname, '../../data/phase4/phase4d_themes.json');

async function runThemeDiscovery() {
  logger.info('Starting Phase 4D: Theme & Pain Point Discovery');

  if (!fs.existsSync(AGGREGATION_FILE)) {
    logger.error(`Input file not found: ${AGGREGATION_FILE}. Please run Phase 4C first.`);
    process.exit(1);
  }

  const aggregationData = JSON.parse(fs.readFileSync(AGGREGATION_FILE, 'utf-8'));
  logger.info('Loaded aggregated statistical patterns & evidence');

  const userPrompt = USER_PROMPT_TEMPLATE.replace('{aggregation_data}', JSON.stringify(aggregationData, null, 2));

  try {
    logger.info('Sending aggregation data to LLM to discover themes...');
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
    logger.info(`Successfully discovered ${output.themes?.length || 0} themes and ${output.pain_points?.length || 0} pain points!`);
    logger.info(`Saved to ${OUTPUT_FILE}`);
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to generate themes');
    process.exit(1);
  }
}

runThemeDiscovery();
