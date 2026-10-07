import styles from "./page.module.css";

const insights = [
  {
    id: "Finding 1",
    title: "Dead-End Search",
    subtitle: "Insufficient Recovery Support After Failure",
    description: "When a user's first search does not produce the desired photo, the system provides no useful contextual guidance for recovering from the failed or insufficient search.",
    evidence: "F (Search Recovery) and G (Abandonment) each appear in 48.6% of all coded journeys extracted from app reviews. Users consistently report frustration over lack of 'did you mean...' style assistance.",
    priority: "5.00 / 5.00 - Highest leverage intervention point.",
    rank: 1
  },
  {
    id: "Finding 2",
    title: "Search understanding",
    subtitle: "Unreliable Multi-Constraint Understanding",
    description: "Users remember photos as episodes (who was there + where it was + what was happening). While Google Photos search can understand natural-language context, its ability to combine multiple constraints consistently is unreliable.",
    evidence: "Failure Point C (Search Understanding) accounts for 41.4% of all coded journeys. Segment S2 ('The Semantic Specifics Seekers') represents 31.5% of the corpus.",
    priority: "4.50 / 5.00 - Affects a large portion of users.",
    rank: 2
  },
  {
    id: "Finding 3",
    title: "Silent/Missing Photos",
    subtitle: "Users Can't Tell Why Photos Are Missing",
    description: "Users cannot always tell whether a missing photo is absent because they searched incorrectly, because search couldn't understand the query, or because the photo isn't included in the searchable set (e.g. shared folders, un-synced data).",
    evidence: "Theme T1 ('The Indexing Black Hole') was the dominant theme. Segment S1 ('The Disconnected Localists') is the largest segment at 32.4%. Users report checking multiple local folders when cloud search fails.",
    priority: "3.80 / 5.00 - Severe impact but affects a narrower set of interactions.",
    rank: 3
  }
];

export default function InsightsPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Behavioural Insights</h1>
        <p className="page-description">Detailed breakdown of the 3 major research findings derived directly from the AI Discovery Engine's analysis of 13k+ scraped reviews.</p>
      </header>

      <div className={styles.insightsList}>
        {insights.map(insight => (
          <div key={insight.id} className={styles.insightCard}>
            <div className={styles.insightHeader}>
              <div className={styles.rankBadge}>Priority {insight.rank}</div>
              <div>
                <div className={styles.insightId}>{insight.id}</div>
                <h2 className={styles.insightTitle}>{insight.title}</h2>
                <h3 className={styles.insightSubtitle}>{insight.subtitle}</h3>
              </div>
            </div>
            
            <div className={styles.insightBody}>
              <div className={styles.block}>
                <h4 className={styles.blockTitle}>The Gap</h4>
                <p className={styles.blockText}>{insight.description}</p>
              </div>
              
              <div className={styles.block}>
                <h4 className={styles.blockTitle}>Evidence Base</h4>
                <p className={styles.blockText}>{insight.evidence}</p>
              </div>

              <div className={styles.scoreBlock}>
                <strong>Score:</strong> {insight.priority}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
