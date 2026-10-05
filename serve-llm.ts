import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 4444;

app.get('/', (req, res) => {
  let insights: any = { segments: [] };
  let allReviews: any[] = [];
  
  try {
    insights = JSON.parse(fs.readFileSync(path.join(__dirname, 'llm_insights_full.json'), 'utf8'));
  } catch (error) {
    console.error('Could not load insights full');
  }

  try {
    allReviews = JSON.parse(fs.readFileSync(path.join(__dirname, 'relevant_reviews.json'), 'utf8'));
  } catch (error) {
    console.error('Could not load original reviews');
  }

  // To cross-reference evidence IDs, we need to find the text.
  // In our test script, we mapped evidence IDs as REV_1, REV_2 corresponding to the sliced array.
  // Since we only passed 50 reviews (the >80 chars filter), we'll recreate that array to pull exact quotes.
  const meatyReviews = allReviews.filter((r: any) => r.cleaned_text.length > 80);
  const sample = meatyReviews.slice(0, 50);
  
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LLM Insights Viewer</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #f4f4f9; color: #333; line-height: 1.6; }
        h1 { color: #111; }
        .segment-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .segment-title { font-size: 1.4em; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .segment-desc { font-size: 1.1em; margin-bottom: 15px; color: #444; }
        .tag-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
        .tag { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 0.9em; font-weight: 500; }
        .evidence-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 10px; border-radius: 0 4px 4px 0; }
        .evidence-text { font-style: italic; color: #334155; margin: 0; }
        .alert { background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; border: 1px solid #ffeeba; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>LLM Extraction Results</h1>
      
      <div class="alert">
        <strong>Context Limit Note:</strong> To prevent the LLM from crashing due to max token limits (which max out around 30 pages of text), we only sent a dense sample of exactly <strong>50 reviews</strong> to the LLM for this initial test run, not all 13,000. 
        <br><br>In a production environment, all 13,000 reviews would be sent in smaller batches of 50 across hundreds of background API requests to build the final database.
      </div>

      <p>The LLM processed the 50 reviews and extracted <strong>${insights.segments ? insights.segments.length : 0} distinct segments</strong>:</p>
  `;

  if (insights.segments) {
    insights.segments.forEach((seg: any) => {
      html += `
        <div class="segment-card">
          <div class="segment-title">${seg.segment_name}</div>
          <div class="segment-desc">${seg.segment_description}</div>
          
          ${seg.sentiment ? `<div style="margin-bottom: 10px;"><strong>Sentiment:</strong> <span style="color: #d97706;">${seg.sentiment}</span></div>` : ''}
          ${seg.additional_details ? `<div style="margin-bottom: 15px; font-style: italic; color: #555;"><strong>Additional Details:</strong> ${seg.additional_details}</div>` : ''}
          
          <strong>Pain Points:</strong>
          <div class="tag-container">
            ${(seg.pain_points || []).map((p: string) => `<span class="tag" style="background: #fee2e2; color: #991b1b;">${p}</span>`).join('')}
          </div>
          
          <strong>Themes:</strong>
          <div class="tag-container">
            ${(seg.themes || []).map((t: string) => `<span class="tag" style="background: #fef3c7; color: #92400e;">${t}</span>`).join('')}
          </div>

          <strong>Dominant Behaviours:</strong>
          <div class="tag-container">
            ${seg.dominant_behaviours.map((b: string) => `<span class="tag">${b}</span>`).join('')}
          </div>
          
          <strong>Evidence (${seg.evidence_record_ids.length} matched reviews):</strong>
      `;

      seg.evidence_record_ids.forEach((evId: string) => {
        // extract the number from GLOBAL_1, GLOBAL_2, or REV_1
        const idStr = evId.replace('GLOBAL_', '').replace('REV_', '');
        const idNum = parseInt(idStr, 10);
        
        let review = null;
        if (evId.startsWith('GLOBAL_')) {
          review = allReviews[idNum];
        } else {
          review = sample[idNum - 1]; // Fallback for the old test data
        }
        
        if (review) {
          const reviewText = review.cleaned_text;
          const sourceUrl = review.source_url || '#';
          const platformStr = review.region ? ` (${review.region.toUpperCase()})` : '';
          
          html += `
            <div class="evidence-box">
              <p class="evidence-text">"${reviewText}"</p>
              <div style="margin-top: 10px; font-size: 0.85em;">
                <a href="${sourceUrl}" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                  🔗 View Original Source${platformStr}
                </a>
                <span style="color: #64748b; margin-left: 10px;">⭐ ${review.rating} Stars</span>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="evidence-box">
              <p class="evidence-text">"Text not found for ${evId}"</p>
            </div>
          `;
        }
      });

      html += `</div>`;
    });
  }

  html += `
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`\nLLM Insights viewer is running!`);
  console.log(`Click here to view the LLM segments and evidence: http://localhost:${port}`);
});
