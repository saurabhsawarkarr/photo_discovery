import fs from 'fs';
import path from 'path';
import TabsClient from './TabsClient';

export default function FindingsPage() {
  const basePath = 'h:/Antigravity/Google photo Discovery';
  const docsPath = path.join(basePath, 'Docs');
  const dataPath = path.join(basePath, 'data/phase4');
  
  let findingsMd = '';
  let journeys = null;
  let aggregation = null;
  let themes = null;
  let segments = null;
  let hypotheses = null;
  
  try {
    findingsMd = fs.readFileSync(path.join(docsPath, 'Findings.md'), 'utf-8');
  } catch (error) {
    console.error('Error reading Findings.md:', error);
    findingsMd = '# Error\nCould not load the findings document.';
  }

  try {
    journeys = JSON.parse(fs.readFileSync(path.join(dataPath, 'phase4b_journeys.json'), 'utf-8'));
  } catch (e) { console.error('Error reading journeys', e); }

  try {
    aggregation = JSON.parse(fs.readFileSync(path.join(dataPath, 'phase4c_aggregation.json'), 'utf-8'));
  } catch (e) { console.error('Error reading aggregation', e); }

  try {
    themes = JSON.parse(fs.readFileSync(path.join(dataPath, 'phase4d_themes.json'), 'utf-8'));
  } catch (e) { console.error('Error reading themes', e); }

  try {
    segments = JSON.parse(fs.readFileSync(path.join(dataPath, 'phase4e_segments.json'), 'utf-8'));
  } catch (e) { console.error('Error reading segments', e); }

  try {
    hypotheses = JSON.parse(fs.readFileSync(path.join(dataPath, 'phase4f_hypotheses.json'), 'utf-8'));
  } catch (e) { console.error('Error reading hypotheses', e); }

  return (
    <TabsClient 
      findingsMd={findingsMd}
      journeys={journeys}
      aggregation={aggregation}
      themes={themes}
      segments={segments}
      hypotheses={hypotheses}
    />
  );
}
