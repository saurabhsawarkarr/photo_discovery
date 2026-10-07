import styles from "./page.module.css";
import Link from "next/link";
import fs from 'fs';
import path from 'path';
import OverviewCharts from './OverviewCharts';
import UserSegmentsChart from './UserSegmentsChart';
// Actual data from Findings.md for static content
const failureThemes = [
  { id: 'F', theme: 'Search Recovery', volume: '48.6%', description: 'First search fails, no refinement guidance', trend: 'high' },
  { id: 'G', theme: 'Abandonment', volume: '48.6%', description: 'User eventually stops trying', trend: 'high' },
  { id: 'D', theme: 'Result Relevance', volume: '41.4%', description: 'Results don\'t contain expected photo', trend: 'high' },
  { id: 'C', theme: 'Search Understanding', volume: '32.4%', description: 'System doesn\'t understand context', trend: 'medium' },
  { id: 'B', theme: 'Query Formulation', volume: '17.1%', description: 'User doesn\'t know what terms to search', trend: 'medium' },
  { id: 'A', theme: 'Memory Expression', volume: '9.0%', description: 'User struggles to describe memory', trend: 'low' },
  { id: 'E', theme: 'Result Evaluation', volume: '8.1%', description: 'Too many results, hard to find photo', trend: 'low' },
];

