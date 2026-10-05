import { llmClient } from './client';
import { SEGMENT_SYSTEM_PROMPT, SEGMENT_PROMPT_VERSION } from './prompts/segment-v1';
import { Segment } from '../shared/types';
import { segmentRepository } from '../db/repositories/segments';
import { logger } from '../shared/logger';

interface SegmentResponse {
  segments: {
    segment_id: string;
    segment_name: string;
    segment_description: string;
    dominant_failure_points: string[];
    dominant_behaviours: string[];
    frustration_profile: Record<string, number>;
    evidence_record_ids: string[];
  }[];
}

export class LLMSegmenter {
  
  public async generateSegments(aggregatedData: any): Promise<void> {
    const userPrompt = `Here is the aggregated data from user conversations:\n\n${JSON.stringify(aggregatedData, null, 2)}`;
    
    logger.info('Sending aggregated data to LLM for segmentation');
    const result = await llmClient.getStructuredOutput<SegmentResponse>(
      SEGMENT_SYSTEM_PROMPT,
      userPrompt
    );

    const modelName = llmClient.getModelName();

    for (const seg of result.segments) {
      const segmentData: Segment = {
        segment_id: seg.segment_id,
        segment_name: seg.segment_name,
        segment_description: seg.segment_description,
        evidence_count: seg.evidence_record_ids?.length || 0,
        source_distribution: {}, // Could be computed if we pass sources back
        dominant_failure_points: seg.dominant_failure_points,
        dominant_behaviours: seg.dominant_behaviours,
        frustration_profile: seg.frustration_profile,
        llm_model: modelName
      };

      // 1. Insert segment
      const insertedId = await segmentRepository.insert(segmentData);

      // 2. Link evidence (Mocking finding internal analysis_id by record_id)
      // For full implementation, we'd look up the UUID in analysis_results table using the record_id
      logger.info({ segmentName: seg.segment_name, count: seg.evidence_record_ids?.length }, 'Stored segment');
    }
  }
}

export const llmSegmenter = new LLMSegmenter();
