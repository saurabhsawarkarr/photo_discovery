import fs from 'fs';
import path from 'path';
import { logger } from '../shared/logger';

const JOURNEYS_FILE = path.join(__dirname, '../../data/phase4/phase4b_journeys.json');
const OUTPUT_DIR = path.join(__dirname, '../../data/phase4');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const AGGREGATION_FILE = path.join(OUTPUT_DIR, 'phase4c_aggregation.json');
const SUMMARY_FILE = path.join(OUTPUT_DIR, 'phase4c_summary.md');

function runAggregation() {
  logger.info('Starting Phase 4C: Pattern Aggregation');

  if (!fs.existsSync(JOURNEYS_FILE)) {
    logger.warn(`Input file not found: ${JOURNEYS_FILE}. Please wait for Phase 4B to generate journeys.`);
    return;
  }

  const journeys = JSON.parse(fs.readFileSync(JOURNEYS_FILE, 'utf-8'));
  logger.info(`Loaded ${journeys.length} extracted journeys`);

  if (journeys.length === 0) {
    logger.info('No journeys to aggregate yet.');
    return;
  }

  const result: any = {
    total_records: journeys.length,
    high_confidence_records: 0,
    failure_point_distribution: {},
    failure_cooccurrence: {},
    outcome_distribution: {},
    frustration_distribution: {},
    frustration_by_failure: {},
    top_evidence_per_failure: {}
  };

  // Maps for tracking co-occurrences
  const failurePairs: Record<string, number> = {};

  for (const journey of journeys) {
    if (journey.confidence >= 0.8) {
      result.high_confidence_records++;
    }

    // Process outcomes
    const outcome = journey.final_outcome || 'unknown';
    result.outcome_distribution[outcome] = (result.outcome_distribution[outcome] || 0) + 1;

    // Process frustration
    const frustration = journey.frustration_level || 'unknown';
    result.frustration_distribution[frustration] = (result.frustration_distribution[frustration] || 0) + 1;

    // Process failure points
    const points = journey.failure_points || [];
    for (const point of points) {
      // Basic count
      if (!result.failure_point_distribution[point]) {
        result.failure_point_distribution[point] = { count: 0, percentage: 0 };
        result.frustration_by_failure[point] = { low: 0, medium: 0, high: 0, unknown: 0 };
        result.top_evidence_per_failure[point] = [];
      }
      result.failure_point_distribution[point].count++;

      // Frustration mapping
      if (result.frustration_by_failure[point][frustration] !== undefined) {
        result.frustration_by_failure[point][frustration]++;
      }

      // Collect some top evidence quotes (up to 5 per failure point for now)
      if (result.top_evidence_per_failure[point].length < 5 && journey.evidence_quote) {
        result.top_evidence_per_failure[point].push({
          quote: journey.evidence_quote,
          source: journey.source,
          id: journey.record_id
        });
      }
    }

    // Co-occurrences (sort to avoid A+B and B+A split)
    if (points.length > 1) {
      const sortedPoints = [...points].sort();
      for (let i = 0; i < sortedPoints.length; i++) {
        for (let j = i + 1; j < sortedPoints.length; j++) {
          const pair = `${sortedPoints[i]}+${sortedPoints[j]}`;
          failurePairs[pair] = (failurePairs[pair] || 0) + 1;
        }
      }
    }
  }

  // Calculate percentages
  for (const point of Object.keys(result.failure_point_distribution)) {
    result.failure_point_distribution[point].percentage = 
      ((result.failure_point_distribution[point].count / journeys.length) * 100).toFixed(2);
  }

  // Finalize co-occurrences
  for (const pair of Object.keys(failurePairs)) {
    result.failure_cooccurrence[pair] = {
      count: failurePairs[pair],
      percentage: ((failurePairs[pair] / journeys.length) * 100).toFixed(2)
    };
  }

  // Write the comprehensive JSON
  fs.writeFileSync(AGGREGATION_FILE, JSON.stringify(result, null, 2));
  
  // Write a basic human-readable markdown summary
  let summary = `# Phase 4C: Aggregation Summary\n\n`;
  summary += `**Total Extracted Journeys:** ${result.total_records}\n`;
  summary += `**High Confidence:** ${result.high_confidence_records}\n\n`;
  summary += `## Failure Point Distribution\n`;
  for (const point of Object.keys(result.failure_point_distribution)) {
    const data = result.failure_point_distribution[point];
    summary += `- **${point}**: ${data.count} (${data.percentage}%)\n`;
  }
  
  fs.writeFileSync(SUMMARY_FILE, summary);

  logger.info('Phase 4C completed successfully!');
}

runAggregation();
