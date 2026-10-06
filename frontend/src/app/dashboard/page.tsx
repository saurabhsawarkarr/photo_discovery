import fs from 'fs';
import path from 'path';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
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

  if (!stats || !segmentsData || !themesData) {
    return <div>Error loading dashboard data. Check server logs.</div>;
  }

  // Pre-process failure points for Recharts
  const failurePointsMap: Record<string, string> = {
    'A': 'Memory Expression',
    'B': 'Query Formulation',
    'C': 'Search Understanding',
    'D': 'Result Relevance',
    'E': 'Result Evaluation',
    'F': 'Search Recovery',
    'G': 'Abandonment',
  };

  const failureDistribution = Object.entries(stats.failure_point_distribution).map(([key, value]: any) => ({
    name: failurePointsMap[key] || key,
    id: key,
    count: value.count,
    percentage: parseFloat(value.percentage),
  })).sort((a, b) => b.count - a.count);

  const segments = segmentsData.segments.map((seg: any) => ({
    name: seg.segment_name,
    size: seg.size,
    percentage: parseFloat(seg.percentage_of_corpus),
  }));

  return (
    <div className="page-container" style={{ padding: '2rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
          Discovery Engine Dashboard
        </h1>
        <p className="page-description" style={{ color: '#64748b', fontSize: '1.1rem' }}>
          AI-generated behavioral insights, user segments, and failure point statistics across {stats.total_records} retrieval journeys.
        </p>
      </div>
      
      <DashboardClient 
        failureDistribution={failureDistribution} 
        segments={segments} 
        stats={stats} 
        themes={themesData.themes} 
      />
    </div>
  );
}
