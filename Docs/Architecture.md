# Google Photos AI Discovery Engine — Architecture

> **Version:** V1  
> **Created:** 2026-09-25  
> **Context:** [Context.md](file:///h:/Antigravity/Google%20photo%20Discovery/Docs/Context.md)  
> **Status:** Draft

---

## 1. High-Level System Overview

```mermaid
graph TB
    subgraph Data Sources
        GP[Google Play Store]
        AS[Apple App Store]
        RD[Reddit API]
        GC[Google Support Community]
        YT[YouTube Data API]
        OT[Other Public Sources]
    end

    subgraph Collection Layer
        SC[Source Collectors / Scrapers]
        RQ[Rate Limiter & Queue]
    end

    subgraph Storage Layer
        RAW[(Raw Records DB)]
        CLEAN[(Cleaned Records DB)]
        ANALYSIS[(Analysis Results DB)]
    end

    subgraph Processing Pipeline
        CL[Cleaning & Normalization]
        RF[Relevance Filter]
        DD[Deduplication Engine]
    end

    subgraph LLM Layer
        BATCH[Batch Manager]
        LLM[LLM Structured Extraction]
        RETRY[Retry & Error Handler]
    end

    subgraph Application Layer
        API[REST API Server]
        AGG[Aggregation Engine]
        HYP[Hypothesis Generator]
        EXP[Data Export Service]
    end

    subgraph Frontend
        DASH[Discovery Dashboard]
    end

    GP & AS & RD & GC & YT & OT --> SC
    SC --> RQ --> RAW
    RAW --> CL --> DD --> CLEAN
    CLEAN --> RF --> ANALYSIS
    ANALYSIS --> BATCH --> LLM
    LLM --> RETRY --> ANALYSIS
    ANALYSIS --> API
    API --> AGG & HYP & EXP
    API --> DASH
```

---

## 2. Technology Stack

### 2.1 Backend

| Component | Technology | Rationale |
|---|---|---|
| **Runtime** | Node.js (v20+) | Async-first, excellent for I/O-heavy scraping and API orchestration |
| **Framework** | Express.js or Fastify | Lightweight REST API server |
| **Task Queue** | BullMQ (Redis-backed) | Reliable job scheduling for scrapers, LLM batches, and retries |
| **Scheduler** | node-cron or BullMQ repeatable jobs | Schedule recurring data collection runs |
| **Language** | TypeScript | Type safety across the full pipeline |

### 2.2 Database

| Component | Technology | Rationale |
|---|---|---|
| **Primary Database** | PostgreSQL 16 | Structured data, JSONB for flexible schema, full-text search, robust querying for analytics |
| **Cache / Queue Backend** | Redis | BullMQ backing store, caching frequent dashboard queries |
| **File Storage** | Local filesystem or S3-compatible (MinIO) | Raw export files (CSV/JSON), large batch outputs |

### 2.3 LLM Integration

| Component | Technology | Rationale |
|---|---|---|
| **LLM Provider** | Groq API | Ultra-fast inference, cost-effective for high-volume batch extraction |
| **SDK** | Groq SDK (`groq-sdk`) | Official SDK for reliable integration |
| **Output Format** | JSON structured output (response schema) | Enforces extraction schema consistency |

### 2.4 Frontend

| Component | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR for dashboard performance, API routes for lightweight BFF |
| **Charting** | Recharts or Chart.js | Visualizing failure point distributions, source breakdowns, segment analysis |
| **Tables** | TanStack Table | Filterable, sortable evidence explorer |
| **Styling** | Vanilla CSS with design tokens | Per project guidelines — no Tailwind unless requested |

### 2.5 DevOps / Infrastructure

| Component | Technology | Rationale |
|---|---|---|
| **Containerization** | Docker + Docker Compose | Reproducible local and deployment environments |
| **Environment Config** | dotenv / .env files | API keys, DB credentials, LLM keys |
| **Logging** | Pino (structured JSON logs) | Traceable pipeline execution |
| **Monitoring** | BullMQ Dashboard (Bull Board) | Monitor job queues, failed jobs, retries |

---

## 3. Database Schema

### 3.1 Core Tables

```sql
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
```

### 3.2 Entity Relationship Diagram

```mermaid
erDiagram
    raw_records ||--o| cleaned_records : "cleaned into"
    cleaned_records ||--o| relevance_classifications : "classified as"
    cleaned_records ||--o| analysis_results : "analyzed into"
    segments ||--|{ segment_evidence : "supported by"
    analysis_results ||--|{ segment_evidence : "belongs to"
    processing_jobs }|--|| raw_records : "tracks"
```

---

## 4. Third-Party Data Sources — Integration Details

### 4.1 Google Play Store

| Detail | Value |
|---|---|
| **Method** | `google-play-scraper` npm package (unofficial) |
| **Endpoint** | Scrapes public review pages |
| **Auth Required** | No |
| **Rate Limiting** | Self-imposed: 1–2 req/sec with randomized delays |
| **Data Available** | Review text, rating (1–5), date, thumbsUp count, reviewer name, reply text, **review permalink** |
| **App ID** | `com.google.android.apps.photos` |
| **Pagination** | Token-based; library handles continuation |
| **Legal** | Public reviews only; comply with Google ToS |

### 4.2 Apple App Store

| Detail | Value |
|---|---|
| **Method** | `app-store-scraper` npm package (unofficial) |
| **Endpoint** | Scrapes public App Store review RSS / API |
| **Auth Required** | No |
| **Rate Limiting** | Self-imposed: 1 req/sec |
| **Data Available** | Review text, rating, date, title, version, author, **review permalink** |
| **App ID** | Google Photos iOS app ID |
| **Pagination** | Page-based |
| **Legal** | Public reviews only |

### 4.3 Reddit

| Detail | Value |
|---|---|
| **Method** | Reddit Official API (OAuth2) |
| **Auth Required** | Yes — Reddit Developer App (free tier) |
| **Rate Limiting** | 100 requests/minute (OAuth) |
| **Endpoints** | `/search`, `/r/{subreddit}/search`, `/comments/{id}` |
| **Target Subreddits** | `r/googlephotos`, `r/Android`, `r/iphone`, `r/photography`, `r/google`, `r/Pixel`, `r/degoogle`, `r/techsupport` |
| **Search Queries** | "google photos search", "can't find photo", "find old photo google photos", "google photos not finding", "search doesn't work google photos" |
| **Data Available** | Post title, body, comments (threaded), score, date, author, **permalink to post and individual comments** |
| **Pagination** | Cursor-based (`after` token) |

### 4.4 Google Photos Community / Support

| Detail | Value |
|---|---|
| **Method** | Web scraping (Puppeteer / Playwright) |
| **Target** | `support.google.com/photos/community` |
| **Auth Required** | No (public threads) |
| **Rate Limiting** | Self-imposed: 1 req/2sec, respect robots.txt |
| **Data Available** | Thread title, question body, replies, date, marked answers, **thread URL** |
| **Search Strategy** | Search for: "can't find photo", "search not working", "find old photos", "search results wrong" |
| **Legal** | Public community posts; respect robots.txt and ToS |

### 4.5 YouTube Data API

| Detail | Value |
|---|---|
| **Method** | YouTube Data API v3 (official) |
| **Auth Required** | Yes — Google Cloud API Key |
| **Rate Limiting** | 10,000 units/day (free tier); search = 100 units, commentThreads = 1 unit |
| **Endpoints** | `search.list` → `commentThreads.list` → `comments.list` |
| **Search Queries** | "google photos search tips", "find old photos google photos", "google photos can't find", "google photos AI search" |
| **Data Available** | Video ID/title, comment text, like count, date, author, reply count, **comment permalink** |
| **Strategy** | Find relevant videos first → collect their comments → filter for user experiences |

### 4.6 Other Public Sources (Extensible)

| Detail | Value |
|---|---|
| **Method** | Source-specific scraper implementing `ISourceCollector` interface |
| **Potential Sources** | Stack Exchange, Quora, XDA Forums, photography forums |
| **Pattern** | Each new source = new collector module that outputs the standard `RawRecord` format |

---

## 5. Processing Pipeline — Detailed Flow

### 5.1 Stage 1: Collection

```mermaid
sequenceDiagram
    participant Scheduler
    participant Queue as Job Queue (BullMQ)
    participant Collector as Source Collector
    participant DB as Raw Records DB

    Scheduler->>Queue: Schedule collection job (per source)
    Queue->>Collector: Execute collection
    Collector->>Collector: Fetch data with rate limiting
    Collector->>Collector: Generate deterministic record_id (hash of source + URL + text)
    Collector->>DB: INSERT raw_records (skip if record_id exists)
    Collector->>Queue: Report completion / errors
```

**Key rules:**
- Each source has its own collector module implementing a shared interface
- Deterministic `record_id` = hash of `(source + source_url + raw_text)` — prevents duplicates across runs
- All raw data is immutable once stored
- Collection runs are idempotent — safe to re-run

### 5.2 Stage 2: Cleaning & Deduplication

```
Raw Record
    ↓
Strip HTML / tracking params / nav noise
    ↓
Normalize whitespace, encoding, punctuation
    ↓
Normalize dates → ISO 8601
    ↓
Detect language (if not already known)
    ↓
Fuzzy deduplication (MinHash / Jaccard similarity > 0.85)
    ↓
Flag extremely short records (< 20 chars) as skip
    ↓
Store as cleaned_record (linked to raw_record)
```

### 5.3 Stage 3: Relevance Filtering

Two-pass approach:

**Pass 1 — Keyword/Heuristic Filter (fast, no LLM cost):**

```
Relevant keywords: "can't find", "search", "looking for photo",
  "find old photo", "search not working", "can't locate",
  "retrieve", "where is my photo", "remember a photo",
  "search results", "find a specific"

Irrelevant keywords: "storage full", "backup", "subscription",
  "pricing", "sync", "sharing", "editing", "account locked",
  "payment", "Google One"
```

- Records matching relevant keywords → `potentially_relevant`
- Records matching only irrelevant keywords → `irrelevant`
- Ambiguous → `potentially_relevant`

**Pass 2 — LLM Classification (for `potentially_relevant` only):**

- Send to LLM in batches with a classification prompt
- LLM returns: `relevant` / `potentially_relevant` / `irrelevant` + confidence + reasoning
- Cost-efficient: only ambiguous records go to LLM for classification

### 5.4 Stage 4: LLM Structured Extraction

```mermaid
sequenceDiagram
    participant Queue as Job Queue
    participant Batch as Batch Manager
    participant LLM as LLM API (Gemini)
    participant DB as Analysis DB

    Queue->>Batch: Pick next batch (10-20 records)
    Batch->>Batch: Check not already processed (dedup)
    Batch->>LLM: Send records + extraction prompt + JSON schema
    LLM-->>Batch: Structured JSON responses
    Batch->>DB: Store analysis_results
    
    alt LLM Error / Timeout
        Batch->>Queue: Re-queue with retry count
        Queue->>Batch: Retry (max 3 attempts, exponential backoff)
    end
```

**Batch processing rules:**
- Batch size: 10–20 records per LLM call
- Never send entire dataset at once
- Track `processing_status` per record: `pending → processing → completed / failed / retry`
- Max 3 retries per record with exponential backoff
- Log `llm_model` and `llm_prompt_version` for reproducibility

### 5.5 Stage 5: LLM-Driven Segmentation & Analysis

```
All completed analysis_results
        ↓
Aggregate by failure_point → counts, percentages
        ↓
Aggregate by user_segment_signals → frequency, dominant failures
        ↓
Aggregate by source → distribution per insight
        ↓
Aggregate by retrieval_scenario → photo type patterns
        ↓
Feed aggregated patterns + raw evidence to LLM
        ↓
LLM analyzes data and creates user segments
        ↓
LLM assigns each analysis_result to discovered segments
        ↓
Store in segments + segment_evidence tables
```

> [!IMPORTANT]
> The LLM does **not** generate hypotheses. It directly analyzes the extracted data, discovers user segments, and classifies each piece of evidence into the segments it identifies. Segmentation emerges from the data, not from predefined categories.

---

## 6. API Layer

### 6.1 REST Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| **Dashboard** | | |
| `GET` | `/api/dashboard/overview` | Total counts (collected, cleaned, relevant, analyzed), source breakdown, date range |
| `GET` | `/api/dashboard/failure-points` | Failure point distribution with counts and percentages |
| `GET` | `/api/dashboard/segments` | User segments with evidence counts, dominant behaviours |
| `GET` | `/api/dashboard/insights` | Behavioural insights per theme |
| **Evidence** | | |
| `GET` | `/api/evidence` | Paginated evidence explorer (filter by source, failure point, segment, date) |
| `GET` | `/api/evidence/:id` | Single record with full raw + cleaned + analysis chain |
| `GET` | `/api/evidence/by-failure/:code` | All evidence for a specific failure point (A–G) |
| `GET` | `/api/evidence/by-segment/:segment` | All evidence for a user segment |
| **Segments** | | |
| `GET` | `/api/segments` | All LLM-generated user segments with metadata |
| `GET` | `/api/segments/:id/evidence` | Supporting evidence for a segment |
| **Pipeline** | | |
| `POST` | `/api/pipeline/collect` | Trigger collection for a source |
| `POST` | `/api/pipeline/clean` | Trigger cleaning batch |
| `POST` | `/api/pipeline/classify` | Trigger relevance classification |
| `POST` | `/api/pipeline/analyze` | Trigger LLM extraction batch |
| `POST` | `/api/pipeline/generate-segments` | Trigger LLM-driven segmentation |
| `GET` | `/api/pipeline/status` | Current pipeline status and job queue |
| **Export** | | |
| `GET` | `/api/export/csv` | Export filtered data as CSV |
| `GET` | `/api/export/json` | Export filtered data as JSON |

### 6.2 API Query Parameters (Evidence Explorer)

```
/api/evidence?
  source=reddit,google_play
  &failure_point=C,D
  &segment=travel_memories
  &frustration=high
  &outcome=not_found
  &date_from=2024-01-01
  &date_to=2026-09-01
  &page=1
  &limit=25
  &sort=confidence_desc
```

---

## 7. Source Collector Interface

Every data source collector must implement this interface:

```typescript
interface ISourceCollector {
  readonly sourceName: string;

  /**
   * Collect records from the source.
   * Must handle its own rate limiting and pagination.
   * Returns standardized RawRecord objects.
   */
  collect(options: CollectionOptions): AsyncGenerator<RawRecord>;

  /**
   * Check if the source is currently accessible.
   */
  healthCheck(): Promise<boolean>;
}

interface CollectionOptions {
  searchQueries: string[];
  maxRecords?: number;
  sinceDate?: Date;
  batchSize?: number;
}

interface RawRecord {
  record_id: string;          // deterministic hash
  source: string;
  source_url: string | null;
  source_date: Date | null;
  collection_date: Date;
  raw_text: string;
  language: string | null;
  rating: number | null;
  reviewer_meta: Record<string, any> | null;
  collector_meta: Record<string, any>;
}
```

> [!NOTE]
> Adding a new data source = implementing `ISourceCollector` + registering it in the collector registry. No other pipeline changes needed.

---

## 8. LLM Prompt Architecture

### 8.1 Relevance Classification Prompt

```
Role: You are a user research analyst specializing in Google Photos 
photo-retrieval experiences.

Task: Classify whether this user conversation is about a photo 
RETRIEVAL problem — specifically, a user trying to find/locate 
a specific photo or memory in Google Photos and struggling.

Classify as:
- "relevant": Clear evidence of photo retrieval difficulty
- "potentially_relevant": Mentions search/finding photos but unclear
- "irrelevant": About storage, backup, pricing, sync, editing, etc.

Return JSON: { "classification": "...", "confidence": 0.0-1.0, "reasoning": "..." }
```

### 8.2 Structured Extraction Prompt

```
Role: You are a user research analyst. Extract structured data about 
the user's photo retrieval journey from this conversation.

Do NOT summarize. Extract specific details into the provided JSON schema.

For failure_point, use these codes:
A = Memory Expression, B = Query Formulation, C = Search Understanding,
D = Result Relevance, E = Result Evaluation, F = Search Recovery, G = Abandonment

If multiple failure points, list all in failure_points array.
If unclear, use "unknown".

Return the extraction as JSON matching the schema exactly.
```

### 8.3 Segmentation & Analysis Prompt

```
Role: You are a senior user researcher.

Given these aggregated patterns from {N} analyzed user conversations 
about Google Photos retrieval failures:

[aggregated data summary]

Analyze the data and create user segments that:
1. Are grounded in the evidence patterns
2. Identify WHO (user segment) experiences WHAT (failure type)
3. Group users by retrieval behaviour, memory type, and failure patterns
4. Include evidence count and source distribution per segment

For each segment provide:
- A clear, descriptive name
- A description of the segment's defining characteristics
- The dominant failure points this segment experiences
- The dominant behaviours / workarounds this segment uses
- A frustration profile (high / medium / low distribution)

Do NOT generate hypotheses. Analyze the actual data and produce 
data-driven segments. Do NOT recommend solutions.
```

---

## 9. Project Directory Structure

```
google-photos-discovery/
├── docs/
│   ├── Problem Stataemnt.txt
│   ├── Context.md
│   └── Architecture.md
│
├── src/
│   ├── collectors/               # Data source collectors
│   │   ├── interfaces.ts         # ISourceCollector interface
│   │   ├── google-play.ts
│   │   ├── app-store.ts
│   │   ├── reddit.ts
│   │   ├── youtube.ts
│   │   ├── google-community.ts
│   │   └── registry.ts           # Collector registry
│   │
│   ├── pipeline/                 # Processing pipeline
│   │   ├── cleaner.ts            # Cleaning & normalization
│   │   ├── deduplicator.ts       # Fuzzy dedup (MinHash)
│   │   ├── relevance-filter.ts   # Keyword + LLM classification
│   │   └── orchestrator.ts       # Pipeline orchestration
│   │
│   ├── llm/                      # LLM integration
│   │   ├── client.ts             # LLM API client (Groq)
│   │   ├── batch-manager.ts      # Batch processing + retry logic
│   │   ├── extractor.ts          # Structured extraction
│   │   ├── classifier.ts         # Relevance classification
│   │   ├── segmenter.ts          # LLM-driven segmentation & analysis
│   │   └── prompts/              # Versioned prompt templates
│   │       ├── classify-v1.ts
│   │       ├── extract-v1.ts
│   │       └── segment-v1.ts
│   │
│   ├── db/                       # Database layer
│   │   ├── connection.ts
│   │   ├── migrations/           # SQL migration files
│   │   ├── repositories/         # Data access layer
│   │   │   ├── raw-records.ts
│   │   │   ├── cleaned-records.ts
│   │   │   ├── analysis-results.ts
│   │   │   └── segments.ts
│   │   └── queries/              # Complex aggregation queries
│   │
│   ├── api/                      # REST API
│   │   ├── server.ts
│   │   ├── routes/
│   │   │   ├── dashboard.ts
│   │   │   ├── evidence.ts
│   │   │   ├── segments.ts
│   │   │   ├── pipeline.ts
│   │   │   └── export.ts
│   │   └── middleware/
│   │
│   ├── jobs/                     # Background job definitions
│   │   ├── collection-job.ts
│   │   ├── cleaning-job.ts
│   │   ├── classification-job.ts
│   │   ├── extraction-job.ts
│   │   └── segmentation-job.ts
│   │
│   └── shared/                   # Shared types, utils, constants
│       ├── types.ts
│       ├── constants.ts
│       └── utils.ts
│
├── frontend/                     # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx              # Overview
│   │   ├── failures/page.tsx     # Failure themes
│   │   ├── segments/page.tsx     # User segments
│   │   ├── insights/page.tsx     # Behavioural insights
│   │   ├── evidence/page.tsx     # Evidence explorer
│   │   ├── segments/page.tsx     # User segments (LLM-generated)
│   │   └── pipeline/page.tsx     # Pipeline status
│   ├── components/
│   └── styles/
│
├── docker-compose.yml            # PostgreSQL + Redis + App
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 10. Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gp_discovery
REDIS_URL=redis://localhost:6379

# LLM (Groq)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile   # or mixtral-8x7b-32768
LLM_BATCH_SIZE=15
LLM_MAX_RETRIES=3

# Reddit API
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=GPDiscoveryEngine/1.0

# YouTube Data API
YOUTUBE_API_KEY=your_youtube_key

# App
API_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=development
```

---

## 11. Docker Compose (Development)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: gp_discovery
      POSTGRES_USER: discovery
      POSTGRES_PASSWORD: discovery_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    env_file: .env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  pgdata:
```

---

## 12. Key Design Decisions

| Decision | Choice | Why |
|---|---|---|
| PostgreSQL over MongoDB | Structured analysis data benefits from relational queries; JSONB provides flexibility where needed | Analytics and aggregation queries are far simpler in SQL |
| BullMQ over simple cron | Pipeline stages need retry logic, status tracking, and concurrency control | Essential for reliable LLM batch processing |
| Two-pass relevance filtering | Keyword filter first, LLM only for ambiguous records | Keeps LLM costs manageable at scale (10K–100K records) |
| Deterministic record IDs | Hash-based dedup at collection time | Idempotent collection — safe to re-run without duplicates |
| Separate raw/cleaned/analysis tables | Never overwrite original data | Full traceability from insight → evidence → original text |
| Versioned prompts | Stored as code with version tags | Reproducibility — know exactly which prompt generated each result |
| Collector interface pattern | Standardized `ISourceCollector` | Add new sources without touching pipeline code |

---

## 13. RAG Research Assistant

> **Status:** Implemented  
> **Added:** 2026-10-06

### 13.1 Architecture Overview

The RAG (Retrieval-Augmented Generation) Research Assistant lets users ask natural-language questions about the research data and receive evidence-backed, streaming answers grounded in the project's documents.

```mermaid
graph LR
    subgraph Knowledge Base
        MD[Findings.md\nContext.md\nProblem Statement]
        INT[Interview Transcripts]
        JSON[Themes JSON\nSegments JSON\nStats JSON\nHypotheses JSON\nJourneys JSON]
    end

    subgraph RAG Pipeline
        LOAD[Document Loader\nChunker]
        IDX[In-Memory TF-IDF Index]
        RET[Retriever\nTop-K + Source Boost]
    end

    subgraph LLM Layer
        SYS[System Prompt\nResearch Context]
        GROQ[Groq API\nllama-3.3-70b]
        SSE[SSE Stream]
    end

    subgraph Frontend
        ASK[/ask Chat UI]
    end

    MD & INT & JSON --> LOAD --> IDX
    ASK -->|question| RET
    IDX --> RET -->|top 6 chunks| SYS --> GROQ --> SSE --> ASK
```

### 13.2 Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Document Loading** | Custom `loader.ts` (Node.js `fs`) | Reads Markdown, text, and JSON files; chunks with overlap for context preservation |
| **Retrieval** | Custom TF-IDF with source boosting | Lightweight, zero-dependency, no vector DB needed for 9-document corpus |
| **LLM Provider** | Groq API (`groq-sdk`) | Ultra-fast streaming inference; same provider as the analysis pipeline |
| **API Transport** | Next.js API Route (`/api/rag`) + SSE | Server-Sent Events for real-time token streaming |
| **Frontend** | React + `react-markdown` + `remark-gfm` | Streaming chat UI with markdown rendering and source attribution |

### 13.3 Knowledge Base (9 Documents)

| # | Source | File | Type | Label |
|---|---|---|---|---|
| 1 | Research Findings | `Docs/Findings.md` | Markdown | Research Findings |
| 2 | Research Context | `Docs/Context.md` | Markdown | Research Context & Framework |
| 3 | User Interviews | `Docs/interview_text.txt` | Text | User Interviews (Ishwar, Resham, Naina, Pritish) |
| 4 | Problem Statement | `Docs/Problem Stataemnt.txt` | Text | Problem Statement & Research Goals |
| 5 | Theme Analysis | `data/phase4/phase4d_themes.json` | JSON | LLM Theme Analysis (13k reviews) |
| 6 | User Segments | `data/phase4/phase4e_segments.json` | JSON | User Segment Analysis |
| 7 | Failure Statistics | `data/phase4/phase4c_aggregation.json` | JSON | Failure Point Statistics |
| 8 | Hypotheses | `data/phase4/phase4f_hypotheses.json` | JSON | Research Hypotheses & Interview Questions |
| 9 | User Journeys | `data/phase4/phase4b_journeys.json` | JSON | User Journey Extractions (111 journeys) |

### 13.4 Retrieval Strategy

- **Chunking:** Paragraph-boundary splitting with configurable chunk size (900 chars for text, 1100 for JSON) and 200–250 char overlap
- **Scoring:** TF-IDF with IDF cached per process lifecycle
- **Source Boosting:** Query keywords (e.g., "interview", "hypothesis", "statistics") apply a 0.3–0.4 score multiplier to chunks from matching sources
- **Top-K:** Returns top 6 chunks; falls back to core findings if no chunks score > 0

### 13.5 Key Files

```
frontend/
├── src/
│   ├── lib/rag/
│   │   ├── loader.ts          # Document loading & chunking (9 sources)
│   │   └── retriever.ts       # TF-IDF scoring + source boosting
│   └── app/
│       ├── ask/
│       │   ├── page.tsx        # Chat UI with streaming + source chips
│       │   └── page.module.css # Ask page styles
│       └── api/rag/
│           └── route.ts        # SSE streaming API (Groq + retrieval)
├── .env.example                # GROQ_API_KEY, GROQ_MODEL
└── test-rag.js                 # Smoke test script
```

### 13.6 Environment Variables (Frontend)

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
# Optional: NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 13.7 Design Decisions

| Decision | Choice | Why |
|---|---|---|
| In-memory TF-IDF over pgvector | Lightweight retrieval, no DB dependency | Corpus is only 9 documents — vector embeddings are overkill |
| SSE over WebSocket | Server-Sent Events for streaming | Simpler, HTTP-native, one-directional streaming is sufficient |
| Chunk caching at module level | `cachedChunks` persists across requests | Avoids re-reading and re-chunking on every question |
| Source boosting heuristic | Keyword-matched score multipliers | Ensures domain-specific queries (e.g., "what did Resham say?") prioritize the right document |

---

## 14. V2 Extensions (Future)

When the evidence pipeline is reliable:

| Extension | Approach |
|---|---|
| **Semantic Retrieval Upgrade** | Replace TF-IDF with embedding-based retrieval (pgvector or FAISS) for better paraphrase handling |
| **Conversation Memory** | Add multi-turn context so follow-up questions work |
| **Real-time Collection** | Move from batch to streaming collection with webhooks/RSS |
| **Multi-language Support** | Add translation layer before cleaning for non-English sources |
| **Collaborative Annotation** | Allow researchers to manually tag/correct LLM classifications |
| **A/B Prompt Testing** | Compare extraction quality across prompt versions |

---

## 15. Summary

| Layer | Technology | Key Files |
|---|---|---|
| **Data Collection** | Source-specific scrapers + APIs | `src/collectors/` |
| **Queue / Scheduling** | BullMQ + Redis | `src/jobs/` |
| **Database** | PostgreSQL 16 | `src/db/` |
| **Processing** | TypeScript pipeline (clean → dedup → filter) | `src/pipeline/` |
| **LLM** | Groq API | `src/llm/` |
| **API** | Express/Fastify REST | `src/api/` |
| **Dashboard** | Next.js + Recharts | `frontend/` |
| **RAG Assistant** | Groq + TF-IDF + SSE | `frontend/src/lib/rag/`, `frontend/src/app/ask/` |
| **Infrastructure** | Docker Compose | `docker-compose.yml` |

