import { DocumentChunk } from './loader';

// Common English stop words to ignore during scoring
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'day', 'had', 'him', 'his', 'how', 'its',
  'who', 'did', 'get', 'has', 'may', 'use', 'two', 'way', 'with', 'that',
  'this', 'they', 'from', 'have', 'been', 'were', 'said', 'each', 'she',
  'which', 'their', 'will', 'other', 'about', 'into', 'than', 'then',
  'when', 'more', 'also', 'what', 'some', 'would', 'make', 'like', 'time',
  'just', 'know', 'take', 'people', 'year', 'your', 'good', 'them', 'give',
  'most', 'very', 'after', 'over', 'such', 'only', 'come', 'could',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// Build inverse document frequency map once across all chunks
function buildIDF(chunks: DocumentChunk[]): Map<string, number> {
  const docFreq = new Map<string, number>();

  for (const chunk of chunks) {
    const uniqueTokens = new Set(tokenize(chunk.text));
    for (const token of uniqueTokens) {
      docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  const N = chunks.length;
  for (const [token, df] of docFreq) {
    idf.set(token, Math.log((N + 1) / (df + 1)) + 1);
  }

  return idf;
}

function scoreTFIDF(
  queryTokens: string[],
  chunkTokens: string[],
  idf: Map<string, number>
): number {
  if (chunkTokens.length === 0) return 0;

  const termFreq = new Map<string, number>();
  for (const t of chunkTokens) {
    termFreq.set(t, (termFreq.get(t) ?? 0) + 1);
  }

  let score = 0;
  for (const qToken of queryTokens) {
    const tf = (termFreq.get(qToken) ?? 0) / chunkTokens.length;
    const idfVal = idf.get(qToken) ?? 1;
    score += tf * idfVal;
  }

  return score;
}

// Optional: boost score when the source is explicitly mentioned in the query
function sourceBoost(query: string, chunk: DocumentChunk): number {
  const q = query.toLowerCase();
  if ((q.includes('statistic') || q.includes('percent') || q.includes('%') || q.includes('frequently') || q.includes('often') || q.includes('common') || q.includes('distribution') || q.includes('number')) && chunk.source === 'stats') return 0.4;
  if ((q.includes('segment') || q.includes('user type')) && chunk.source === 'segments') return 0.3;
  if ((q.includes('theme') || q.includes('pattern')) && chunk.source === 'themes') return 0.3;
  if ((q.includes('hypothes') || q.includes('interview question') || q.includes('testable') || q.includes('validate') || q.includes('research brief')) && chunk.source === 'hypotheses') return 0.8; // Heavily boosted
  if ((q.includes('journey') || q.includes('user story') || q.includes('experience') || q.includes('workaround') || q.includes('scenario')) && chunk.source === 'journeys') return 0.3;
  return 0;
}

// Cache IDF so it's computed once per process lifecycle
let cachedIDF: Map<string, number> | null = null;
let cachedChunkCount = 0;

export function retrieveTopChunks(
  query: string,
  chunks: DocumentChunk[],
  k = 6
): DocumentChunk[] {
  if (chunks.length === 0) return [];

  // Rebuild IDF only if the chunk set changed
  if (!cachedIDF || cachedChunkCount !== chunks.length) {
    cachedIDF = buildIDF(chunks);
    cachedChunkCount = chunks.length;
  }

  const queryTokens = tokenize(query);

  const scored = chunks.map((chunk) => {
    const chunkTokens = tokenize(chunk.text);
    const tfidf = scoreTFIDF(queryTokens, chunkTokens, cachedIDF!);
    const boost = sourceBoost(query, chunk);
    return { chunk, score: tfidf + boost };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((s) => s.score > 0) // drop zero-score chunks
    .map((s) => s.chunk);
}
