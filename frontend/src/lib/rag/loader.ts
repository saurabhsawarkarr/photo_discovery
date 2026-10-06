import fs from 'fs';
import path from 'path';

export interface DocumentChunk {
  id: string;
  text: string;
  source: string;
  sourceLabel: string;
}

// Relative to the Next.js project root (frontend/)
const DOCS_DIR = path.join(process.cwd(), '..', 'Docs');
const DATA_DIR = path.join(process.cwd(), '..', 'data', 'phase4');

function chunkText(
  text: string,
  source: string,
  sourceLabel: string,
  chunkSize = 900,
  overlap = 200,
  delimiter = /\n{2,}/
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Split on paragraph/section boundaries first for more natural chunks
  const sections = text.split(delimiter);
  let buffer = '';
  let chunkIndex = 0;

  for (const section of sections) {
    if ((buffer + '\n\n' + section).length > chunkSize && buffer.length > 100) {
      chunks.push({
        id: `${source}-${chunkIndex++}`,
        text: buffer.trim(),
        source,
        sourceLabel,
      });
      // Keep last `overlap` chars as context for next chunk
      buffer = buffer.slice(-overlap) + '\n\n' + section;
    } else {
      buffer = buffer ? buffer + '\n\n' + section : section;
    }
  }

  // Flush remaining buffer
  if (buffer.trim().length > 80) {
    chunks.push({
      id: `${source}-${chunkIndex}`,
      text: buffer.trim(),
      source,
      sourceLabel,
    });
  }

  return chunks;
}

function safeRead(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.warn(`[RAG Loader] Could not read: ${filePath}`);
    return null;
  }
}

export function loadAllChunks(): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];

  // ── Text / Markdown documents ─────────────────────────────────────────────
  // (Removed manual user interviews and synthesized findings as per user instruction. 
  // The RAG must strictly represent the AI Discovery Engine's automated data only.)

  // ── JSON / structured data ────────────────────────────────────────────────
  const jsonFiles: { file: string; source: string; label: string }[] = [
    {
      file: path.join(DATA_DIR, 'phase4d_themes.json'),
      source: 'themes',
      label: 'LLM Theme Analysis (13k reviews)',
    },
    {
      file: path.join(DATA_DIR, 'phase4e_segments.json'),
      source: 'segments',
      label: 'User Segment Analysis',
    },
    {
      file: path.join(DATA_DIR, 'phase4c_aggregation.json'),
      source: 'stats',
      label: 'Failure Point Statistics',
    },
    {
      file: path.join(DATA_DIR, 'phase4f_hypotheses.json'),
      source: 'hypotheses',
      label: 'Research Hypotheses & Interview Questions',
    },
    {
      file: path.join(DATA_DIR, 'phase4b_journeys.json'),
      source: 'journeys',
      label: 'User Journey Extractions (111 journeys)',
    },
  ];

  for (const { file, source, label } of jsonFiles) {
    const raw = safeRead(file);
    if (raw) {
      try {
        const json = JSON.parse(raw);
        
        const rootKeys = Object.keys(json);
        const arrayKey = rootKeys.find(k => Array.isArray(json[k]) && k !== 'metadata');

        if (Array.isArray(json)) {
          // The JSON itself is an array
          for (let i = 0; i < json.length; i++) {
            const itemText = JSON.stringify(json[i], null, 2);
            allChunks.push({
              id: `${source}-${i}`,
              text: itemText,
              source,
              sourceLabel: label,
            });
          }
          console.log(`[RAG Loader] ${label}: ${json.length} chunks (by semantic object)`);
        } else if (arrayKey) {
          // The JSON has an array property (e.g. json.themes)
          const items = json[arrayKey];
          for (let i = 0; i < items.length; i++) {
            const itemText = JSON.stringify(items[i], null, 2);
            allChunks.push({
              id: `${source}-${i}`,
              text: itemText,
              source,
              sourceLabel: label,
            });
          }
          console.log(`[RAG Loader] ${label}: ${items.length} chunks (by semantic object)`);
        } else {
          // For single objects like aggregation stats, fallback to character chunking
          const text = JSON.stringify(json, null, 2);
          const chunks = chunkText(text, source, label, 1500, 250, /\n/);
          allChunks.push(...chunks);
          console.log(`[RAG Loader] ${label}: ${chunks.length} chunks (by text split)`);
        }
      } catch (err) {
        console.warn(`[RAG Loader] Failed to parse JSON: ${file}`, err);
      }
    }
  }

  console.log(`[RAG Loader] Total chunks loaded: ${allChunks.length}`);
  return allChunks;
}
