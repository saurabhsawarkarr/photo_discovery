import styles from "./page.module.css";

const pipelineSteps = [
  {
    step: 1,
    name: "Data Collection",
    description: "Source collectors scrape public review pages and discussions. Generates a deterministic record_id to prevent duplicates.",
    details: "Sources: Google Play Store, Apple App Store, Reddit API, YouTube Data API, Google Support Community."
  },
  {
    step: 2,
    name: "Cleaning & Normalization",
    description: "Strips HTML, normalizes whitespace and dates, and flags extremely short records. Uses fuzzy deduplication (MinHash).",
    details: "All raw data is immutable. Cleaned records are linked back to the raw source."
  },
  {
    step: 3,
    name: "Relevance Filtering",
    description: "Two-pass approach: A fast keyword filter (relevant vs irrelevant), followed by an LLM classification pass for ambiguous records.",
    details: "Only sends potentially relevant records to the LLM to save costs."
  },
  {
    step: 4,
    name: "LLM Structured Extraction",
    description: "Relevant records are sent to the LLM in batches (10-20 records) using a strict JSON schema.",
    details: "Extracts failure points (A-G), memory clues, search attempts, frustration signals, and search outcomes."
  },
  {
    step: 5,
    name: "Analytics & Segmentation",
    description: "Aggregates the structured extraction results. The LLM analyzes the data to discover emergent user segments.",
    details: "Segments are strictly data-driven and linked back to the specific evidence quotes."
  }
];

export default function PipelinePage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Pipeline Architecture</h1>
        <p className="page-description">Overview of the 5-stage data processing pipeline for the AI Discovery Engine.</p>
      </header>

      <div className={styles.pipelineContainer}>
        {pipelineSteps.map((step, index) => (
          <div key={step.step} className={styles.pipelineNode}>
            <div className={styles.stepNumber}>{step.step}</div>
            <div className={styles.stepContent}>
              <h2 className={styles.stepName}>{step.name}</h2>
              <p className={styles.stepDesc}>{step.description}</p>
              <div className={styles.stepDetails}>
                <strong>Technical Details:</strong> {step.details}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.techStack}>
        <h2 className={styles.stackTitle}>Core Technology Stack</h2>
        <div className={styles.stackGrid}>
          <div className={styles.stackItem}>
            <strong>Backend:</strong> Node.js, TypeScript, BullMQ
          </div>
          <div className={styles.stackItem}>
            <strong>Database:</strong> PostgreSQL 16, Redis
          </div>
          <div className={styles.stackItem}>
            <strong>LLM Integration:</strong> Groq API, Structured JSON Out
          </div>
          <div className={styles.stackItem}>
            <strong>Frontend:</strong> Next.js 14 (App Router)
          </div>
        </div>
      </div>
    </div>
  );
}
