import styles from "./page.module.css";

const segments = [
  {
    id: "S1",
    name: "The Disconnected Localists",
    size: "37.8%",
    count: "42 Users",
    description: "These users perceive Google Photos as a local gallery extension. They experience a severe disconnection where locally present or recently synced photos are invisible to the search index.",
    dominantBehavior: "Abandoning search after 1-2 failed attempts due to high anxiety over data safety.",
    dominantFailures: ["C (Search Understanding)", "G (Abandonment)"]
  },
  {
    id: "S2",
    name: "The Semantic Specifics Seekers",
    size: "31.5%",
    count: "35 Users",
    description: "These users input long, specific natural language queries (street addresses, unique object names, specific clothing) relying on precise memory.",
    dominantBehavior: "Trying to combine multiple constraints (e.g. Person + Location + Time) which the system fails to parse predictably.",
    dominantFailures: ["C (Search Understanding)", "B (Query Formulation)", "A (Memory Expression)"]
  }
];

export default function SegmentsPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">User Segments</h1>
        <p className="page-description">LLM-generated user segments based on retrieval behaviour, memory type, and failure patterns derived from the evidence corpus.</p>
      </header>

      <div className={styles.segmentGrid}>
        {segments.map(segment => (
          <div key={segment.id} className={styles.segmentCard}>
            <div className={styles.segmentHeader}>
              <div>
                <span className={styles.segmentId}>{segment.id}</span>
                <h2 className={styles.segmentName}>{segment.name}</h2>
              </div>
              <div className={styles.segmentSizeBadge}>
                {segment.size} ({segment.count})
              </div>
            </div>

            <div className={styles.segmentBody}>
              <p className={styles.segmentDescription}>{segment.description}</p>
              
              <div className={styles.detailsBox}>
                <h3 className={styles.detailsTitle}>Dominant Behavior</h3>
                <p className={styles.detailsText}>{segment.dominantBehavior}</p>
              </div>

              <div className={styles.detailsBox}>
                <h3 className={styles.detailsTitle}>Associated Failure Points</h3>
                <div className={styles.pillContainer}>
                  {segment.dominantFailures.map(fp => (
                    <span key={fp} className={styles.failurePill}>{fp}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.infoBox}>
        <strong>Note:</strong> The AI segmented the remaining ~30% of users into two smaller groups related to Face Recognition and Album Organizers, which exhibited varying failure patterns.
      </div>
    </div>
  );
}
