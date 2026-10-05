import fs from 'fs';
import { LLMClient } from './src/llm/client';
import { SEGMENT_SYSTEM_PROMPT } from './src/llm/prompts/segment-v1';
import * as dotenv from 'dotenv';
dotenv.config();

async function runMassiveLLMExtraction() {
  console.log('--- Starting MASSIVE LLM Extraction (13k Reviews) ---');
  
  const llmClient = new LLMClient();
  const allReviews = JSON.parse(fs.readFileSync('relevant_reviews.json', 'utf8'));
  console.log(`Loaded ${allReviews.length} pristine records.`);
  
  // Free tier has 8,000 TPM and 200,000 TPD limits
  // Batch size 25 = ~2,000 tokens per request
  const batchSize = 25;
  const masterSegments = new Map<string, any>(); 
  
  // We MUST slice the array to max 2,000 to avoid getting your free tier banned today (200k TPD)
  const safeReviewsLimit = allReviews.slice(0, 2000);
  
  let processed = 0;
  const totalBatches = Math.ceil(safeReviewsLimit.length / batchSize);
  
  for (let i = 0; i < safeReviewsLimit.length; i += batchSize) {
    const batch = safeReviewsLimit.slice(i, i + batchSize);
    
    const aggregatedData = batch.map((r: any, idx: number) => ({
      record_id: `GLOBAL_${i + idx}`,
      text: r.cleaned_text,
      rating: r.rating,
      source: r.region ? 'app_store' : 'play_store'
    }));
    
    const userPrompt = `Here is a batch of ${batch.length} real user reviews complaining about Google Photos search/retrieval issues:\n\n${JSON.stringify(aggregatedData, null, 2)}`;
    
    console.log(`[Batch ${Math.floor(i/batchSize) + 1}/${totalBatches}] Sending ${batch.length} reviews to Groq LLM...`);
    
    try {
      const result = await llmClient.getStructuredOutput<any>(
        SEGMENT_SYSTEM_PROMPT,
        userPrompt
      );
      
      if (result && result.segments) {
        for (const seg of result.segments) {
           // We do a naive consolidation by segment name for this script.
           // In Phase 4 production, a second LLM pass is used to intelligently merge these.
           const key = seg.segment_name.toUpperCase();
           
           if (!masterSegments.has(key)) {
             masterSegments.set(key, {
               segment_name: key,
               segment_description: seg.segment_description,
               pain_points: seg.pain_points || [],
               themes: seg.themes || [],
               sentiment: seg.sentiment || "Unknown",
               additional_details: seg.additional_details || "",
               dominant_failure_points: [...seg.dominant_failure_points],
               dominant_behaviours: [...seg.dominant_behaviours],
               evidence_record_ids: [...seg.evidence_record_ids]
             });
           } else {
             const existing = masterSegments.get(key);
             existing.evidence_record_ids.push(...seg.evidence_record_ids);
             
             for (const b of seg.dominant_behaviours) {
               if (!existing.dominant_behaviours.includes(b)) {
                 existing.dominant_behaviours.push(b);
               }
             }
             if (seg.pain_points) {
               for (const p of seg.pain_points) {
                 if (!existing.pain_points.includes(p)) existing.pain_points.push(p);
               }
             }
             if (seg.themes) {
               for (const t of seg.themes) {
                 if (!existing.themes.includes(t)) existing.themes.push(t);
               }
             }
           }
        }
      }
      
    } catch (err) {
      console.log(`[Batch ${Math.floor(i/batchSize) + 1}] Failed to process via Groq (Rate Limit?). Skipping batch.`);
    }
    
    processed += batch.length;
    
    // Save checkpoint continuously so we don't lose data
    const outData = { segments: Array.from(masterSegments.values()) };
    fs.writeFileSync('llm_insights_full.json', JSON.stringify(outData, null, 2));
    
    // Respect LLM rate limits (Wait 15s to stay under 8k tokens per minute limit)
    await new Promise(r => setTimeout(r, 15000));
  }
  
  console.log(`\n================================`);
  console.log(`MASSIVE EXTRACTION COMPLETE!`);
  console.log(`Processed ${processed} reviews.`);
  console.log(`Total Master Segments Found: ${masterSegments.size}`);
  console.log(`Data saved to llm_insights_full.json`);
}

runMassiveLLMExtraction().catch(console.error);
