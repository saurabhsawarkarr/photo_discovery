import { pool } from '../connection';
import { AnalysisResult, ProcessingStatus } from '../../shared/types';

export class AnalysisResultRepository {
  async insert(result: AnalysisResult): Promise<string> {
    const query = `
      INSERT INTO analysis_results (
        cleaned_record_id, record_id, source, source_url, source_date,
        is_relevant, retrieval_scenario, photo_type, occasion, location, people,
        activity, visual_details, time_period, memory_clues, forgotten_information,
        search_query, search_method, number_of_attempts, search_outcome, failure_point,
        failure_points, user_behaviour_after, workaround, final_outcome, frustration_signal,
        user_segment_signals, evidence_quote, confidence, llm_model, llm_prompt_version,
        processing_status, error_message, processed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      )
      RETURNING id;
    `;
    const values = [
      result.cleaned_record_id, result.record_id, result.source, result.source_url, result.source_date,
      result.is_relevant, result.retrieval_scenario, result.photo_type, result.occasion, result.location, result.people,
      result.activity, result.visual_details, result.time_period, result.memory_clues, result.forgotten_information,
      result.search_query, result.search_method, result.number_of_attempts, result.search_outcome, result.failure_point,
      result.failure_points, result.user_behaviour_after, result.workaround, result.final_outcome, result.frustration_signal,
      result.user_segment_signals, result.evidence_quote, result.confidence, result.llm_model, result.llm_prompt_version,
      result.processing_status, result.error_message, result.processed_at
    ];

    const res = await pool.query(query, values);
    return res.rows[0]?.id;
  }

  async updateStatus(id: string, status: ProcessingStatus, errorMessage?: string): Promise<void> {
    await pool.query(
      'UPDATE analysis_results SET processing_status = $1, error_message = $2 WHERE id = $3',
      [status, errorMessage || null, id]
    );
  }
}

export const analysisResultRepository = new AnalysisResultRepository();
