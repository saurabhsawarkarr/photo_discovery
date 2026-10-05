-- ============================================
-- RAW RECORDS — never modified after insert
-- ============================================
CREATE TABLE raw_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       TEXT UNIQUE NOT NULL,       -- deterministic ID for dedup
    source          TEXT NOT NULL,               -- 'google_play', 'app_store', 'reddit', 'youtube', 'google_community', 'other'
    source_url      TEXT,
    source_date     TIMESTAMPTZ,
    collection_date TIMESTAMPTZ DEFAULT NOW(),
    raw_text        TEXT NOT NULL,
    language        TEXT,
    rating          NUMERIC,                    -- nullable, only for app store reviews
    reviewer_meta   JSONB,                      -- any public reviewer info
    collector_meta  JSONB,                      -- scraper version, batch ID, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raw_source ON raw_records(source);
CREATE INDEX idx_raw_source_date ON raw_records(source_date);
CREATE INDEX idx_raw_collection_date ON raw_records(collection_date);

-- ============================================
-- CLEANED RECORDS — normalized text, deduped
-- ============================================
CREATE TABLE cleaned_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_record_id   UUID NOT NULL REFERENCES raw_records(id),
    record_id       TEXT UNIQUE NOT NULL,
    cleaned_text    TEXT NOT NULL,
    source          TEXT NOT NULL,
    source_url      TEXT,
    source_date     TIMESTAMPTZ,
    collection_date TIMESTAMPTZ,
    language        TEXT,
    is_duplicate    BOOLEAN DEFAULT FALSE,
    cleaning_meta   JSONB,                      -- what was removed/normalized
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaned_source ON cleaned_records(source);
CREATE INDEX idx_cleaned_not_dup ON cleaned_records(is_duplicate) WHERE is_duplicate = FALSE;

-- ============================================
-- RELEVANCE CLASSIFICATION
-- ============================================
CREATE TABLE relevance_classifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaned_record_id   UUID NOT NULL REFERENCES cleaned_records(id),
    classification      TEXT NOT NULL CHECK (classification IN ('relevant', 'potentially_relevant', 'irrelevant')),
    confidence          NUMERIC,
    classification_method TEXT,                  -- 'keyword', 'llm', 'manual'
    reasoning           TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relevance_class ON relevance_classifications(classification);

-- ============================================
-- LLM ANALYSIS RESULTS — structured extraction
-- ============================================
CREATE TABLE analysis_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaned_record_id   UUID NOT NULL REFERENCES cleaned_records(id),
    record_id           TEXT NOT NULL,
    source              TEXT NOT NULL,
    source_url          TEXT,
    source_date         TIMESTAMPTZ,

    is_relevant             BOOLEAN,
    retrieval_scenario      TEXT,

    -- Photo context
    photo_type              TEXT,
    occasion                TEXT,
    location                TEXT,
    people                  TEXT,
    activity                TEXT,
    visual_details          TEXT,
    time_period             TEXT,

    memory_clues            JSONB,              -- string[]
    forgotten_information   JSONB,              -- string[]

    -- Search attempt
    search_query            TEXT,
    search_method           TEXT,
    number_of_attempts      INTEGER,

    search_outcome          TEXT,
    failure_point           TEXT,               -- A, B, C, D, E, F, G, unknown, multiple
    failure_points          JSONB,              -- string[] for multiple
    user_behaviour_after    TEXT,
    workaround              TEXT,
    final_outcome           TEXT CHECK (final_outcome IN ('found', 'not_found', 'abandoned', 'unknown')),
    frustration_signal      TEXT CHECK (frustration_signal IN ('low', 'medium', 'high', 'unknown')),
    user_segment_signals    JSONB,              -- string[]
    evidence_quote          TEXT,
    confidence              NUMERIC,

    -- LLM processing metadata
    llm_model               TEXT,
    llm_prompt_version      TEXT,
    processing_status       TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
    error_message           TEXT,
    processed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_failure ON analysis_results(failure_point);
CREATE INDEX idx_analysis_outcome ON analysis_results(final_outcome);
CREATE INDEX idx_analysis_status ON analysis_results(processing_status);
CREATE INDEX idx_analysis_source ON analysis_results(source);

-- ============================================
-- SEGMENTS — LLM-generated user segments from data analysis
-- ============================================
CREATE TABLE segments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id              TEXT UNIQUE NOT NULL,       -- S1, S2, etc.
    segment_name            TEXT NOT NULL,              -- e.g., "Travel Memory Seekers"
    segment_description     TEXT NOT NULL,
    evidence_count          INTEGER,
    source_distribution     JSONB,              -- { "reddit": 12, "google_play": 8, ... }
    dominant_failure_points JSONB,              -- string[] — most common failure codes for this segment
    dominant_behaviours     JSONB,              -- string[] — most common workarounds/behaviours
    frustration_profile     JSONB,              -- { "high": 15, "medium": 8, "low": 3 }
    llm_model               TEXT,
    generated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_segments_name ON segments(segment_name);

-- ============================================
-- SEGMENT ↔ EVIDENCE LINKING
-- ============================================
CREATE TABLE segment_evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id      UUID NOT NULL REFERENCES segments(id),
    analysis_id     UUID NOT NULL REFERENCES analysis_results(id),
    relevance_note  TEXT
);

-- ============================================
-- PROCESSING JOBS — track pipeline state
-- ============================================
CREATE TABLE processing_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        TEXT NOT NULL,               -- 'collection', 'cleaning', 'relevance', 'llm_extraction', 'segmentation'
    source          TEXT,
    status          TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    total_records   INTEGER,
    processed_count INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,
    error_log       JSONB,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
