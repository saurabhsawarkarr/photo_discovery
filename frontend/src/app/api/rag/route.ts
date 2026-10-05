import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { loadAllChunks } from '@/lib/rag/loader';
import { retrieveTopChunks } from '@/lib/rag/retriever';
import { DocumentChunk } from '@/lib/rag/loader';

// ── Module-level chunk cache (persists across requests in one server instance) ─
let cachedChunks: DocumentChunk[] | null = null;

function getChunks(): DocumentChunk[] {
  if (!cachedChunks) {
    cachedChunks = loadAllChunks();
  }
  return cachedChunks;
}

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a research assistant for a Google Photos user research project led by Saurabh.

The project investigated one core question: "Where exactly are users failing when trying to retrieve a vaguely remembered photo, and why?"

Research was conducted using:
- AI Discovery Engine: 13,252 app reviews → 111 structured user journey extractions
- 4 contextual user interviews (Ishwar, Resham, Naina, Pritish) with live search tasks
- A survey of 13 Google Photos users
- A retrieval journey framework with failure points A–G

Your role:
- Answer questions ONLY based on the provided research context
- Be specific: cite statistics, failure point codes (A–G), user quotes, segment names, and theme names
- Use markdown formatting for clarity (bold key numbers, bullet points for lists)
- If a question cannot be answered from the context, say so clearly and suggest what related information IS available
- Never speculate beyond what the research evidence supports

Failure point reference (A–G):
A = Memory Expression, B = Query Formulation, C = Search Understanding,
D = Result Relevance, E = Result Evaluation, F = Search Recovery, G = Abandonment`;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── 1. Retrieve relevant chunks ──────────────────────────────────────────
    const chunks = getChunks();
    const relevantChunks = retrieveTopChunks(question.trim(), chunks, 6);

    if (relevantChunks.length === 0) {
      // Fallback: return a few chunks from the core findings doc
      const fallback = chunks.filter((c) => c.source === 'findings').slice(0, 3);
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

Please answer based strictly on the research context above. Include specific numbers, user quotes, and source references where available.`;

    // ── 4. Call Groq with streaming ──────────────────────────────────────────
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const groqStream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      max_tokens: 1200,
      temperature: 0.2,
    });

    // ── 5. Return SSE stream ─────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        // Send sources metadata first so the UI can render source chips immediately
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
        );

        for await (const chunk of groqStream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
            );
          }
        }

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
      },
    });
  } catch (err) {
    console.error('[RAG API] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
