export type FailurePoint = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'unknown' | 'multiple';

export type RelevanceClassification = 'relevant' | 'potentially_relevant' | 'irrelevant';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry';

export type FinalOutcome = 'found' | 'not_found' | 'abandoned' | 'unknown';

export type FrustrationSignal = 'low' | 'medium' | 'high' | 'unknown';

export interface RawRecord {
  id?: string;
  record_id: string;
  source: string;
  source_url: string | null;
  source_date: Date | null;
  collection_date: Date;
  raw_text: string;
  language: string | null;
  rating: number | null;
  reviewer_meta: Record<string, any> | null;
  collector_meta: Record<string, any>;
  created_at?: Date;
}

export interface CleanedRecord {
  id?: string;
  raw_record_id: string;
  record_id: string;
  cleaned_text: string;
  source: string;
  source_url: string | null;
  source_date: Date | null;
  collection_date: Date | null;
  language: string | null;
  is_duplicate: boolean;
  cleaning_meta: Record<string, any> | null;
  created_at?: Date;
}

export interface AnalysisResult {
  id?: string;
  cleaned_record_id: string;
  record_id: string;
  source: string;
  source_url: string | null;
  source_date: Date | null;
  
  is_relevant: boolean | null;
  retrieval_scenario: string | null;
  
  photo_type: string | null;
  occasion: string | null;
  location: string | null;
  people: string | null;
  activity: string | null;
  visual_details: string | null;
  time_period: string | null;
  
  memory_clues: string[] | null;
  forgotten_information: string[] | null;
  
  search_query: string | null;
  search_method: string | null;
  number_of_attempts: number | null;
  
  search_outcome: string | null;
  failure_point: FailurePoint | null;
  failure_points: string[] | null;
  user_behaviour_after: string | null;
  workaround: string | null;
  final_outcome: FinalOutcome | null;
  frustration_signal: FrustrationSignal | null;
  user_segment_signals: string[] | null;
  evidence_quote: string | null;
  confidence: number | null;
  
  llm_model: string | null;
  llm_prompt_version: string | null;
  processing_status: ProcessingStatus;
  error_message: string | null;
  processed_at: Date | null;
  created_at?: Date;
}

export interface Segment {
  id?: string;
  segment_id: string;
  segment_name: string;
  segment_description: string;
  evidence_count: number | null;
  source_distribution: Record<string, number> | null;
  dominant_failure_points: string[] | null;
  dominant_behaviours: string[] | null;
  frustration_profile: Record<string, number> | null;
  llm_model: string | null;
  generated_at?: Date;
}

export interface ProcessingJob {
  id?: string;
  job_type: string;
  source: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_records: number | null;
  processed_count: number;
  failed_count: number;
  error_log: Record<string, any> | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at?: Date;
}
