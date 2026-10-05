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
  overlap = 200
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Split on paragraph/section boundaries first for more natural chunks
  const sections = text.split(/\n{2,}/);
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
  const textFiles: { file: string; source: string; label: string }[] = [
    {
      file: path.join(DOCS_DIR, 'Findings.md'),
      source: 'findings',
      label: 'Research Findings',
    },
    {
      file: path.join(DOCS_DIR, 'Context.md'),
      source: 'context',
      label: 'Research Context & Framework',
    },
    {
      file: path.join(DOCS_DIR, 'interview_text.txt'),
      source: 'interviews',
      label: 'User Interviews (Ishwar, Resham, Naina, Pritish)',
    },
  ];

  for (const { file, source, label } of textFiles) {
    const text = safeRead(file);
    if (text) {
      const chunks = chunkText(text, source, label);
      allChunks.push(...chunks);
      console.log(`[RAG Loader] ${label}: ${chunks.length} chunks`);
    }
  }

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
  ];

  for (const { file, source, label } of jsonFiles) {
    const raw = safeRead(file);
    if (raw) {
      try {
        const json = JSON.parse(raw);
        // Pretty-print JSON so chunks contain readable key-value text
        const text = JSON.stringify(json, null, 2);
        const chunks = chunkText(text, source, label, 1100, 250);
        allChunks.push(...chunks);
        console.log(`[RAG Loader] ${label}: ${chunks.length} chunks`);
      } catch {
        console.warn(`[RAG Loader] Failed to parse JSON: ${file}`);
      }
    }
  }

  console.log(`[RAG Loader] Total chunks loaded: ${allChunks.length}`);
  return allChunks;
}
