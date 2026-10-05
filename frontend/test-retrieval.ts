import { loadAllChunks } from './src/lib/rag/loader';
import { retrieveTopChunks } from './src/lib/rag/retriever';

const chunks = loadAllChunks();

const testQueries = [
  "What percentage of users abandon their search?",
  "Tell me about the specific paradox.",
  "What did Resham say about her search experience?",
  "What are the three key findings and how do they connect?",
  "Which failure point occurs most frequently?",
  "What user segments were identified in the research?",
  "How did Naina manage to find her photo successfully?",
  "Why do users give up on finding a photo?",
  "percentage abandon",
  "Naina photo",
  "Resham search",
  "failure point statistics",
  "segments user type"
];

for (const query of testQueries) {
  console.log(`\n================================`);
  console.log(`Query: "${query}"`);
  console.log(`================================`);
  
  const results = retrieveTopChunks(query, chunks, 3); // Get top 3 chunks
  
  if (results.length === 0) {
    console.log("No results found.");
  } else {
    results.forEach((r, idx) => {
      console.log(`[Rank ${idx + 1}] Source: ${r.sourceLabel}`);
      console.log(`Preview: ${r.text.substring(0, 100).replace(/\n/g, ' ')}...`);
    });
  }
}
