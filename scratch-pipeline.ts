import fs from 'fs';
import { TextCleaner } from './src/pipeline/cleaner';
import { RelevanceFilter } from './src/pipeline/relevance-filter';
import { CLASSIFICATIONS } from './src/shared/constants';

async function runLocalPipeline() {
  console.log('--- Starting Local In-Memory Pipeline ---');
  
  const cleaner = new TextCleaner();
  const filter = new RelevanceFilter();
  
  // 1. Load Data
  console.log('Loading raw JSON data...');
  let playData: any[] = [];
  let appleData: any[] = [];
  
  if (fs.existsSync('50k_play_reviews.json')) {
    playData = JSON.parse(fs.readFileSync('50k_play_reviews.json', 'utf8'));
    console.log(`Loaded ${playData.length} Google Play reviews.`);
  }
  
  if (fs.existsSync('10k_appstore_reviews.json')) {
    appleData = JSON.parse(fs.readFileSync('10k_appstore_reviews.json', 'utf8'));
    console.log(`Loaded ${appleData.length} App Store reviews.`);
  }

  let youtubeData: any[] = [];
  if (fs.existsSync('youtube_results.json')) {
    const raw = JSON.parse(fs.readFileSync('youtube_results.json', 'utf8'));
    youtubeData = raw.map((r: any) => ({
      source: 'youtube',
      raw_text: r.comment_text,
      source_url: `https://www.youtube.com/watch?v=${r.video_id}`,
      ...r
    }));
    console.log(`Loaded ${youtubeData.length} YouTube comments.`);
  }

  let redditData: any[] = [];
  if (fs.existsSync('reddit_results.json')) {
    const raw = JSON.parse(fs.readFileSync('reddit_results.json', 'utf8'));
    redditData = raw.map((r: any) => ({
      source: 'reddit',
      raw_text: r.text ? `${r.title}\n\n${r.text}` : r.title,
      source_url: r.url,
      ...r
    }));
    console.log(`Loaded ${redditData.length} Reddit posts.`);
  }
  
  const allData = [...playData, ...appleData, ...youtubeData, ...redditData];
  console.log(`Total raw records: ${allData.length}`);
  
  // 2. In-Memory Deduplication & Cleaning
  console.log('\nRunning Cleaner and Deduplication...');
  const seenTexts = new Set<string>();
  const cleanedRecords: any[] = [];
  let tooShortCount = 0;
  
  for (const record of allData) {
    if (!record.raw_text) continue;
    
    // Clean text
    const cleanResult = cleaner.clean(record.raw_text);
    
    // Strict English-only and gibberish filter
    // 1. Language must be 'eng'
    // 2. Remove if it contains many non-Latin/non-punctuation characters
    const nonLatinRegex = /[^\x20-\x7E\u00A0-\u00FF\u2000-\u206F]/g;
    const nonLatinMatches = cleanResult.cleanedText.match(nonLatinRegex);
    const nonLatinRatio = nonLatinMatches ? (nonLatinMatches.length / cleanResult.cleanedText.length) : 0;
    
    if (cleanResult.language !== 'eng' || nonLatinRatio > 0.1) {
      tooShortCount++; // counting as invalid
      continue;
    }
    
    if (!cleanResult.isValid) {
      tooShortCount++;
      continue;
    }
    
    const textHash = cleanResult.cleanedText.toLowerCase().trim();
    if (seenTexts.has(textHash)) {
      continue; // Skip exact duplicates
    }
    seenTexts.add(textHash);
    
    cleanedRecords.push({
      ...record,
      cleaned_text: cleanResult.cleanedText,
      language: cleanResult.language
    });
  }
  
  console.log(`Removed ${allData.length - cleanedRecords.length - tooShortCount} duplicates.`);
  console.log(`Removed ${tooShortCount} invalid/short records.`);
  console.log(`Remaining valid records: ${cleanedRecords.length}`);
  
  // 3. Relevance Filtering
  console.log('\nRunning Keyword Relevance Filter (Pass 1)...');
  const relevantRecords: any[] = [];
  const irrelevantRecords: any[] = [];
  
  for (const record of cleanedRecords) {
    const classification = filter.pass1Classify(record.cleaned_text);
    
    if (classification === CLASSIFICATIONS.POTENTIALLY_RELEVANT) {
      relevantRecords.push(record);
    } else {
      irrelevantRecords.push(record);
    }
  }
  
  console.log(`Filtered out ${irrelevantRecords.length} completely irrelevant records.`);
  console.log(`Identified ${relevantRecords.length} POTENTIALLY RELEVANT records for the LLM!`);
  
  // Save results
  fs.writeFileSync('relevant_reviews.json', JSON.stringify(relevantRecords, null, 2));
  console.log('\nSaved highly relevant subset to ./relevant_reviews.json');
}

runLocalPipeline().catch(console.error);
