import { FailurePoint, ProcessingStatus, RelevanceClassification } from './types';

export const FAILURE_POINTS: Record<string, FailurePoint> = {
  MEMORY_EXPRESSION: 'A',
  QUERY_FORMULATION: 'B',
  SEARCH_UNDERSTANDING: 'C',
  RESULT_RELEVANCE: 'D',
  RESULT_EVALUATION: 'E',
  SEARCH_RECOVERY: 'F',
  ABANDONMENT: 'G',
  UNKNOWN: 'unknown',
  MULTIPLE: 'multiple',
};

export const CLASSIFICATIONS: Record<string, RelevanceClassification> = {
  RELEVANT: 'relevant',
  POTENTIALLY_RELEVANT: 'potentially_relevant',
  IRRELEVANT: 'irrelevant',
};

export const JOB_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const SOURCES = {
  GOOGLE_PLAY: 'google_play',
  APP_STORE: 'app_store',
  REDDIT: 'reddit',
  YOUTUBE: 'youtube',
  GOOGLE_COMMUNITY: 'google_community',
  OTHER: 'other',
};
