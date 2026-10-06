'use client';

import React from 'react';
import {
  Brain,
  Search,
  SearchX,
  Frown,
  Compass,
  AlertCircle,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';

const FAILURE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  F: { bg: '#e8f0fe', text: '#1a73e8', border: '#d2e3fc' }, // Search Recovery
  G: { bg: '#fce8e6', text: '#d93025', border: '#fad2cf' }, // Abandonment
  D: { bg: '#fef7e0', text: '#b06000', border: '#feefc3' }, // Result Relevance
  C: { bg: '#f3e8fd', text: '#8430ce', border: '#e9d2fd' }, // Search Understanding
  B: { bg: '#e6f4ea', text: '#188038', border: '#ceead6' }, // Query Formulation
  A: { bg: '#e8eaed', text: '#3c4043', border: '#dadce0' }, // Memory Expression
  E: { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' }, // Result Evaluation
};

export default function OverviewCharts({ failureDistribution, themes }: any) {
  const getFailureIcon = (id: string) => {
    switch (id) {
      case 'A': return <Brain size={22} color="#3c4043" />;
      case 'B': return <Search size={22} color="#188038" />;
      case 'C': return <SearchX size={22} color="#8430ce" />;
      case 'D': return <AlertCircle size={22} color="#b06000" />;
      case 'E': return <FileQuestion size={22} color="#0284c7" />;
      case 'F': return <Compass size={22} color="#1a73e8" />;
      case 'G': return <Frown size={22} color="#d93025" />;
      default: return <HelpCircle size={22} color="#5f6368" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', marginTop: '2.5rem' }}>
      
      {/* ── FAILURES SUMMARY ─────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '14px', border: '1px solid #e0e2e6', boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f3f4', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#202124', margin: 0 }}>
              Failure Point Distribution (Points A – G)
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#5f6368', marginTop: '0.35rem', margin: '0.35rem 0 0' }}>
              Distribution of primary failure modes identified across 111 structured retrieval journeys.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {failureDistribution.map((f: any) => {
            const color = FAILURE_COLORS[f.id] || { bg: '#f1f3f4', text: '#202124', border: '#dadce0' };
            return (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.15rem',
                  padding: '1.15rem 1.25rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${color.border}`,
                  boxShadow: '0 1px 2px rgba(60, 64, 67, 0.04)',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    backgroundColor: color.bg,
                    borderRadius: '10px',
                    border: `1px solid ${color.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getFailureIcon(f.id)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#202124', fontSize: '1rem' }}>
                      Point {f.id}: {f.name}
                    </h4>
                    <span style={{ fontWeight: 800, color: color.text, fontSize: '1.15rem' }}>
                      {f.percentage}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                    {/* Mini progress track */}
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f3f4', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(f.percentage * 2, 100)}%`,
                          height: '100%',
                          backgroundColor: color.text,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                    <span style={{ color: '#5f6368', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {f.count} journeys
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── THEMES COMPONENT ─────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '14px', border: '1px solid #e0e2e6', boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)' }}>
        <div style={{ borderBottom: '1px solid #f1f3f4', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#202124', margin: 0 }}>
            Common Behavioral Themes Discovered
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#5f6368', margin: '0.35rem 0 0' }}>
            High-level recurring pain patterns synthesised by the AI Discovery Engine.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {themes.map((theme: any) => (
            <div
              key={theme.theme_id}
              style={{
                display: 'flex',
                gap: '1.5rem',
                padding: '1.5rem',
                border: '1px solid #e0e2e6',
                borderRadius: '12px',
                backgroundColor: '#f8fafd',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  backgroundColor: '#e8f0fe',
                  border: '1px solid #d2e3fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1a73e8',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  flexShrink: 0,
                }}
              >
                {theme.theme_id}
              </div>
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#202124' }}>
                  {theme.theme_name}
                </h4>
                <p style={{ margin: '0.5rem 0 1rem', color: '#3c4043', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {theme.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {theme.related_failure_points.map((fp: string) => (
                    <span
                      key={fp}
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        padding: '0.35rem 0.85rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #dadce0',
                        color: '#202124',
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a73e8' }} />
                      Failure Point {fp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
