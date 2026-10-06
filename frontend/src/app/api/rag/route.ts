import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadAllChunks } from '@/lib/rag/loader';
import { retrieveTopChunks } from '@/lib/rag/retriever';
import { DocumentChunk } from '@/lib/rag/loader';
import * as fs from 'fs';
import * as path from 'path';

// ── Module-level chunk cache (persists across requests in one server instance) ─
let cachedChunks: DocumentChunk[] | null = null;

function getChunks(): DocumentChunk[] {
  if (!cachedChunks) {
    cachedChunks = loadAllChunks();
  }
  return cachedChunks;
}

// ── Query Cache ──────────────────────────────────────────────────────────────
interface CacheEntry {
  sources: string[];
  content: string;
}
const queryCache = new Map<string, CacheEntry>();

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a research assistant for a Google Photos user research project led by Saurabh.

The project investigated one core question: "Where exactly are users failing when trying to retrieve a vaguely remembered photo, and why?"

Research was conducted using an AI Discovery Engine:
- Analyzed 13,252 app reviews
- Extracted 111 structured user journey extractions
- Derived a retrieval journey framework with failure points A–G

Your role:
- Answer questions ONLY based on the provided research context
- Be specific: cite statistics, failure points, user quotes, segment names, and theme names
- Do NOT expose internal JSON IDs (like "T1", "T2", "S1", "S2") to the user. Always use the natural descriptive names directly (e.g., "The Indexing Black Hole" instead of "Theme T1").
- Provide exhaustive and detailed answers. Do not summarize or abbreviate lists; if there are multiple items (e.g. multiple hypotheses, segments, or themes), list them all fully with their complete details.
- Use markdown formatting for clarity (bold key numbers, bullet points for lists)
- If a question cannot be answered from the context, say so clearly
- Never speculate beyond what the research evidence supports

Failure point reference (A–G):
A = Memory Expression, B = Query Formulation, C = Search Understanding,
D = Result Relevance, E = Result Evaluation, F = Search Recovery, G = Abandonment`;

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json();

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Query Analytics Logging ──────────────────────────────────────────────
    try {
      const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        question: question.trim(),
        historyLength: history?.length || 0,
      }) + '\n';
      
      const logPath = path.join(process.cwd(), '..', 'data', 'rag_queries.jsonl');
      fs.appendFileSync(logPath, logEntry);
    } catch (e) {
      console.error('Failed to log query analytics:', e);
    }

    // ── Check Cache ──────────────────────────────────────────────────────────
    const cacheKey = JSON.stringify({ q: question.trim(), h: history });
    if (queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)!;
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: cached.sources })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: cached.content })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        }
      });
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ── 1. Retrieve relevant chunks ──────────────────────────────────────────
    // If the question is very short (e.g. "why?"), include the last user question for better retrieval context
    let retrievalQuery = question.trim();
    if (retrievalQuery.length < 20 && history.length > 0) {
      const lastUserMsg = [...history].reverse().find((m: any) => m.role === 'user');
      if (lastUserMsg) {
        retrievalQuery = `${lastUserMsg.content} ${retrievalQuery}`;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const chunks = getChunks();
    // Retrieve top 8 chunks since Gemini has a massive context window!
    const relevantChunks = retrieveTopChunks(retrievalQuery, chunks, 8);

    if (relevantChunks.length === 0) {
      // Fallback: return 2 chunks from the themes doc
      const fallback = chunks.filter((c) => c.source === 'themes').slice(0, 2);
      relevantChunks.push(...fallback);
    }

    // ── 2. Build context string ──────────────────────────────────────────────
    const context = relevantChunks
      .map((c, i) => `[Source ${i + 1} — ${c.sourceLabel}]\n${c.text}`)
      .join('\n\n---\n\n');

    // Deduplicated source labels for the UI
    const sources = [...new Set(relevantChunks.map((c) => c.sourceLabel))];

    // ── 3. Compose the user prompt ────────────────────────────────────────────
    const userPrompt = `Here is the relevant research context:

${context}

---

Question: ${question}

Please answer based strictly on the research context above. Include specific numbers and user quotes where available. Do not inject inline source citations (e.g., "Source 1") into your text.`;

    // ── 4. Call Gemini with streaming ──────────────────────────────────────────
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // Format history for Gemini
    const recentHistory = history.slice(-4);
    const formattedHistory = recentHistory.map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      }
    });

    const result = await chat.sendMessageStream(userPrompt);

    // ── 5. Return SSE stream ─────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        // Send sources metadata first so the UI can render source chips immediately
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
        );

        let fullContent = '';
        try {
          for await (const chunk of result.stream) {
            const content = chunk.text();
            if (content) {
              fullContent += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
              );
            }
          }
        } catch (e) {
          console.error('[Gemini Stream Error]', e);
        }

        // Save to cache
        queryCache.set(cacheKey, { sources, content: fullContent });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err: any) {
    console.error('[RAG API] Error:', err);
    
    const statusCode = err.status || 500;
    const errStr = String(err).toLowerCase();
    const isRateLimit = statusCode === 429 || statusCode === 413 || errStr.includes('rate limit') || errStr.includes('rate_limit');
    
    return new Response(
      JSON.stringify({ 
        error: isRateLimit ? 'Rate limit reached' : 'Internal server error', 
        detail: String(err) 
      }),
      { 
        status: isRateLimit ? 429 : statusCode, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
