# Findings — Google Photos Photo Retrieval Research

> **Date:** 2026-09-30  
> **Author:** Saurabh  
> **Status:** Complete  
> **Related Docs:** [Context.md](file:///h:/Antigravity/Google%20photo%20Discovery/Docs/Context.md) · [Survey.pdf](file:///h:/Antigravity/Google%20photo%20Discovery/Docs/Survey.pdf) · [User Interview.pdf](file:///h:/Antigravity/Google%20photo%20Discovery/Docs/User%20Interview.pdf)

---

## Research Overview

### What We Did

We investigated one core question from our [Context Document](file:///h:/Antigravity/Google%20photo%20Discovery/Docs/Context.md):

> **"Where exactly are users failing when trying to retrieve a vaguely remembered photo, who experiences each failure, and what evidence supports the finding?"**

To answer this, we combined **four distinct research sources:**

| # | Source | Method | Scale | What It Tells Us |
|---|---|---|---|---|
| 1 | **AI Discovery Engine** | Scraped 13,252 app reviews (Google Play + App Store) → filtered by relevance → LLM-extracted 111 structured user journeys | 111 coded journeys | Failure patterns at scale — statistical distributions, co-occurrences, trends |
| 2 | **User Interviews** | 4 contextual interviews (Ishwar, Resham, Naina, Pritish) with live search tasks | 4 participants | The *why* and *how* behind failures — observed real-time behaviour |
| 3 | **Survey** | Structured questionnaire distributed to Google Photos users | 13 respondents | Self-reported habits, preferences, and stated needs from a broader sample |
| 4 | **Problem Context** | Context document defining the retrieval journey framework (Failure Points A–G) | Framework | The analytical lens for classifying and comparing failures |

### The Retrieval Journey Framework (from Context.md §3)

Every photo retrieval follows this journey. Our failure point codes (A–G) map to specific stages:

```
  🧠 REMEMBER ─────→ 🔍 SEARCH ─────→ 📋 RESULTS ─────→ 👁️ EVALUATE
     (A: Memory        (B: Query          (C: System          (D: Result
      Expression)        Formulation)       Understanding)      Relevance)
                                                                  │
                                                           ┌──────┴──────┐
                                                           │             │
                                                        ✅ FIND      ❌ FAIL
                                                                        │
                                                                  ┌─────┴─────┐
                                                                  │           │
                                                          🔄 REFINE       🚪 ABANDON
                                                        (F: Search        (G: Abandon-
                                                         Recovery)          ment)
```

### Quantitative Snapshot (Discovery Engine — 111 Journeys)

| Metric | Value |
|---|---|
| Total journeys coded | 111 |
| High-confidence extractions | 81 (73%) |
| Journeys ending in **abandonment** | 54 (48.6%) |
| Journeys ending in **not found** | 39 (35.1%) |
| Journeys ending in **found** | 7 (6.3%) |
| High frustration | 82 (73.9%) |

> Only **6.3%** of coded retrieval journeys ended in the user finding the photo they were looking for.

---

## Findings

From the combined analysis of all four sources, we identified **three key findings** — each representing a gap between what users need and what Google Photos currently delivers.

---

### Finding 1: The Dead-End Search — Insufficient Recovery Support After Failure

**The gap:** In our live search tasks and review analysis, when a user's first search did not produce the desired photo, participants did not receive useful contextual guidance for recovering from the failed or insufficient search. While the system provides some generic suggestions, it does not offer adaptive refinement hints, contextual autocomplete, or "did you mean..." prompts that help users figure out what additional information to provide or how to narrow their results.

#### Evidence from AI Discovery Engine

The three most common failure points are deeply interconnected:

| Failure Point | Count | % of Journeys |
|---|---|---|
| **F — Search Recovery** (no system guidance after failure) | 54 | 48.6% |
| **G — Abandonment** (user stops trying) | 54 | 48.6% |
| **D — Result Relevance** (results don't contain expected photo) | 46 | 41.4% |

The critical insight is the **co-occurrence pattern**:

| Failure Pair | Co-occurrence | What It Means |
|---|---|---|
| **F + G** (recovery difficulty + abandon) | 27.0% | Recovery struggles and abandonment frequently appear together |
| **D + F** (bad results + recovery difficulty) | 22.5% | Poor results often coincide with difficulty refining the search |
| **D + G** (bad results + abandon) | 17.1% | Poor results alone also co-occur with abandonment |

**D, F, and G frequently co-occur**, suggesting a possible failure cascade: poor results leave users needing refinement, while insufficient recovery support may contribute to abandonment. While co-occurrence does not prove causality, the pattern is consistent across all three research sources and the interview observations support the direction of the relationship.

Frustration data backs this up:

| Failure Point | High Frustration | Medium | Low |
|---|---|---|---|
| F — Search Recovery | **48** (88.9%) | 5 | 1 |
| G — Abandonment | **43** (79.6%) | 10 | 1 |
| D — Result Relevance | **40** (86.9%) | 5 | 1 |

Evidence quotes from reviews:

> *"followed the steps and still can't find what I need."* — App Store review  
> *"l can't find what l need"* — App Store review  
> *"The simple act of trying to find a photo on a particular date is impossible."* — App Store review

#### Evidence from User Interviews

All four interview participants experienced search difficulties during their live sessions. In these observed tasks, **none received useful contextual guidance** (such as refinement suggestions or follow-up prompts) from the system to help recover from a failed or insufficient search:

**Resham:**
- Searched for "Ganpati" → too many results. Added the year → got closer but still didn't find the specific front-facing decoration photo she wanted.
- Eventually gave up: *"searched a lot, scrolled for 15-20 minutes, year by year, but I still wasn't getting it. So then I just left it, skipped it."*
- Her explicit suggestion for improvement: *"If they give suggestions like 'do you want to add the year?' or 'do you want to see Ganpati of some place?' — meaning options should come right there. It automatically gives suggestions basically."*

**Ishwar:**
- Searched "Pictures of gardening" → "No results found." 
- Tried "planting trees" → got random results (dashboards, hills, lawns).
- His reaction: *"Damn, I don't understand it. Everyone's experience is different."*
- He explicitly asked for: *"auto-complete! Like if you type 'planting trees', it should suggest something next."*

**Naina:**
- Succeeded only when she composed a highly specific multi-part query on her own: *"wearing white top and standing near temple."*
- When asked if the system gave any nudge or suggestion: *"Currently no."*
- Her improvement suggestion: *"Autocomplete. Because in search, we don't remember everything, sometimes particular things stay in memory and the rest is forgotten."*

**Pritish:**
- Searched "Prachi Vakhre bill" → found all bills. Tried "Prachi Vakhre bill of 12-12-2023" → failed.
- Year alone (2023) returned everything from that year, but couldn't narrow to a specific date.
- His reaction: *"No, but it shouldn't be like that. It should take that too, numbers too... numbers and letters too, it should take everything."*
- Also suggested: *"Like how Google Lens works"* — a visual search/upload option.

#### Evidence from Survey

| Survey Signal | Count (of 13) |
|---|---|
| Want "suggest different things I could search for" | 3 |
| Want "let me search using more details about the photo" | 5 |
| Want "help me describe what I remember" | 2 |
| After a failed search, try different search words | 2 |
| After a failed search, check albums/favourites/starred | 3 |
| After a failed search, check device folders | 3 |
| Think "Google Photos may not understand what I'm looking for" | 4 |

**10 out of 13** survey respondents indicated they want some form of system-guided search assistance (suggestions, more detail options, or memory description help).

#### Gap Summary

| What Users Need | What System Provides |
|---|---|
| Suggestions after a failed search ("did you mean...?") | Nothing — blank state |
| Autocomplete while typing | Generic category suggestions only |
| Refinement filters (year, person, place) after initial results | No post-search filters |
| Progressive narrowing through conversation | One-shot keyword lookup |

---

### Finding 2: The Semantic Gap — Unreliable Multi-Constraint Understanding

**The gap:** Users remember photos as **episodes** (who was there + where it was + what was happening + what it looked like). Google Photos search can understand some natural-language and visual context — as demonstrated by Naina's successful searches — but its ability to **combine multiple constraints consistently is unreliable and unpredictable**. Users cannot predict which details the system can use to narrow a search, leading to a trial-and-error process with inconsistent outcomes.

#### Evidence from AI Discovery Engine

Theme T2 — *"The Semantic Gap: Specifics vs. Vagueness"* — was one of the dominant themes discovered by the LLM analysis:

> *"Users attempt to search using rich, specific contextual details (such as exact addresses, specific people's names, or unique events like 'pinwheel') that the search engine fails to map to visual metadata or EXIF data. The system appears to only understand broad, generic keywords."*

Failure Point C (Search Understanding) accounts for **32.4%** (36 of 111) of all coded journeys — the system simply doesn't understand what the user is asking for:

Evidence quotes:
> *"I put an address in the search field and nothing useless."* — App Store review  
> *"Search is absolutely worthless."* — App Store review  
> *"looked for pinwheel cant find it"* — App Store review

User Segment S2 — "The Semantic Specifics Seekers" — represents **31.5%** of the corpus (35 users):
- These users input *long, specific natural language queries* (street addresses, unique object names)
- They rely on *previously applied custom labels*
- Their dominant failure points are C (Search Understanding), B (Query Formulation), and A (Memory Expression)

#### Evidence from User Interviews

The interviews revealed that the system's ability to handle multi-dimensional queries is **inconsistent and unpredictable**:

| Memory Dimension | User | What They Searched | Result |
|---|---|---|---|
| **Activity / Event** | Ishwar | "Pictures of gardening" (an office tree-planting event) | ❌ "No results found" |
| **Activity + Object** | Ishwar | "Planting trees" | ⚠️ Random results — dashboards, hills, lawns |
| **Angle / Direction** | Resham | Wanted a "front-facing" Ganpati decoration photo | ❌ Got a side-facing one; system has no concept of angle |
| **Person + Location** | Pritish | "Anuj photos of Rajasthan" | ⚠️ Got Saurabh's photos mixed in (wrong person) |
| **Person + Specific Date** | Pritish | "Prachi Vakhre bill of 12-12-2023" | ❌ Failed — system can't combine person + specific date |
| **Clothing + Location** | Naina | "wearing white top and standing near temple" | ✅ Worked — Naina successfully combined 3 constraints |
| **Visual description** | Naina | "standing near fort" | ✅ Worked for a simple visual description |

**Key observation:** The system works well for simple, single-dimension searches (one place name, one person name) and can *sometimes* handle multi-constraint natural-language queries (as Naina demonstrated). However, multi-constraint searches fail unpredictably — which is critical because that is how real memories work. **Users cannot reliably predict which combinations of details the system can process.**

Resham articulated this clearly:
> *"Maybe I should have mentioned the direction... like front-facing or something like that. I wanted the photo from this angle... so maybe it would have sorted and given it."*

**The Specificity Paradox (key sub-finding):** Adding more details sometimes makes results *worse*, not better:
- Pritish: "Prachi Vakhre bill" → ✅ all bills found. "Prachi Vakhre bill of 12-12-2023" → ❌ failed.
- Naina: year-specific search "2026 photos of mine" → ❌ failed.
- Yet Naina: "wearing white top and standing near temple" → ✅ worked.

This is one of the most important insights from the research: **users cannot predict which additional details will help vs. hurt the search.** The system's ability to compose constraints is inconsistent — sometimes adding a date breaks a working query, sometimes adding clothing + location succeeds. This unpredictability connects Finding 1 and Finding 2: because users cannot predict which refinement will work, they especially need system guidance (Finding 1) to navigate the gap (Finding 2).

#### Evidence from Survey

| What Users Remember | Count (of 13) | Rank |
|---|---|---|
| Where it was taken (city, place, venue) | 5 | 🥇 Most common |
| Who was in it | 3 | 🥈 |
| A specific object or visual detail | 3 | 🥈 |
| What was happening (activity or event) | 1 | |
| When it was taken (year, season, occasion) | 1 | |

Survey data confirms: **location** is the strongest memory anchor, followed by **people** and **visual details**. But the system excels at location search (verified in interviews — place names generally work) and struggles with the rest.

Respondent improvement suggestions:
> *"Using face recognition AI in it"* — Pritish  
> *"Specific face match, name or place"* — Anonymous respondent  
> *"The details in the pic"* — Paras  
> *"I will change the app UI"* — Aditi  

#### Gap Summary

| How Users Remember Photos | What System Can Search | Observed Outcome |
|---|---|---|
| "The café in Goa with the blue wall on New Year's" | "Goa" OR "café" separately | Unpredictable — some combinations work, others don't |
| "Front-facing Ganpati decoration from last year" | "Ganpati" (no angle, no context) | ❌ Only side-facing photo found |
| "Planting trees at our office event" | "Trees" (doesn't understand "planting" as activity) | ❌ Random results |
| Person + Place + Time combined | Sometimes works, sometimes fails | ⚠️ Unpredictable |
| "Wearing white top and standing near temple" | Combination of clothing + location | ✅ Worked for Naina |
| Clothing, mood, angle, background colour | Inconsistently indexed | ⚠️ No way for user to know in advance |

---

### Finding 3: Search Coverage & Trust Gaps — Users Can't Tell Why Photos Are Missing

**The gap:** Users cannot always tell whether a missing photo is absent because they searched incorrectly, because search couldn't understand the query, or because the photo isn't included in the searchable set. The search boundary is opaque — shared albums, partially synced content, and inconsistent face clustering all create situations where results may be silently incomplete, but the system provides no transparency signal to help users understand what's happening.

#### Evidence from AI Discovery Engine

**Theme T1 — "The Indexing Black Hole"** (the most dominant theme):
> *"A dominant pattern where users report that specific media (device photos, backed up content, starred items) is present locally or in the library but is invisible to the search engine. This is not just a keyword mismatch, but a complete failure of the indexing pipeline."*

**Segment S1 — "The Disconnected Localists"** — the **largest segment** at 37.8% (42 users):
- These users perceive Google Photos as a local gallery extension
- They experience "a severe disconnection where locally present or recently synced photos are invisible to the search index"
- Dominant behaviour: *"Abandoning search after 1-2 failed attempts due to high anxiety over data safety"*

**Face Recognition failures** formed their own segment in the broader `llm_insights`:
> *"Users who rely on facial recognition for organization but experience inaccurate grouping, missing faces, or inability to manually tag."*  
> Pain points: "Faces incorrectly grouped or omitted", "People disappear from face albums", "No option to manually add or correct faces"

Evidence quotes:
> *"Can't find my device photos even if I backed everything up."* — App Store review  
> *"Incredibly stupid how it can't find photos from my gallery"* — App Store review

#### Evidence from User Interviews

**Face Recognition Inconsistencies:**

| User | What Happened | Impact | Evidence Strength |
|---|---|---|---|
| **Ishwar** | Assigned name "Saurabh" to one face in a dhaba photo. Searched "Pictures of Saurabh" → only returned photos from that one dhaba event. All other photos of Saurabh were invisible. | User perceived incomplete results | ⚠️ Moderate — Ishwar's primary app is Samsung Gallery, not Google Photos, and his sync was partially off. This may be a setup/sync issue rather than a face recognition failure. |
| **Pritish** | Searched "Anuj photos of Rajasthan" → got irrelevant photos of other people (including Saurabh) mixed into results. | Wrong people included in person-based search | ✅ Strong — Pritish is an active Google Photos user with face names configured |
| **Naina** | Uses face clusters as primary retrieval method (clicks on person's face group → screenshots the photo). Noted *"you have to take a screenshot, it doesn't give a direct download option."* | Workaround-dependent — face search works but retrieval after finding is broken | ✅ Strong — direct observation |

**Search Scope Boundaries (shared content, cross-app storage):**

| User | What Happened | Interpretation |
|---|---|---|
| **Resham** | Shared folders are not searchable. Tried searching for shared content → *"No, it's not coming up. On searching."* Confirmed: *"The shared folder is not visible."* | This may represent a deliberate search scope boundary rather than a failure — but from the user's perspective, the expected content is simply missing from results with no explanation. |
| **Ishwar** | iPhone user. *"Maximum iPhone users don't use Google Photos at all. Even my sync is half off."* No option to enable Gemini on iPhone. | Ishwar's experience reflects partial platform adoption rather than a Google Photos subsystem failure. However, it illustrates how users with incomplete sync have an unreliable search scope. |
| **Pritish** | iPhone user with 128GB storage. Uses Google Drive as overflow: *"Space falls short on the iPhone, so I uploaded photos on Drive as well."* | Photos stored in Drive are outside the Google Photos search corpus. This is a product boundary, not a bug — but users don't distinguish between the two. |

**The core insight:** Whether these are technical subsystem failures, product scope decisions, or user setup issues, **the user experience is the same**: search results may be silently incomplete, and the system provides no signal to help users understand whether a missing photo means "wrong query", "photo not indexed", or "photo outside search scope."

#### Evidence from Survey

| Signal | Count |
|---|---|
| Think "Google Photos may not have backed it up properly" | 3 |
| After failed search, check device folders | 3 |
| Have checked multiple places (albums, favourites, device) | 7 say "yes, sometimes" or "yes, often" |
| Want "specific face match" | 1 |
| Want "option to remove duplicate photos" | 1 |

**7 out of 13** survey respondents report checking multiple locations — albums, favourites, device folders — after a failed search. This multi-location checking behaviour suggests that users don't fully trust that search results are comprehensive, so they manually verify across multiple places.

#### Gap Summary

| User Expectation | Observed Reality | Nature of the Gap |
|---|---|---|
| "If I backed it up, search should find it" | Backed-up content may not appear in search results | Could be indexing delay, sync issue, or search scope — users can't tell |
| "If I named a face, all their photos should appear" | Face-based search returns inconsistent results | Face clustering quality varies; no transparency about coverage |
| "Shared albums should be searchable" | Shared content appears to be outside search scope | May be a deliberate product boundary, but users expect it to work |
| "When search returns results, it's showing me everything" | No signal indicating whether results are complete or partial | System provides no feedback on search coverage or confidence |

---

## Prioritisation

### Scoring Methodology

Each finding is scored on four dimensions (each 1–5), then weighted. These scores are **researcher-assigned judgments** based on the evidence reviewed — they are useful for structuring our thinking and communicating relative priority, but should not be treated as statistically derived or objectively precise.

| Dimension | Weight | What It Measures |
|---|---|---|
| **Evidence Strength** | 30% | How many sources confirm this finding? How robust is the evidence? |
| **User Impact** | 30% | How severely does this affect the user's ability to retrieve photos? |
| **Frequency** | 20% | How often does this problem occur across the user base? |
| **Relevance to Core Question** | 20% | How directly does this relate to the retrieval journey we're investigating? (Context.md §2) |

> **Note on overlap:** F (Search Recovery) and G (Abandonment) are downstream stages that can follow failures at earlier points (C, D). The frequency scores for Finding 1 partly reflect the same failed journeys that contribute to Finding 2. The scores capture relative priority, not independent measurement.

### Scoring Matrix

| Dimension | Finding 1: Dead-End Search | Finding 2: Semantic Gap | Finding 3: Search Coverage & Trust Gaps |
|---|---|---|---|
| **Evidence Strength** (max 5) | **5** — Confirmed in all 4 sources. 48.6% of journeys hit this. All 4 interview participants experienced it in real time. 10/13 survey respondents want guided search. | **5** — Confirmed in all 4 sources. Theme T2 + Segment S2 in discovery engine. Demonstrated live in interviews. Survey confirms memory anchor types. | **4** — Strong in interviews (Ishwar face search, Resham shared folders). Discovery engine Theme T1 (largest theme). Less directly measurable in survey. |
| **User Impact** (max 5) | **5** — Co-occurs with 48.6% abandonment rate. The lack of recovery guidance is strongly associated with the end of the search journey. | **4** — Causes frustration and wasted effort, but users sometimes find workarounds (Naina composed a 3-part query manually). Doesn't always end in abandonment. | **4** — When it hits, impact is severe (photos perceived as missing = anxiety about data loss). But it doesn't affect every search — only person-based and cross-device scenarios. |
| **Frequency** (max 5) | **5** — Happens on virtually every failed search. F (search recovery) and G (abandonment) each appear in 48.6% of all coded journeys. | **4** — C (search understanding) appears in 32.4% of journeys. Segment S2 is 31.5% of corpus. Very common but not as universal as the dead-end problem. | **3** — S1 (disconnected localists) is 37.8% of corpus, but many of those overlap with other failures. Face search issues are a subset of all searches. |
| **Relevance to Core Question** (max 5) | **5** — Directly answers "where are users failing?" — at the recovery/refinement stage. This is the moment between "search failed" and "I give up." | **5** — Directly answers "where are users failing?" — at the query formulation and system understanding stage. This is the mismatch between memory and search language. | **4** — Answers "where are users failing?" — but at a system/infrastructure level rather than a user interaction level. Important but less directly actionable in the search UX. |

### Final Priority Scores

| Rank | Finding | Evidence (×0.30) | Impact (×0.30) | Frequency (×0.20) | Relevance (×0.20) | **Total** |
|---|---|---|---|---|---|---|
| **🥇 1** | **Finding 1: Dead-End Search** | 5 × 0.30 = 1.50 | 5 × 0.30 = 1.50 | 5 × 0.20 = 1.00 | 5 × 0.20 = 1.00 | **5.00** |
| **🥈 2** | **Finding 2: Semantic Gap** | 5 × 0.30 = 1.50 | 4 × 0.30 = 1.20 | 4 × 0.20 = 0.80 | 5 × 0.20 = 1.00 | **4.50** |
| **🥉 3** | **Finding 3: Search Coverage & Trust Gaps** | 4 × 0.30 = 1.20 | 4 × 0.30 = 1.20 | 3 × 0.20 = 0.60 | 4 × 0.20 = 0.80 | **3.80** |

### Prioritisation Summary

```
 PRIORITY 1 ████████████████████████████████████████████████████  5.00
 Finding 1: Dead-End Search — No Recovery Path

 PRIORITY 2 ██████████████████████████████████████████████████    4.50
 Finding 2: Semantic Gap — Memory vs. Keywords

 PRIORITY 3 ████████████████████████████████████████              3.80
 Finding 3: Search Coverage & Trust Gaps
```

### Why This Order?

**Finding 1 is the highest-leverage intervention point** because it sits at the stage where most search journeys break down. Regardless of the upstream cause — whether it's a semantic gap (Finding 2) or a search coverage issue (Finding 3) — the lack of recovery support is strongly associated with abandonment. Addressing Finding 1 would provide users with a path forward even when the initial search is imperfect.

**Finding 2 is #2** because it explains *why* many initial searches produce insufficient results. It affects a large portion of users (31.5% of corpus = "Semantic Specifics Seekers") and represents an inconsistency in how the system handles multi-dimensional queries. However, as Naina demonstrated, the system *can* sometimes handle natural-language multi-constraint queries — the problem is unpredictability, not complete inability.

**Finding 3 is #3** because while its impact is severe when it occurs, it affects a narrower set of interactions (face-based search, cross-device scenarios, shared albums) and some of the evidence is less directly validated by our primary research. It also involves product boundaries and infrastructure-level issues that may require different intervention strategies.

---

## How the Findings Connect

The three findings are **not competing problems** — they describe different stages of the same retrieval journey:

```
 Finding 2                     Finding 1                     Finding 3
 WHY initial searches          WHAT happens after            WHY users can't trust
 can fail                      a failure                     the results
 ─────────────────             ──────────────────            ────────────────────
 User's multi-dimensional      First search returns          User doesn't know if
 memory doesn't reliably       poor/incomplete results       results are complete
 translate to search terms     → no adaptive guidance        or partial
                               → user struggles to refine
       │                              │                            │
       │                              │                            │
       ▼                              ▼                            ▼
 Initial search produces      User tries different          User checks multiple
 broad or wrong results       keywords, scrolls, browses    places (albums, device,
                              folders — without help        favourites) manually
       │                              │                            │
       └──────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
                            RETRIEVAL DIFFICULTY
                          (48.6% abandonment rate,
                           74% high frustration)
```

**Finding 2 = why the first search can fail.** The system's inconsistent handling of multi-constraint queries means users often get broad or irrelevant results on their first attempt.

**Finding 1 = what happens after it fails.** Without adaptive recovery support, users are left guessing which additional details might help — and the Specificity Paradox means their guesses are sometimes counterproductive.

**Finding 3 = why users can't trust the results.** Opaque search coverage means users don't know if a missing photo is a query problem or a scope/indexing problem, so they can't choose the right recovery strategy.

Addressing Finding 1 is the highest-leverage intervention because it would help users recover from failures caused by *all three* issues — providing guidance when the semantic gap causes bad results, and transparency when coverage gaps cause incomplete results.

---

## Appendix A: Evidence Source Summary

### AI Discovery Engine Output Files

| File | Description | Location |
|---|---|---|
| `phase4a_relevant.json` | 111 reviews classified as relevant to photo retrieval | [phase4a_relevant.json](file:///h:/Antigravity/Google%20photo%20Discovery/data/phase4/phase4a_relevant.json) |
| `phase4b_journeys.json` | Structured journey extractions for all 111 reviews | [phase4b_journeys.json](file:///h:/Antigravity/Google%20photo%20Discovery/data/phase4/phase4b_journeys.json) |
| `phase4c_aggregation.json` | Statistical aggregations — failure distributions, co-occurrences | [phase4c_aggregation.json](file:///h:/Antigravity/Google%20photo%20Discovery/data/phase4/phase4c_aggregation.json) |
| `phase4d_themes.json` | 4 themes + 5 pain points + 2 unexpected patterns | [phase4d_themes.json](file:///h:/Antigravity/Google%20photo%20Discovery/data/phase4/phase4d_themes.json) |
| `phase4e_segments.json` | 4 user segments with evidence | [phase4e_segments.json](file:///h:/Antigravity/Google%20photo%20Discovery/data/phase4/phase4e_segments.json) |
| `phase4f_hypotheses.json` | 6 research hypotheses with interview questions | [phase4f_hypotheses.json](file:///h:/Antigravity/Google%20photo%20Discovery/data/phase4/phase4f_hypotheses.json) |
| `llm_insights_full.json` | Full LLM insights across all review segments | [llm_insights_full.json](file:///h:/Antigravity/Google%20photo%20Discovery/llm_insights_full.json) |

### Interview Participants

| Participant | Device | Primary Photo App | Key Behaviour Observed |
|---|---|---|---|
| **Ishwar** | iPhone | Samsung Gallery (not Google Photos) | Search failed for "gardening" and "planting trees". Face assignment only linked to one event. Gemini not available on iPhone. |
| **Resham** | Realme (Android) | Google Photos (primary) | Searched for Ganpati decoration → failed to find specific angle. Scrolled 15-20 min before giving up. Shared folders not searchable. |
| **Naina** | Android | Google Photos (primary) | Successfully composed multi-part query. Uses face clusters → screenshots. Wants autocomplete and camera search (like Google Lens). |
| **Pritish** | iPhone (128GB) | Google Photos + Google Drive | Uses face names heavily. Document/bill retrieval works for broad search but fails for specific dates. Wants Google Lens-style visual search. |

### Survey Respondents (13 total)

| Profile | Count |
|---|---|
| Using Google Photos 3+ years | 10/13 (77%) |
| Library size 500–10,000+ photos | 12/13 (92%) |
| Have experienced "can't find a specific photo" | 10/13 (77%) |
| Check multiple places after failed search | 7/13 (54%) |
| Try 2-5 different searches before giving up | 11/13 (85%) |

---

## Appendix B: Failure Point Reference (from Context.md §7)

| Code | Failure Point | Description | Discovery Engine % | Interview Confirmation |
|---|---|---|---|---|
| **A** | Memory Expression | User has a memory but struggles to describe it | 9.0% | Ishwar didn't know the right words to search "gardening" event |
| **B** | Query Formulation | User describes memory but doesn't know what terms to search | 17.1% | Ishwar: face naming was prerequisite he didn't know about |
| **C** | Search Understanding | User submits reasonable query but system doesn't understand context | 32.4% | Pritish: specific date added to working query broke it |
| **D** | Result Relevance | Results don't contain expected photo or are insufficiently relevant | 41.4% | Pritish: got 2000 photos instead of specific one; wrong person's photos mixed in |
| **E** | Result Evaluation | Too many results make it hard to find the correct photo | 8.1% | Pritish: "it gave Anuj's photos among the 2000 photos" |
| **F** | Search Recovery | First search fails and user doesn't know how to refine | 48.6% | All 4 participants: no useful contextual guidance observed during live tasks |
| **G** | Abandonment | User eventually stops trying | 48.6% | Resham: "scrolled 15-20 minutes... just left it" |
