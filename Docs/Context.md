# Google Photos AI Discovery Engine — Context Document

> **Version:** V1  
> **Created:** 2026-09-25  
> **Source:** [Problem Statement](file:///h:/Antigravity/Google%20photo%20Discovery/Docs/Problem%20Stataemnt.txt)  
> **Status:** Active

---

## 1. What We Are Building

An **AI-powered user research and discovery engine** for Google Photos.

This is **not** the final Google Photos retrieval solution. This is a **research tool** that:

- Collects large volumes of publicly available user conversations
- Filters and cleans them for relevance
- Extracts structured insights using LLM analysis
- Surfaces evidence-backed findings through a discovery dashboard
- Generates research hypotheses to guide 5–6 user interviews

> [!IMPORTANT]
> The system must prioritize **evidence, traceability, and research usefulness** over visual complexity.

---

## 2. The Problem Being Investigated

**Core scenario:** A user knows a photo exists in their Google Photos library but remembers it only through incomplete or contextual details — and struggles to retrieve it.

### Example

> *"I remember a photo from Goa around New Year. We were having breakfast at a small café. There was a blue wall behind us."*

### What users may remember

| Remembered (partial) | Not remembered |
|---|---|
| Approximate location | Exact date |
| Activity | Exact location |
| People | Café/place name |
| Visual appearance | Album |
| Occasion | Filename |
| Surrounding context | Exact person |
| — | Searchable keywords |

### Core Discovery Question

> **Where exactly are users failing when trying to retrieve a vaguely remembered photo, who experiences each failure, and what evidence supports the finding?**

---

## 3. The Retrieval Journey Under Investigation

The system must investigate the **entire** retrieval journey — not assume which step is broken:

```
User remembers a photo
        ↓
User interprets their memory
        ↓
User formulates a search
        ↓
User searches
        ↓
Google Photos returns results
        ↓
User evaluates results
        ↓
User finds the photo
        OR
User tries again → refines / changes approach
        ↓
Success OR Abandonment
```

---

## 4. Data Collection

### Philosophy

> **Collect broadly → Filter aggressively → Analyze relevant evidence deeply**

Do **not** design around a fixed dataset size. The system should collect the maximum practical amount of relevant public data, then filter down to high-quality evidence. We may collect 10,000 → 50,000 → 100,000+ raw records depending on source availability.

### Primary Data Sources

| Source | What to Collect |
|---|---|
| **Google Play Store** | Google Photos reviews — text, rating, date, app ID, reviewer metadata, source URL, language |
| **Apple App Store** | Google Photos reviews — equivalent metadata |
| **Reddit** | Public discussions & comments from Google Photos, Android, iPhone/photo, photography, and technology communities |
| **Google Photos Community / Support** | Discussions about finding photos, search failures, searching old photos, finding specific memories, photo retrieval |
| **YouTube** | Comments from videos on Google Photos search, finding old photos, tips, AI/search features, tutorials |
| **Other Public Sources** | Forums, photography communities, tech forums, public social media, discussion boards |

> [!NOTE]
> The architecture must allow **new sources to be added later**.

---

## 5. Data Processing Pipeline

### 5.1 Relevance Filtering

Every collected record must be classified:

| Classification | Criteria | Action |
|---|---|---|
| **RELEVANT** | User was trying to find/retrieve a specific photo or memory and experienced difficulty | Send to LLM analysis |
| **POTENTIALLY RELEVANT** | Discusses Google Photos search or finding photos but lacks detail for confident classification | Retain for secondary review |
| **IRRELEVANT** | About storage, backup, pricing, subscription, sync, general bugs, sharing, editing, account problems, unrelated complaints | Exclude (unless also contains retrieval behaviour) |

> [!CAUTION]
> Do NOT collect everything and send everything to the LLM. Most raw data will be irrelevant. A relevance filtering pipeline is critical.

### 5.2 Cleaning & Normalization

**Remove:**
- Duplicates, repeated scraped content, spam, bot-generated content
- Empty records, extremely short records with no useful context
- Obvious advertisements, navigation/UI noise
- HTML remnants, tracking parameters, malformed records

**Normalize:**
- Whitespace, encoding, punctuation, dates
- Source names, language metadata, URLs, timestamps

> [!IMPORTANT]
> Do **not** aggressively rewrite user text. The original text must remain available for evidence.

### 5.3 Data Schema (Per Record)

Every record must preserve:

| Field | Purpose |
|---|---|
| `raw_text` | Original, unmodified conversation text |
| `cleaned_text` | Normalized version |
| `source` | Platform name |
| `source_url` | **Link to original review/post/comment** (mandatory for traceability) |
| `source_date` | When the original was posted |
| `collection_date` | When we collected it |
| `record_id` | Unique identifier |

---

## 6. LLM Analysis & Structured Extraction

After cleaning and relevance filtering, relevant records go to an LLM for **structured extraction** (not summarization).

### Extraction Schema

```json
{
  "record_id": "unique_id",
  "source": "Reddit",
  "source_url": "...",
  "source_date": "...",
  "is_relevant": true,

  "retrieval_scenario": "...",

  "photo_context": {
    "photo_type": "...",
    "occasion": "...",
    "location": "...",
    "people": "...",
    "activity": "...",
    "visual_details": "...",
    "time_period": "..."
  },

  "memory_clues": ["..."],
  "forgotten_information": ["..."],

  "search_attempt": {
    "query": "...",
    "search_method": "...",
    "number_of_attempts": null
  },

  "search_outcome": "...",
  "failure_point": "...",
  "user_behaviour_after_failure": "...",
  "workaround": "...",
  "final_outcome": "found | not_found | abandoned | unknown",
  "frustration_signal": "low | medium | high | unknown",
  "user_segment_signals": ["..."],
  "evidence_quote": "...",
  "confidence": 0.0
}
```

> The schema can evolve during implementation, but structured extraction is **mandatory**.

---

## 7. Retrieval Failure Points

The system must classify each relevant conversation into one or more failure points:

| Code | Failure Point | Description |
|---|---|---|
| **A** | Memory Expression | User has a memory but struggles to describe it |
| **B** | Query Formulation | User describes the memory but doesn't know what terms to search |
| **C** | Search Understanding | User submits a reasonable description but believes Google Photos doesn't understand the context |
| **D** | Result Relevance | Results don't contain the expected photo or appear insufficiently relevant |
| **E** | Result Evaluation | Too many results make it difficult to identify the correct photo |
| **F** | Search Recovery | First search fails and user doesn't know how to refine or continue |
| **G** | Abandonment | User eventually stops trying |

Also supports: `unknown` and `multiple_failure_points`.

---

## 8. User Segments

One of the **most important requirements**. We don't just want to know *"search is a problem"* — we want to know **who** experiences **which type** of retrieval problem.

### Candidate Segmentation Dimensions

| Dimension | Examples |
|---|---|
| **Library Behaviour** | Large libraries, frequent collectors, occasional users, long-term users |
| **Retrieval Scenario** | Travel, family, childhood, events, people-centric, documents, food, places, objects, screenshots |
| **Memory Type** | Location-based, time-based, person-based, activity-based, visual, contextual, mixed/ambiguous |
| **User Behaviour** | Single-search, repeated-query, manual browsers, album users, timeline users, abandon-after-failure |

> [!NOTE]
> These are **candidate dimensions**, not predefined conclusions. The engine should discover which dimensions actually appear in the collected evidence.

---

## 9. User Workarounds

Detect how users currently compensate for retrieval problems:

- Manually scrolling through timeline
- Searching multiple keywords
- Changing dates
- Searching locations
- Opening albums
- Checking another device
- Using Google Search
- Asking another person
- Using another photo-management tool
- Creating albums manually
- Giving up

> Workarounds are particularly valuable — they show what users are already trying to do to solve the problem themselves.

---

## 10. LLM-Driven Segmentation & Analysis

After structured extraction, the LLM must **analyze the data and create user segments** based on patterns discovered in the actual collected evidence. Segments are **not predefined** — they must emerge from the data.

The LLM receives the aggregated extraction results and:
1. Identifies natural groupings of users by retrieval behaviour, memory type, and failure patterns
2. Creates named segments with clear descriptions
3. Assigns each piece of evidence to the segments it belongs to
4. Calculates per-segment failure distributions and frustration profiles

> [!IMPORTANT]
> The system does **not** generate hypotheses. The LLM directly analyzes the data and produces data-driven user segments. Segmentation is the output — not speculation.

### Example segment format (for reference only — not actual segments):

| ID | Segment | Description |
|---|---|---|
| S1 | Travel Memory Seekers | Users trying to find photos from trips, relying on location and activity clues |
| S2 | Family Event Browsers | Users searching for photos of family gatherings, birthdays, celebrations |
| S3 | Large Library Scrollers | Long-term users with 10K+ photos who default to manual timeline browsing |
| S4 | First-Attempt Abandoners | Users who give up after a single failed search attempt |

### Every LLM-generated segment must include:
- Segment name and description
- Evidence count
- Source distribution
- Dominant failure points for this segment
- Dominant behaviours / workarounds
- Frustration profile (high / medium / low)

> [!WARNING]
> Segments must be **grounded in actual data**. Every segment must be traceable to specific user conversations in the dataset. The system must not produce segments without supporting evidence.

---

## 11. Evidence Traceability

**Every major insight must be traceable back to actual user conversations.**

Example flow:

```
Insight: "Users frequently attempt multiple queries before abandoning retrieval."
        ↓
    [View Evidence]
        ↓
Source: Reddit      | Date: ... | Original text: "..."
Source: Google Play  | Date: ... | Original text: "..."
Source: YouTube     | Date: ... | Original text: "..."
```

---

## 12. Dashboard — V1

### Sections

| Section | Contents |
|---|---|
| **Overview** | Total records collected → cleaned → relevant; sources; date range |
| **Retrieval Failure Themes** | Failure type, count, % of relevant corpus |
| **User Segments** | Segment, evidence count, dominant behaviour, dominant failure point |
| **Behavioural Insights** | Per theme: What users remember → What they search → What happens → What they do next → Where they fail |
| **Evidence Explorer** | Open original conversations supporting any insight |
| **User Segments** | LLM-generated segments, evidence count, dominant failure points, frustration profile, supporting conversations |

---

## 13. Architecture

### V1 Pipeline

```
DATA SOURCES
     ↓
COLLECTION
     ↓
RAW DATABASE
     ↓
CLEANING
     ↓
RELEVANCE FILTER
     ↓
LLM STRUCTURED EXTRACTION
     ↓
ANALYTICS
     ↓
DISCOVERY DASHBOARD
```

### V2 — Future (after evidence pipeline is reliable)

```
DISCOVERY DATABASE
        ↓
      RAG
        ↓
   AI RESEARCH CHATBOT
        ↓
"Show me evidence of search-recovery failures"
```

---

## 14. Non-Functional Requirements

| Requirement | Details |
|---|---|
| Source traceability | Every insight traces back to original source |
| Incremental processing | Handle large datasets incrementally |
| Pagination / batching | Support paginated data loading |
| LLM batching | Do NOT send entire dataset to LLM at once |
| Retry logic | Support retries for failed LLM requests |
| Deduplication | Avoid duplicate LLM processing |
| Processing status | Maintain and display processing status |
| Error handling | Show errors clearly |
| Data export | CSV and JSON export |
| Additive data | New data can be added without destroying existing analysis |
| Source URLs | Maintain where publicly available |
| Record lifecycle | Distinguish collected → cleaned → relevant → analyzed |
| Privacy | Avoid exposing private user information unnecessarily |

---

## 15. Critical Constraints

> [!CAUTION]
> ### No Premature Solutions
> The Discovery Engine must **not** recommend solutions like *"Build a conversational AI."*  
> It should only tell us: *"This is where users appear to struggle."*  
> Then we conduct primary research (interviews). After the interviews, we decide what problem is actually worth solving. Only then do we build the user-facing MVP.

> [!IMPORTANT]
> ### The Most Important Metric
> The important number is **not** how many records we scrape.  
> The important number is: **How much high-quality, relevant evidence about the target retrieval scenario we can identify and trace back to its original source.**

---

## 16. Summary

| Aspect | Answer |
|---|---|
| **What** | AI-powered discovery engine for Google Photos user research |
| **Why** | Understand where users fail when retrieving vaguely-remembered photos |
| **How** | Collect public conversations → Clean → Filter → LLM extraction → Dashboard |
| **Output** | Evidence-backed insights, user segments, failure points, research hypotheses |
| **Next step** | Use findings to design 5–6 user interviews |
| **Not doing** | Building the final product — only the research tool |
