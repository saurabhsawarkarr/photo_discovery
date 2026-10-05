import fs from 'fs';
import { LLMClient } from './src/llm/client';
import { SEGMENT_SYSTEM_PROMPT } from './src/llm/prompts/segment-v1';
import * as dotenv from 'dotenv';
dotenv.config();

async function runLocalLLMTest() {
  console.log('--- Starting Groq LLM Extraction Test ---');
  
  if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY is not set in .env');
    return;
  }
  
  const llmClient = new LLMClient();
  console.log(`Initialized Groq Client with model: ${llmClient.getModelName()}`);
  
  // 1. Load a subset of cleaned data
  console.log('\nLoading relevant_reviews.json...');
  const allReviews = JSON.parse(fs.readFileSync('relevant_reviews.json', 'utf8'));
  
  // To avoid hitting Groq context limits, let's take a sample of 50 high-quality reviews
  // We'll filter for reviews that are longer to give the LLM meaty context
  const meatyReviews = allReviews.filter((r: any) => r.cleaned_text.length > 80);
  const sample = meatyReviews.slice(0, 50);
  console.log(`Selected a sample of ${sample.length} detailed reviews for analysis.`);
  
  // 2. Format the payload for the LLM
  // We assign a temporary ID to each review so the LLM can reference it as evidence
  const aggregatedData = sample.map((r: any, index: number) => ({
    record_id: `REV_${index + 1}`,
    text: r.cleaned_text,
    rating: r.rating,
    source: r.region ? 'app_store' : 'play_store'
  }));
  
  const userPrompt = `Here is a sample of 50 real user reviews complaining about Google Photos search/retrieval issues:\n\n${JSON.stringify(aggregatedData, null, 2)}`;
  
  console.log('\nSending data to Groq for deep segmentation analysis. Please wait...');
  
  try {
    const result = await llmClient.getStructuredOutput<any>(
      SEGMENT_SYSTEM_PROMPT,
      userPrompt
    );
    
    console.log('\n=============================================');
    console.log('       GROQ ANALYSIS COMPLETE!               ');
    console.log('=============================================\n');
    
    console.log(`Found ${result.segments?.length || 0} unique user segments!\n`);
    
    for (const segment of result.segments) {
      console.log(`🎯 SEGMENT: ${segment.segment_name.toUpperCase()}`);
      console.log(`Description: ${segment.segment_description}`);
      console.log(`Failure Points: ${segment.dominant_failure_points.join(', ')}`);
      console.log(`Behaviors: ${segment.dominant_behaviours.join(', ')}`);
      console.log(`Evidence Count: ${segment.evidence_record_ids.length} reviews`);
      
      // Print the first piece of evidence text
      if (segment.evidence_record_ids.length > 0) {
        const evId = segment.evidence_record_ids[0];
        const review = aggregatedData.find((r: any) => r.record_id === evId);
        if (review) {
          console.log(`Example Evidence: "${review.text}"`);
        }
      }
      console.log('---------------------------------------------\n');
    }
    
    fs.writeFileSync('llm_insights.json', JSON.stringify(result, null, 2));
    console.log('Full JSON response saved to llm_insights.json');
    
  } catch (error) {
    console.error('LLM Analysis failed:', error);
  }
}

runLocalLLMTest();
