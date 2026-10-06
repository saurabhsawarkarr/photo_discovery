'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface EvidenceRecord {
  id: string;
  record_id: string;
  source: string;
  source_date: string;
  failure_point: string;
  evidence_quote: string;
  final_outcome: string;
}

export default function EvidenceExplorer() {
  const [data, setData] = useState<EvidenceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [failureFilter, setFailureFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const limit = 25;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/evidence`
        : '/api/evidence';
        
      const url = new URL(apiUrl, window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      if (failureFilter) url.searchParams.append('failure_point', failureFilter);
      if (sourceFilter) url.searchParams.append('source', sourceFilter);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setTotalCount(json.meta?.total || 0);
      } else {
        // Fallback dummy data if API is not available
        setData([
          { id: '1', record_id: 'R001', source: 'google_play', source_date: '2023-10-01', failure_point: 'G - Abandonment', evidence_quote: 'The simple act of trying to find a photo... given up.', final_outcome: 'Failed' },
          { id: '2', record_id: 'R002', source: 'app_store', source_date: '2023-10-05', failure_point: 'C - Search Understanding', evidence_quote: 'I search for a word and it gives me hundreds of unrelated photos.', final_outcome: 'Frustrated' }
        ]);
        setTotalCount(2);
      }
    } catch (err) {
      console.error(err);
      setData([
        { id: '1', record_id: 'R001', source: 'google_play', source_date: '2023-10-01', failure_point: 'G - Abandonment', evidence_quote: 'The simple act of trying to find a photo... given up.', final_outcome: 'Failed' }
      ]);
      setTotalCount(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, failureFilter, sourceFilter]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Evidence Explorer</h1>
        <p className="page-description">
          Filter and explore the raw data and analysis results driving the research insights.
        </p>
      </div>

      <div className={styles.filters}>
        <select 
          value={failureFilter} 
          onChange={e => { setFailureFilter(e.target.value); setPage(1); }}
          className={styles.select}
        >
          <option value="">All Failure Points</option>
          <option value="A">A - Memory Expression</option>
          <option value="B">B - Query Formulation</option>
          <option value="C">C - Search Understanding</option>
          <option value="D">D - Result Relevance</option>
          <option value="E">E - Result Evaluation</option>
          <option value="F">F - Search Recovery</option>
          <option value="G">G - Abandonment</option>
        </select>

        <select 
          value={sourceFilter} 
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          className={styles.select}
        >
          <option value="">All Sources</option>
          <option value="google_play">Google Play</option>
          <option value="app_store">App Store</option>
          <option value="reddit">Reddit</option>
          <option value="youtube">YouTube</option>
          <option value="google_community">Support Community</option>
        </select>
        
        <div className={styles.stats}>
          {totalCount} records found
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Failure Point</th>
              <th>Outcome</th>
              <th>Evidence Quote</th>
              <th>Date</th>
              <th>Original Review</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className={styles.loadingCell}>Loading evidence...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.loadingCell}>No records found for the selected filters.</td>
              </tr>
            ) : (
              data.map(row => {
                const isPlayStore = row.source === 'google_play' || row.source === 'app_store';
                const reviewUrl = isPlayStore 
                  ? `https://play.google.com/store/apps/details?id=com.google.android.apps.photos&reviewId=${row.record_id}`
                  : `https://example.com/raw/${row.record_id}`;

                return (
                  <tr key={row.id}>
                    <td><span className={styles.badge}>{row.source}</span></td>
                    <td><span className={styles.failureBadge}>{row.failure_point || 'N/A'}</span></td>
                    <td>{row.final_outcome || 'N/A'}</td>
                    <td><div className={styles.quote}>{row.evidence_quote}</div></td>
                    <td>{new Date(row.source_date).toLocaleDateString()}</td>
                    <td>
                      <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className={styles.reviewLinkBtn}>
                        View Link ↗
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className={styles.pageBtn}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>
    </div>
  );
}