export default async function Home() {
  // Read JSON data directly from the data directory
  const dataDir = path.join(process.cwd(), '..', 'data', 'phase4');
  
  const readJson = (filename: string) => {
    try {
      const filePath = path.join(dataDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (e) {
      console.error(`Error reading ${filename}`, e);
      return null;
    }
  };

  const stats = readJson('phase4c_aggregation.json');
  const segmentsData = readJson('phase4e_segments.json');
  const themesData = readJson('phase4d_themes.json');

  let failureDistribution = [];
  let segments = [];
  
  if (stats && segmentsData) {
    const failurePointsMap: Record<string, string> = {
      'A': 'Memory Expression',
      'B': 'Query Formulation',
      'C': 'Search Understanding',
      'D': 'Result Relevance',
      'E': 'Result Evaluation',
      'F': 'Search Recovery',
      'G': 'Abandonment',
    };

    failureDistribution = Object.entries(stats.failure_point_distribution).map(([key, value]: any) => ({
      name: failurePointsMap[key] || key,
      id: key,
      count: value.count,
      percentage: parseFloat(value.percentage),
    })).sort((a, b) => b.count - a.count);

    segments = segmentsData.segments.map((seg: any) => ({
      name: seg.segment_name,
      size: seg.size,
      percentage: parseFloat(seg.percentage_of_corpus),
    }));
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Google Photos Discovery Engine</h1>
        <p className="page-description">AI-powered analysis of user retrieval failures and frustration points.</p>
      </header>

      {/* Hypothesis Section */}
      <section className={styles.hypothesisBanner}>
        <div className={styles.hypothesisIcon}>💡</div>
        <div className={styles.hypothesisText}>
          <strong>Core Hypothesis:</strong> Users fail to retrieve vaguely remembered photos not because they are lost, but because there is a mismatch between how they remember the photo (contextual episodes) and how the system searches (rigid keywords).
        </div>
      </section>

      <section className={styles.executiveSummary}>
        <h2 className={styles.sectionTitle}>Executive Overview</h2>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>13,252</div>
            <div className={styles.kpiLabel}>Total Scraped Reviews</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>111</div>
            <div className={styles.kpiLabel}>Structured User Journeys</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>5</div>
            <div className={styles.kpiLabel}>Data Sources Analysed</div>
            <div className={styles.kpiSubText}>Play Store, App Store, Reddit, YouTube, Community</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>7</div>
            <div className={styles.kpiLabel}>Failure Themes Generated</div>
          </div>
        </div>
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.leftColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>How the Discovery Engine Works</h2>
            <div className={styles.pipelineFlow}>
              <div className={styles.pipelineStep}>1. Collection (13k+ raw reviews)</div>
              <div className={styles.pipelineArrow}>↓</div>
              <div className={styles.pipelineStep}>2. Cleaning & Deduplication</div>
              <div className={styles.pipelineArrow}>↓</div>
              <div className={styles.pipelineStep}>3. Relevance Filtering</div>
              <div className={styles.pipelineArrow}>↓</div>
              <div className={styles.pipelineStep}>4. LLM Structured Extraction (111 Journeys)</div>
              <div className={styles.pipelineArrow}>↓</div>
              <div className={styles.pipelineStep}>5. AI Segmentation & Analytics</div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Key Findings</h2>
            <div className={styles.findingsContent}>
              <div className={styles.findingItem}>
                <h3>1. Dead-End Search</h3>
                <p>Insufficient recovery support after an initial failed search. 48.6% of journeys end in abandonment because users aren&apos;t guided on how to refine their queries.</p>
              </div>
              <div className={styles.findingItem}>
                <h3>2. Search understanding</h3>
                <p>Unreliable multi-constraint understanding. Users remember photos as episodes (who + where + what), but combining these constraints leads to unpredictable search failures.</p>
              </div>
              <div className={styles.findingItem}>
                <h3>3. Silent/Missing Photos</h3>
                <p>Users cannot tell if a photo is missing due to a bad search or because it isn&apos;t indexed (e.g., in a shared album or on device only). Leads to anxiety over data loss.</p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>LLM Hypotheses & Actionable Insights</h2>
            <div className={styles.findingsContent}>
              <div className={styles.findingItem}>
                <h3>H1: The Verification Loop</h3>
                <p>Disconnected Localists (S1) perceive search as a mirror of local storage. They search for known, visible photos to confirm backup integrity rather than to retrieve new information.</p>
              </div>
              <div className={styles.findingItem}>
                <h3>H2: Conflating Absence with Loss</h3>
                <p>The indexing gap causes a complete breakdown in trust. Users conflate the absence of a search result with permanent data loss, rather than a temporary indexing delay.</p>
              </div>
              <div className={styles.findingItem}>
                <h3>H3: The Semantic Database Expectation</h3>
                <p>Specifics Seekers (S2) hold a mental model of search as a precise database tool. When episodic details fail, they blame the system&apos;s natural language understanding rather than missing metadata.</p>
              </div>
              <div className={styles.findingItem}>
                <h3>H5: The &quot;Hidden Place&quot; Effect</h3>
                <p>Fragmented mental models cause users to believe items are being moved by the system without consent, leading to excessive folder-hopping to locate a single photo.</p>
              </div>
            </div>
          </div>
          
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>User Workarounds (Extracted via LLM)</h2>
            <ul className={styles.highlightsList}>
              <li><strong>Manual Scrolling:</strong> Users report scrolling through years of timelines after search fails.</li>
              <li><strong>Local Disconnect:</strong> Large percentage of users check device folders and express anxiety over data safety when cloud search fails.</li>
              <li><strong>Specificity Paradox:</strong> Adding more constraints (e.g., adding an exact date) often breaks the query unpredictably, leading to abandonment.</li>
              <li><strong>Album Reliance:</strong> Users attempt to bypass search entirely by manually organizing albums, which fails at scale.</li>
            </ul>
          </div>
        </section>

        <section className={styles.rightColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Frustration Profile</h2>
            <div className={styles.sentimentBar}>
              <div className={styles.sentimentHigh} style={{ width: '74%' }}>74%</div>
              <div className={styles.sentimentMedium} style={{ width: '18%' }}>18%</div>
              <div className={styles.sentimentLow} style={{ width: '8%' }}>8%</div>
            </div>
            <div className={styles.sentimentLegend}>
              <span><span className={styles.dotHigh}></span> High</span>
              <span><span className={styles.dotMedium}></span> Medium</span>
              <span><span className={styles.dotLow}></span> Low</span>
            </div>
          </div>

          <div className={`${styles.card} ${styles.ctaCard}`}>
            <h2 className={styles.cardTitle}>Deep Dive with AI</h2>
            <p className={styles.ctaText}>Use our Live RAG Chatbot to query the raw evidence database, analyze transcripts, and drill down into segments.</p>
            <Link href="/ask" className={styles.primaryButton}>
              Open RAG Chatbot
            </Link>
          </div>

          {segments && segments.length > 0 && (
            <UserSegmentsChart segments={segments} />
          )}
        </section>
      </div>

      {stats && themesData && (
        <OverviewCharts 
          failureDistribution={failureDistribution} 
          themes={themesData.themes} 
        />
      )}
    </div>
  );
}
