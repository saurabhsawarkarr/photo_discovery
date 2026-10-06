# Google Photos AI Discovery Engine

The **Google Photos AI Discovery Engine** is a comprehensive, data-driven research tool and dashboard designed to analyze and visualize real-world user failures during photo retrieval. 

By scraping and processing thousands of unstructured public conversations and reviews, the Discovery Engine uses Large Language Models (LLMs) to identify the "Semantic Gap" between how users remember their photos (contextual episodes) and how systems currently search for them (rigid keywords).

---

## 🚀 Key Features

*   **Automated Data Ingestion:** Scrapes data from Google Play Store, Apple App Store, Reddit, YouTube, and Google Support Communities.
*   **Intelligent Processing Pipeline:** 
    *   Fuzzy deduplication to remove spam/noise.
    *   Two-pass relevance filtering (Heuristics + LLM Classification).
*   **Structured LLM Extraction:** Transforms emotional user rants into strict, structured JSON data using Groq API (Llama 3 / Mixtral models). Extracts failure points, memory clues, workarounds, and user segments.
*   **Live RAG Chatbot:** A Retrieval-Augmented Generation chatbot that allows researchers to query the database using natural language. **Crucially, every AI response is anchored to direct, clickable URL permalinks** to the original scraped evidence, completely preventing hallucinations.
*   **Dynamic Visual Dashboard:** A modern, Next.js (App Router) based frontend with Recharts, displaying:
    *   Failure Point Distributions (Points A–G)
    *   User Behavioral Segments
    *   Common Pain Patterns and Hypotheses

---

## 🏗️ Architecture

The system is split into two primary layers:

### Backend (Data Collection & Pipeline)
*   **Node.js & TypeScript:** Core runtime and pipeline orchestrator.
*   **BullMQ & Redis:** Manages rate-limiting, job queuing, and LLM batch execution.
*   **PostgreSQL 16:** Primary data warehouse storing both raw text and structured LLM analytics (via JSONB).
*   **Groq API:** Handles high-volume, low-latency AI extraction.

### Frontend (Dashboard)
*   **Next.js 14+:** React framework with server and client components.
*   **Recharts:** Interactive data visualization.
*   **Vanilla CSS Modules:** Minimalist, fast, and maintainable styling tailored to a clean, Google-inspired aesthetic.

For a deeper dive into the technical implementation, database schema, and LLM prompt design, please refer to the `Docs/Architecture.md` file.

---

## 📊 Data Insights

From our most recent scrape of **13,252 raw records**, the engine extracted **111 highly relevant structured user journeys**. 

**Primary Failure Modes Identified:**
*   **Search Recovery (48.65%):** Users fail their initial search and are given zero guidance on how to refine their queries, leading directly to abandonment.
*   **Result Relevance (41.44%):** The search returns results, but the specific expected photo is entirely missing.
*   **Search Understanding (32.43%):** The system completely fails to understand contextual or episodic multi-constraint queries (e.g., "Me at the beach with a red hat last summer").

---

## 🛠️ Quick Start (Development)

### Prerequisites
*   Node.js (v20+)
*   Docker (for PostgreSQL/Redis)
*   Groq API Key

### Setup
1. Clone the repository.
2. Run `npm install` in the root directory and the `frontend/` directory.
3. Start the infrastructure:
   ```bash
   docker-compose up -d
   ```
4. Start the frontend dashboard:
   ```bash
   cd frontend
   npm run dev
   ```
5. Visit `http://localhost:3000` to view the Discovery Engine.

---

## 📄 License
This project is for research and demonstration purposes. Data scraped belongs to the public domain or original platform holders as per their Terms of Service.
