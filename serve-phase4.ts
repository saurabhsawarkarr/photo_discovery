import express from 'express';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const app = express();
const port = 4004;

const DATA_DIR = path.join(__dirname, 'data/phase4');

// Helpers to load JSON files safely
function loadJson(filename: string) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
  } catch (error) {
    return null;
  }
}

app.get('/', (req, res) => {
  res.redirect('/4f');
});

app.get('/:phase', (req, res) => {
  const phase = req.params.phase.toLowerCase();
  let contentHtml = '';
  let title = '';

  const failurePointMap: Record<string, string> = {
    'A': 'System fails to parse complex natural language queries',
    'B': 'System fails to retrieve based on visual/contextual details',
    'C': 'System fails to retrieve based on episodic memory (dates, places)',
    'D': 'Indexing delay or synchronization failure',
    'E': 'Forced categorization hides specific media',
    'F': 'No visual feedback when search returns zero results',
    'G': 'Overwhelming irrelevant results instead of a precise match'
  };

  const simpleThemeMap: Record<string, { title: string, desc: string }> = {
    'T1': { title: 'The Invisible Photo', desc: 'The user is staring right at the photo in their camera roll, but when they search for it, the app says 0 results. The search engine is out of sync with the phone.' },
    'T2': { title: 'The Dumb Search Engine', desc: 'Users search using highly specific human memories, but Google Photos only understands broad, generic tags.' },
    'T3': { title: 'The Hidden Folders', desc: 'Google Photos has too many different ways to group photos, causing users to constantly lose track of their own organization system.' },
    'T4': { title: 'Too Much AI Clutter', desc: 'The app is pushing so many automated, "smart" features into the user\'s face that it makes it incredibly difficult to do basic, manual navigation.' }
  };

  const simpleSegmentMap: Record<string, { title: string, desc: string }> = {
    'S1': { title: 'The Local Gallery User', desc: 'They think Google Photos is just a local gallery. When search fails, they think their photos are permanently deleted.' },
    'S2': { title: 'The Power Searcher', desc: 'They treat search like a precise database and get very frustrated when the app can\'t understand complex addresses or specific words.' },
    'S3': { title: 'The Folder Organizer', desc: 'They want to use manual folders and hate when the AI automatically moves or groups their photos.' },
    'S4': { title: 'The Troubleshooting Techie', desc: 'They know how to clear the cache and fix the app, but even their advanced tricks are failing.' }
  };

  const simpleHypothesisMap: Record<string, { title: string, desc: string }> = {
    'H1': { title: 'The "Verification" Hypothesis', desc: 'Users use search just to prove their new photos backed up safely.' },
    'H2': { title: 'The "Loss of Trust" Hypothesis', desc: 'Bad search results make users think Google permanently deleted their photos.' },
    'H3': { title: 'The "Smart Search Expectation" Hypothesis', desc: 'Users expect the app to be as smart as Google Web Search and get angry when it isn\'t.' },
    'H4': { title: 'The "Stop Helping Me" Hypothesis', desc: 'Automated AI albums actually make users feel more lost.' },
    'H5': { title: 'The "Hide and Seek" Hypothesis', desc: 'Users have to check 3-5 different folders just to find a single photo.' },
    'H6': { title: 'The "Unfixable" Hypothesis', desc: 'Normal fixes (like clearing cache) no longer work for search bugs.' }
  };

  const navHtml = `
    <div class="sidebar">
      <h2>Phases</h2>
      <a href="/findings" class="${phase === 'findings' ? 'active' : ''}">Findings & Synthesis</a>
      <a href="/4a" class="${phase === '4a' ? 'active' : ''}">4A: Deep Relevance Filter</a>
      <a href="/4b" class="${phase === '4b' ? 'active' : ''}">4B: User Journey Extraction</a>
      <a href="/4c" class="${phase === '4c' ? 'active' : ''}">4C: Pattern Aggregation</a>
      <a href="/4d" class="${phase === '4d' ? 'active' : ''}">4D: Theme Discovery</a>
      <a href="/4e" class="${phase === '4e' ? 'active' : ''}">4E: User Segments</a>
      <a href="/4f" class="${phase === '4f' ? 'active' : ''}">4F: Hypotheses</a>
    </div>
  `;

  if (phase === 'findings') {
    title = 'Findings & Synthesis';
    try {
      const findingsPath = path.join(__dirname, 'Docs', 'Findings.md');
      const markdown = fs.readFileSync(findingsPath, 'utf8');
      contentHtml = `<div class="card markdown-body">${marked(markdown)}</div>`;
    } catch (e) {
      contentHtml = '<p>Findings document not found.</p>';
    }
  } else if (phase === '4a') {
    title = 'Phase 4A: Deep Relevance Filter';
    const stats = loadJson('phase4a_stats.json');
    if (stats) {
      contentHtml = `
        <div class="card">
          <h3>Heuristic Filter Results</h3>
          <div class="stats-grid">
            <div class="stat-box"><strong>Total Processed:</strong> ${stats.total_processed}</div>
            <div class="stat-box" style="background:#dcfce7; color:#166534;"><strong>Relevant:</strong> ${stats.relevant_count}</div>
            <div class="stat-box" style="background:#fef9c3; color:#854d0e;"><strong>Potential:</strong> ${stats.potentially_relevant_count}</div>
            <div class="stat-box" style="background:#fee2e2; color:#991b1b;"><strong>Irrelevant:</strong> ${stats.irrelevant_count}</div>
          </div>
          <p>These ${stats.relevant_count} relevant records were passed to Phase 4B.</p>
        </div>
      `;
    } else {
      contentHtml = '<p>No data found for 4A.</p>';
    }
  } else if (phase === '4b') {
    title = 'Phase 4B: User Journey Extraction';
    const stats = loadJson('phase4b_stats.json');
    const journeys = loadJson('phase4b_journeys.json');
    if (stats && journeys) {
      contentHtml = `
        <div class="card" style="background: #e0f2fe; border: 1px solid #bae6fd;">
          <h3 style="color: #0369a1; margin-top: 0;">How to Read These Journeys</h3>
          <p><strong>Memory:</strong> What the user actually remembered in their brain about the photo (e.g., "It was a picture of my dog in Paris").</p>
          <p><strong>Search Strategy:</strong> How the user tried to translate that memory into the app (e.g., typing "dog paris" in the search bar, or scrolling manually).</p>
          <p><strong>Failure Points (A-G):</strong> The specific reason the app failed to connect their Search Strategy to their Memory.</p>
          <details>
            <summary style="cursor: pointer; font-weight: bold; color: #0284c7;">View All Failure Point Definitions (A-G)</summary>
            <ul style="margin-top: 10px;">
              <li><strong>Point A:</strong> System fails to parse complex natural language queries (e.g., "photos of me at the beach last summer")</li>
              <li><strong>Point B:</strong> System fails to retrieve based on visual/contextual details (e.g., "the red shirt")</li>
              <li><strong>Point C:</strong> System fails to retrieve based on episodic memory (dates, places)</li>
              <li><strong>Point D:</strong> Indexing delay or synchronization failure (user knows the photo exists, but search hasn't indexed it)</li>
              <li><strong>Point E:</strong> Forced categorization hides specific media (e.g., app puts it in "Archive" or "Screenshots" where search doesn't look)</li>
              <li><strong>Point F:</strong> No visual feedback when search returns zero results (user doesn't know if they made a typo or if it's missing)</li>
              <li><strong>Point G:</strong> Overwhelming irrelevant results instead of a precise match (search finds 1000 photos of "dog" instead of the 1 they want)</li>
            </ul>
          </details>
        </div>
        <div class="card">
          <h3>Extraction Stats</h3>
          <div class="stats-grid">
            <div class="stat-box"><strong>Journeys Extracted:</strong> ${stats.journeys_extracted}</div>
            <div class="stat-box"><strong>Failed:</strong> ${stats.failed_extractions}</div>
          </div>
        </div>
        <h3>Extracted Journeys (All ${journeys?.length || 0})</h3>
        ${(journeys || []).map((j: any) => `
          <div class="card">
            <h4>Record ID: ${j.record_id || 'N/A'} <a href="${j.source_url || '#'}" target="_blank" style="font-size:0.8em; margin-left:10px; color:#3b82f6;">🔗 View Source Review</a></h4>
            <div style="background:#f1f5f9; padding: 10px; border-left: 3px solid #cbd5e1; margin-bottom: 15px; font-size: 0.9em; font-style: italic;">"${j.original_text || j.evidence_quote || 'N/A'}"</div>
            <p><strong>Memory:</strong> ${j.what_user_remembers?.photo_type || 'N/A'} - "${j.what_user_remembers?.location || j.what_user_remembers?.activity || 'N/A'}"</p>
            <p><strong>Search Strategy:</strong> ${j.search_journey?.method_used || 'N/A'} - "${j.search_journey?.query_attempted || 'N/A'}"</p>
            <p><strong>Failure Point(s):</strong> 
              <ul>
                ${(j.failure_points || []).map((f: string) => `<li><strong style="color:#d97706;">Point ${f}</strong>: ${failurePointMap[f] || 'Unknown'}</li>`).join('')}
              </ul>
            </p>
            <p style="background:#fef2f2; padding:8px; border-radius:4px; color:#991b1b;"><strong>Why it failed:</strong> ${j.failure_description || ''}</p>
            <p><strong>Frustration Level:</strong> ${j.frustration_level || 'N/A'}</p>
          </div>
        `).join('')}
      `;
    } else {
      contentHtml = '<p>No data found for 4B.</p>';
    }
  } else if (phase === '4c') {
    title = 'Phase 4C: Pattern Aggregation';
    const data = loadJson('phase4c_aggregation.json');
    if (data) {
      contentHtml = `
        <div class="card">
          <h3>Aggregation Stats</h3>
          <p><strong>Total Journeys Analyzed:</strong> ${data.total_records}</p>
          <h4>Failure Distribution</h4>
          <ul>
            ${Object.entries(data.failure_point_distribution || {}).map(([k, v]: any) => `<li><strong>Failure ${k}:</strong> ${v.count} times (${v.percentage}%)</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      contentHtml = '<p>No data found for 4C.</p>';
    }
  } else if (phase === '4d') {
    title = 'Phase 4D: Themes & Pain Points';
    const data = loadJson('phase4d_themes.json');
    if (data && data.themes) {
      contentHtml = `
        <h3>Discovered Themes (Core Problems)</h3>
        ${data.themes.map((t: any) => `
          <div class="card">
            <h4>${simpleThemeMap[t.theme_id]?.title || t.theme_name}</h4>
            <p style="font-size: 1.1em; color: #1e293b;"><strong>Simple Explanation:</strong> ${simpleThemeMap[t.theme_id]?.desc || t.description}</p>
            <p style="color: #64748b; font-size: 0.9em; margin-top: 15px;"><em>AI Original Text: ${t.description}</em></p>
            <p><strong>Frustration Level:</strong> ${t.dominant_frustration}</p>
            <div class="tag-container">
              ${t.related_failure_points.map((f: string) => `<span class="tag">Failure ${f}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      `;
    } else {
      contentHtml = '<p>No data found for 4D.</p>';
    }
  } else if (phase === '4e') {
    title = 'Phase 4E: User Segments';
    const data = loadJson('phase4e_segments.json');
    if (data && data.segments) {
      contentHtml = `
        <h3>Synthesized User Segments (Types of People)</h3>
        ${data.segments.map((s: any) => `
          <div class="card">
            <h4>${simpleSegmentMap[s.segment_id]?.title || s.segment_name}</h4>
            <p style="font-size: 1.1em; color: #1e293b;"><strong>Simple Explanation:</strong> ${simpleSegmentMap[s.segment_id]?.desc || s.segment_description}</p>
            <p style="color: #64748b; font-size: 0.9em; margin-top: 15px;"><em>AI Original Text: ${s.segment_description}</em></p>
            <div class="stats-grid" style="margin: 10px 0;">
              <div class="stat-box" style="padding: 10px;">Size: ${s.size} (${s.percentage_of_corpus}%)</div>
            </div>
            <p><strong>Behaviors:</strong> ${s.dominant_behaviours.join(', ')}</p>
            <p><strong>Memory Types:</strong> ${s.common_memory_types.join(', ')}</p>
            <div class="tag-container" style="margin-top:10px;">
              ${s.dominant_failure_points.map((f: string) => `<span class="tag">Failure ${f}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      `;
    } else {
      contentHtml = '<p>No data found for 4E.</p>';
    }
  } else if (phase === '4f') {
    title = 'Phase 4F: Research Hypotheses';
    const data = loadJson('phase4f_hypotheses.json');
    const allJourneys = loadJson('phase4b_journeys.json') || [];
    if (data && data.hypotheses) {
      contentHtml = `
        <h3>Testable Research Hypotheses (Educated Guesses)</h3>
        <p class="subtitle">These hypotheses are data-driven and ready to be tested in user interviews.</p>
        ${data.hypotheses.map((h: any) => {
          const matchingJourneys = allJourneys.filter((j: any) => {
             return j.failure_points && h.related_failure_points && j.failure_points.some((fp: string) => h.related_failure_points.includes(fp));
          }).slice(0, 3);
          
          return `
          <div class="card hypothesis-card">
            <div class="hypothesis-id">${h.hypothesis_id}</div>
            <h4>${simpleHypothesisMap[h.hypothesis_id]?.title || h.statement}</h4>
            <p style="font-size: 1.1em; color: #1e293b; margin-top: 10px;"><strong>Simple Explanation:</strong> ${simpleHypothesisMap[h.hypothesis_id]?.desc || ''}</p>
            <p style="color: #64748b; font-size: 0.9em; margin-top: 15px;"><em>AI Original Text: ${h.statement}</em></p>
            <div class="stats-grid" style="margin: 15px 0;">
              <div class="stat-box"><strong>Type:</strong> ${h.type.replace(/_/g, ' ')}</div>
              <div class="stat-box"><strong>Evidence Strength:</strong> ${h.evidence_strength}</div>
              <div class="stat-box"><strong>Data Points:</strong> ${h.supporting_evidence_count}</div>
            </div>
            
            <div style="margin-top: 15px;">
              <strong>Suggested Interview Questions:</strong>
              <ul>
                ${(h.interview_questions_for_validation || []).map((q: string) => `<li>${q}</li>`).join('')}
              </ul>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <strong style="color:#0369a1;">Sample Raw Reviews (Evidence):</strong>
              ${matchingJourneys.map((j: any) => `
                <div style="margin-top: 10px; padding: 10px; background: #f8fafc; border-left: 3px solid #3b82f6; font-size: 0.9em;">
                  <div style="font-style: italic; color: #334155;">"${j.original_text || j.evidence_quote}"</div>
                  <div style="margin-top: 5px;"><a href="${j.source_url || '#'}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: none;">🔗 View Original Review</a></div>
                </div>
              `).join('')}
              ${matchingJourneys.length === 0 ? '<p style="font-size:0.9em; color:#64748b;">No direct reviews linked.</p>' : ''}
            </div>
          </div>
        `;
        }).join('')}
      `;
    } else {
      contentHtml = '<p>No data found for 4F.</p>';
    }
  } else {
    res.status(404).send('Phase not found');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Phase 4 Dashboard</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', sans-serif; 
          margin: 0; 
          padding: 0;
          background: #f8fafc; 
          color: #0f172a; 
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 250px;
          background: #1e293b;
          color: white;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        .sidebar h2 { margin-top: 0; color: #f8fafc; font-size: 1.2rem; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #334155; }
        .sidebar a {
          color: #cbd5e1;
          text-decoration: none;
          padding: 10px 15px;
          margin-bottom: 5px;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .sidebar a:hover { background: #334155; color: white; }
        .sidebar a.active { background: #3b82f6; color: white; }
        
        .main-content {
          flex: 1;
          padding: 40px;
          max-width: 1000px;
          overflow-y: auto;
        }
        h1 { margin-top: 0; color: #0f172a; font-size: 2rem; }
        .subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 30px; }
        
        .card { 
          background: white; 
          border-radius: 12px; 
          padding: 24px; 
          margin-bottom: 24px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); 
          border: 1px solid #e2e8f0;
        }
        .card h3 { margin-top: 0; color: #0f172a; }
        .card h4 { margin-top: 0; color: #334155; font-size: 1.1rem;}
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .stat-box { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; font-size: 1.1rem; color: #334155;}
        
        .tag-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-size: 0.85em; font-weight: 600; }
        
        ul { padding-left: 20px; color: #475569; }
        li { margin-bottom: 8px; line-height: 1.5; }
        
        .hypothesis-card { border-left: 5px solid #3b82f6; position: relative; }
        .hypothesis-id { position: absolute; top: 24px; right: 24px; background: #3b82f6; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 0.9em; }
        
        .markdown-body { font-size: 1.1em; line-height: 1.6; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; margin-top: 1.5em; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; }
        .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
        .markdown-body th { background: #f1f5f9; }
        .markdown-body blockquote { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 10px 20px; margin: 1.5em 0; color: #1e3a8a; font-style: italic; }
        .markdown-body code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #b91c1c; }
        .markdown-body pre code { background: none; color: inherit; }
        .markdown-body pre { background: #1e293b; color: white; padding: 15px; border-radius: 8px; overflow-x: auto; }
      </style>
    </head>
    <body>
      ${navHtml}
      <div class="main-content">
        <h1>${title}</h1>
        ${contentHtml}
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`\nPhase 4 Dashboard is running!`);
  console.log(`Click here to view: http://localhost:${port}/4f`);
});
