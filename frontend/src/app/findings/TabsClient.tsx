"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';

export default function TabsClient({
  findingsMd,
  journeys,
  aggregation,
  themes,
  segments,
  hypotheses,
}: {
  findingsMd: string;
  journeys: any;
  aggregation: any;
  themes: any;
  segments: any;
  hypotheses: any;
}) {
  const [activeTab, setActiveTab] = useState('findings');

  const tabs = [
    { id: 'findings', label: 'Findings' },
    { id: 'journeys', label: 'User Journeys' },
    { id: 'patterns', label: 'Patterns & Aggregation' },
    { id: 'themes', label: 'Themes & Pain Points' },
    { id: 'segments', label: 'User Segments' },
    { id: 'hypotheses', label: 'Research Hypotheses' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Google Photos Research Data</h1>
      </header>
      
      <div className={styles.tabContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className={styles.main}>
        <div className={styles.contentArea}>
          {activeTab === 'findings' && (
            <div className={styles.markdownBody}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{findingsMd}</ReactMarkdown>
            </div>
          )}
          {activeTab === 'journeys' && (
            <div className={styles.grid}>
              {journeys?.journeys?.slice(0, 50).map((j: any, idx: number) => (
                <div key={idx} className={styles.card}>
                  <h4>{j.user_id || `Journey ${idx + 1}`}</h4>
                  <p><strong>App:</strong> {j.app_source}</p>
                  <p><strong>Goal:</strong> {j.retrieval_goal}</p>
                  <p><strong>Outcome:</strong> {j.outcome}</p>
                  <p><strong>Frustration:</strong> <span className={styles.badge}>{j.frustration_level}</span></p>
                </div>
              ))}
              {journeys?.journeys?.length > 50 && <p>...and {journeys.journeys.length - 50} more.</p>}
            </div>
          )}
          {activeTab === 'patterns' && (
            <div className={styles.grid}>
              <div className={styles.card}>
                <h3>Failure Point Distribution</h3>
                <ul>
                  {aggregation?.failure_point_distribution && Object.entries(aggregation.failure_point_distribution).map(([key, val]: any) => (
                    <li key={key}><strong>Point {key}:</strong> {val.count} ({val.percentage}%)</li>
                  ))}
                </ul>
              </div>
              <div className={styles.card}>
                <h3>Outcome Distribution</h3>
                <ul>
                  {aggregation?.outcome_distribution && Object.entries(aggregation.outcome_distribution).map(([key, val]: any) => (
                    <li key={key}><strong>{key}:</strong> {val}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'themes' && (
            <div className={styles.grid}>
              {themes?.themes?.map((t: any) => (
                <div key={t.theme_id} className={styles.card}>
                  <h3>{t.theme_name}</h3>
                  <p>{t.description}</p>
                  <p><strong>Frustration:</strong> <span className={styles.badge}>{t.dominant_frustration}</span></p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'segments' && (
            <div className={styles.grid}>
              {segments?.segments?.map((s: any) => (
                <div key={s.segment_id} className={styles.card}>
                  <h3>{s.segment_name} ({s.percentage_of_corpus}%)</h3>
                  <p>{s.segment_description}</p>
                  <p><strong>Size:</strong> {s.size} users</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'hypotheses' && (
            <div className={styles.grid}>
              {hypotheses?.hypotheses?.map((h: any) => (
                <div key={h.hypothesis_id} className={styles.card}>
                  <h3>{h.hypothesis_id}: {h.type}</h3>
                  <p className={styles.statement}>{h.statement}</p>
                  <p><strong>Evidence Strength:</strong> <span className={styles.badge}>{h.evidence_strength}</span></p>
                  <p><strong>Support Count:</strong> {h.supporting_evidence_count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
