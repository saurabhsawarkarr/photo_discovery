import fs from 'fs';
import { LLMClient } from './src/llm/client';
import * as dotenv from 'dotenv';
dotenv.config();

const EXPLORE_PROMPT = `
Role: You are an expert Data Analyst.

Goal: Perform Exploratory Data Analysis on the provided user reviews.
We are NOT defining user segments yet. We simply want to understand the overarching data landscape.

Read the batch of reviews and extract:
1. Pain Points: Specific things users are complaining about.
2. Themes: Broader categories that group the pain points together.
3. Sentiment Breakdown: Count how many reviews in this batch are Negative, Neutral, or Positive.
4. Insights: Any interesting quotes, anomalies, or unexpected details.

Return JSON in exactly this format:
{
  "pain_points": [
    { "issue": "App crashes on launch", "frequency_in_batch": 5 }
  ],
  "themes": [
    { "theme_name": "Performance", "description": "Issues relating to speed and stability" }
  ],
  "sentiment": {
    "positive": 0,
    "neutral": 2,
    "negative": 23
  },
  "key_quotes": [
    "I literally can't find my dog's photos anymore."
  ]
}
`;

async function runExploration() {
  console.log('--- Starting Phase 3.5: Data Exploration ---');
  
  const llmClient = new LLMClient();
  const allReviews = JSON.parse(fs.readFileSync('relevant_reviews.json', 'utf8'));
  
  const batchSize = 25;
  const safeReviewsLimit = allReviews.slice(0, 1000); // Analyze first 1000 for exploration
  
  const globalExploration = {
    pain_points: new Map<string, number>(),
    themes: new Map<string, string>(),
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    key_quotes: new Set<string>()
  };
  
  let processed = 0;
  
  for (let i = 0; i < safeReviewsLimit.length; i += batchSize) {
    const batch = safeReviewsLimit.slice(i, i + batchSize);
    
    const aggregatedData = batch.map((r: any) => ({
      text: r.cleaned_text,
      rating: r.rating
    }));
    
    const userPrompt = `Here is a batch of ${batch.length} reviews. Extract pain points, themes, and sentiment:\n\n${JSON.stringify(aggregatedData, null, 2)}`;
    
    console.log(`[Explore] Analyzing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(safeReviewsLimit.length/batchSize)}...`);
    
    try {
      const result = await llmClient.getStructuredOutput<any>(EXPLORE_PROMPT, userPrompt);
      
      if (result) {
        // Merge Sentiment
        if (result.sentiment) {
          globalExploration.sentiment.positive += result.sentiment.positive || 0;
          globalExploration.sentiment.neutral += result.sentiment.neutral || 0;
          globalExploration.sentiment.negative += result.sentiment.negative || 0;
        }
        
        // Merge Pain Points
        if (result.pain_points) {
          for (const pp of result.pain_points) {
            const current = globalExploration.pain_points.get(pp.issue) || 0;
            globalExploration.pain_points.set(pp.issue, current + (pp.frequency_in_batch || 1));
          }
        }
        
        // Merge Themes
        if (result.themes) {
          for (const t of result.themes) {
            globalExploration.themes.set(t.theme_name, t.description);
          }
        }
        
        // Merge Quotes
        if (result.key_quotes) {
          for (const q of result.key_quotes) {
            globalExploration.key_quotes.add(q);
          }
        }
      }
    } catch (err) {
      console.log('Failed to analyze batch due to API limit.');
    }
    
    processed += batch.length;
    
    // Save checkpoint
    const outData = {
      sentiment: globalExploration.sentiment,
      themes: Array.from(globalExploration.themes.entries()).map(([name, desc]) => ({ name, desc })),
      pain_points: Array.from(globalExploration.pain_points.entries()).map(([issue, freq]) => ({ issue, frequency: freq })).sort((a,b) => b.frequency - a.frequency),
      quotes: Array.from(globalExploration.key_quotes)
    };
    
    fs.writeFileSync('exploration_results.json', JSON.stringify(outData, null, 2));
    
    // API rate limit pause
    await new Promise(r => setTimeout(r, 15000));
  }
  
  console.log('Exploration Complete! Results saved to exploration_results.json');
}

runExploration().catch(console.error);
