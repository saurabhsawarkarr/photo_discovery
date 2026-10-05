'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  isStreaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Why do users abandon their photo search?',
  'What is the Specificity Paradox?',
  'What did Resham say about her search experience?',
  'What are the three key findings and how do they connect?',
  'Which failure point occurs most frequently?',
  'What user segments were identified in the research?',
  'How did Naina manage to find her photo successfully?',
  'What percentage of journeys ended in abandonment?',
];

const SOURCE_ICONS: Record<string, string> = {
  'Research Findings': '📋',
  'Research Context & Framework': '🗺️',
  'User Interviews (Ishwar, Resham, Naina, Pritish)': '🎙️',
  'LLM Theme Analysis (13k reviews)': '🤖',
  'User Segment Analysis': '👥',
  'Failure Point Statistics': '📊',
};

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (question: string) => {
    const q = question.trim();
    if (!q || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
    };

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      sources: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process all complete SSE lines in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'sources') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, sources: event.sources } : m
                )
              );
            } else if (event.type === 'token') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: m.content + event.content }
                    : m
                )
              );
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, isStreaming: false } : m
                )
              );
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content:
                  'Sorry, something went wrong. Please check that the server is running and the Groq API key is configured.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🔬</div>
          <div>
            <div className={styles.headerTitle}>Research Q&amp;A</div>
            <div className={styles.headerSubtitle}>
              Google Photos Discovery · Ask anything about the research
            </div>
          </div>
        </div>
        <div className={styles.headerBadge}>
          <span className={styles.statusDot} />
          6 documents · 111 journeys · 4 interviews
        </div>
      </header>

      {/* ── Suggested questions (shown only when no messages) ─────── */}
      {messages.length === 0 && (
        <div className={styles.suggestedWrap}>
          <div className={styles.suggestedLabel}>Try asking</div>
          <div className={styles.suggestedGrid}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                className={styles.suggestedPill}
                onClick={() => handleSubmit(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat messages area ─────────────────────────────────────── */}
      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <div className={styles.emptyTitle}>Ask the research</div>
            <div className={styles.emptyDesc}>
              Get instant, evidence-backed answers from 6 research documents —
              findings, interviews, 13k app reviews, and user segment data.
            </div>
            <div className={styles.docList}>
              {[
                '📋 Findings.md',
                '🗺️ Context.md',
                '🎙️ User Interviews',
                '📊 Statistics',
                '👥 Segments',
                '🤖 Theme Analysis',
              ].map((d) => (
                <span key={d} className={styles.docChip}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={styles.message}>
            {msg.role === 'user' ? (
              <div className={styles.messageUser}>
                <div className={styles.bubbleUser}>{msg.content}</div>
              </div>
            ) : (
              <div className={styles.messageAI}>
                <div className={styles.aiAvatar}>🔬</div>
                <div>
                  {msg.isStreaming && msg.content === '' ? (
                    <div className={styles.thinking}>
                      <div className={styles.dots}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </div>
                      Searching research documents…
                    </div>
                  ) : (
                    <div className={styles.bubbleAI}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {msg.isStreaming && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '1em',
                            background: '#6366f1',
                            marginLeft: '2px',
                            verticalAlign: 'middle',
                            animation: 'pulse 1s infinite',
                          }}
                        />
                      )}
                    </div>
                  )}
                  {/* Source chips */}
                  {!msg.isStreaming &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div className={styles.sourcesRow}>
                        {msg.sources.map((src) => (
                          <span key={src} className={styles.sourceChip}>
                            {SOURCE_ICONS[src] ?? '📄'} {src}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────── */}
      <div className={styles.inputBar}>
        <div className={styles.inputWrap}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask anything about the Google Photos research…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSubmit(input)}
            disabled={isLoading || !input.trim()}
            aria-label="Send question"
          >
            {isLoading ? '⏳' : '↑'}
          </button>
        </div>
        <div className={styles.inputHint}>
          Press Enter to send · Shift+Enter for new line · Answers grounded in
          research documents
        </div>
      </div>
    </div>
  );
}
