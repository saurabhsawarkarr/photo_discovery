import styles from "./page.module.css";

const themes = [
  {
    id: "F",
    name: "Search Recovery",
    percentage: "48.6%",
    description: "First search fails and user doesn't know how to refine.",
    quote: `"followed the steps and still can't find what I need." - App Store review`,
    impact: "High - Leads directly to abandonment.",
    coOccurrence: "Co-occurs with Abandonment (27.0%) and Result Relevance (22.5%)"
  },
  {
    id: "G",
    name: "Abandonment",
    percentage: "48.6%",
    description: "User eventually stops trying.",
    quote: `"The simple act of trying to find a photo on a particular date is impossible... given up." - Play Store review`,
    impact: "Critical - Total failure of the retrieval journey.",
    coOccurrence: "Co-occurs heavily with Search Recovery failures."
  },
  {
    id: "D",
    name: "Result Relevance",
    percentage: "41.4%",
    description: "Results don't contain the expected photo or are insufficiently relevant.",
    quote: `"I search for a word and it gives me hundreds of unrelated photos." - App Store review`,
    impact: "High - Breaks trust in the search engine.",
    coOccurrence: "Often triggers Search Recovery challenges."
  },
  {
    id: "C",
    name: "Search Understanding",
    percentage: "32.4%",
    description: "User submits reasonable query but system doesn't understand context.",
    quote: `"I put an address in the search field and nothing useless." - App Store review`,
    impact: "Medium/High - The 'Semantic Gap' problem.",
    coOccurrence: "Linked to the 'Semantic Specifics Seekers' segment."
  },
  {
    id: "B",
    name: "Query Formulation",
    percentage: "17.1%",
    description: "User describes memory but doesn't know what terms to search.",
    quote: `"I know exactly what the photo looks like but search won't find it no matter what I type." - Play Store review`,
    impact: "Medium - Users struggle to map their memory to system keywords.",
    coOccurrence: "Often precedes Result Relevance issues."
  },
  {
    id: "A",
    name: "Memory Expression",
    percentage: "9.0%",
    description: "User has a memory but struggles to describe it.",
    quote: `"I can picture it in my head but can't find it in the app." - Play Store review`,
    impact: "Low/Medium - Internal user constraint.",
    coOccurrence: "N/A"
  },
  {
    id: "E",
    name: "Result Evaluation",
    percentage: "8.1%",
    description: "Too many results make it hard to find the correct photo.",
    quote: `"It just dumps 2000 photos of my dog when I want one specific day." - App Store review`,
    impact: "Low - Annoying but often manageable with scrolling.",
    coOccurrence: "N/A"
  }
];

export default function FailuresPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Failure Themes (A-G)</h1>
        <p className="page-description">Detailed breakdown of the 7 core retrieval failure points identified by the LLM analysis of 111 structured user journeys.</p>
      </header>

      <div className={styles.themesList}>
        {themes.map((theme) => (
          <div key={theme.id} className={styles.themeCard}>
            <div className={styles.themeHeader}>
              <div className={styles.themeTitleWrap}>
                <span className={styles.themeIdBadge}>{theme.id}</span>
                <h2 className={styles.themeName}>{theme.name}</h2>
              </div>
              <div className={styles.themePercentage}>{theme.percentage}</div>
            </div>
            
            <p className={styles.themeDescription}>{theme.description}</p>
            
            <div className={styles.themeDetailsGrid}>
              <div className={styles.detailBox}>
                <span className={styles.detailLabel}>Evidence Quote</span>
                <p className={styles.quoteText}>{theme.quote}</p>
              </div>
              <div className={styles.detailBox}>
                <span className={styles.detailLabel}>Impact & Co-Occurrence</span>
                <p className={styles.impactText}><strong>Impact:</strong> {theme.impact}</p>
                <p className={styles.impactText}><strong>Pattern:</strong> {theme.coOccurrence}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
