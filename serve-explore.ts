import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 5555;

app.get('/', (req, res) => {
  let data: any = { sentiment: {}, themes: [], pain_points: [], quotes: [] };
  
  try {
    data = JSON.parse(fs.readFileSync(path.join(__dirname, 'exploration_results.json'), 'utf8'));
  } catch (error) {
    console.error('Could not load exploration results');
  }

  const totalSentiment = (data.sentiment.positive || 0) + (data.sentiment.neutral || 0) + (data.sentiment.negative || 0);

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Exploratory Data Analysis</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #e5e5e5; line-height: 1.6; }
        h1 { color: #ffffff; margin-bottom: 5px; font-size: 24px; }
        .subtitle { color: #a3a3a3; font-size: 14px; margin-bottom: 30px; }
        
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { border-bottom: 1px solid #333; padding: 12px 16px; color: #a3a3a3; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 16px; border-bottom: 1px solid #2a2a2a; vertical-align: middle; }
        tr:hover { background-color: #252525; }
        
        .rank { color: #a3a3a3; width: 40px; }
        .theme-name { font-weight: bold; color: #ffffff; font-size: 15px; }
        
        .mentions { color: #a3a3a3; font-size: 14px; }
        .mentions span { color: #a3a3a3; font-size: 12px; }
        
        .sentiment-neg { color: #f97316; font-weight: bold; font-size: 14px; }
        
        .friction-pill { background: #333; color: #a3a3a3; padding: 4px 12px; border-radius: 999px; font-size: 12px; border: 1px solid #444; display: inline-block; }
        
        .quote { font-style: italic; background: #252525; padding: 15px; border-left: 4px solid #4f46e5; margin-top: 40px; margin-bottom: 15px; color: #d4d4d8;}
      </style>
    </head>
    <body>
      <h1>Themes Detected</h1>
      <div class="subtitle">Ranked by supporting customer comment volume out of 1,000 records</div>
      
      <table>
        <thead>
          <tr>
            <th class="rank">#</th>
            <th>THEME & QUALITATIVE FOCUS</th>
            <th>MENTIONS</th>
            <th>SENTIMENT</th>
            <th>PRIMARY FRICTION</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const painPoints = data.pain_points || [];
            const totalMentions = painPoints.reduce((sum: number, pp: any) => sum + (pp.frequency || 0), 0);
            
            return painPoints.slice(0, 15).map((pp: any, idx: number) => {
              const perc = totalMentions > 0 ? ((pp.frequency / totalMentions) * 100).toFixed(1) : 0;
              
              // Simple heuristic to assign friction tag
              let friction = "evaluation";
              const text = pp.issue.toLowerCase();
              if (text.includes("search") || text.includes("find") || text.includes("face")) friction = "discovery";
              if (text.includes("storage") || text.includes("update") || text.includes("crash")) friction = "consideration";
              
              return `
              <tr>
                <td class="rank">${idx + 1}</td>
                <td class="theme-name">${pp.issue}</td>
                <td class="mentions">${pp.frequency} <span>(${perc}%)</span></td>
                <td class="sentiment-neg">Negative</td>
                <td><span class="friction-pill">${friction}</span></td>
              </tr>
              `;
            }).join('');
          })()}
        </tbody>
      </table>
      
      <div style="margin-top: 50px;">
        <h2 style="color: #fff; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 10px;">Supporting Evidence (Quotes)</h2>
        ${(data.quotes || []).slice(0, 5).map((q: string) => `
          <div class="quote">"${q}"</div>
        `).join('')}
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`\nExploration Viewer running at http://localhost:${port}`);
});
