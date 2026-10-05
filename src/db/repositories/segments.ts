import { pool } from '../connection';
import { Segment } from '../../shared/types';

export class SegmentRepository {
  async insert(segment: Segment): Promise<string> {
    const query = `
      INSERT INTO segments (
        segment_id, segment_name, segment_description, evidence_count,
        source_distribution, dominant_failure_points, dominant_behaviours,
        frustration_profile, llm_model
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (segment_id) DO UPDATE SET
        evidence_count = EXCLUDED.evidence_count,
        source_distribution = EXCLUDED.source_distribution
      RETURNING id;
    `;
    const values = [
      segment.segment_id,
      segment.segment_name,
      segment.segment_description,
      segment.evidence_count,
      segment.source_distribution,
      segment.dominant_failure_points,
      segment.dominant_behaviours,
      segment.frustration_profile,
      segment.llm_model
    ];

    const result = await pool.query(query, values);
    return result.rows[0]?.id;
  }

  async linkEvidence(segmentId: string, analysisId: string, relevanceNote?: string): Promise<void> {
    const query = `
      INSERT INTO segment_evidence (segment_id, analysis_id, relevance_note)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [segmentId, analysisId, relevanceNote || null]);
  }
}

export const segmentRepository = new SegmentRepository();
