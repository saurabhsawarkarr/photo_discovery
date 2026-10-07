'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Search,
  Brain,
  SearchX,
  Frown,
  Compass,
  AlertCircle,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';

const GOOGLE_COLORS = ['#1a73e8', '#8430ce', '#188038', '#f29900', '#d93025', '#0284c7', '#5f6368'];

export default function DashboardClient({ failureDistribution, segments, stats, themes }: any) {
  const [activeTab, setActiveTab] = useState('failures');

  const getFailureIcon = (id: string) => {
    switch (id) {
      case 'A': return <Brain size={20} color="#3c4043" />;
      case 'B': return <Search size={20} color="#188038" />;
      case 'C': return <SearchX size={20} color="#8430ce" />;
      case 'D': return <AlertCircle size={20} color="#b06000" />;
      case 'E': return <FileQuestion size={20} color="#0284c7" />;
      case 'F': return <Compass size={20} color="#1a73e8" />;
      case 'G': return <Frown size={20} color="#d93025" />;
      default: return <HelpCircle size={20} color="#5f6368" />;
    }
  };

  const tabs = [
    { id: 'failures', label: 'Failure Points' },
    { id: 'segments', label: 'User Segments' },
    { id: 'themes', label: 'Common Themes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Overview KPI Cards ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.5rem', borderRadius: '14px', border: '1px solid #e0e2e6', boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Journeys Analyzed</h3>
          <p style={{ margin: '0.4rem 0 0', fontSize: '2.35rem', fontWeight: 800, color: '#202124', letterSpacing: '-0.03em' }}>{stats.total_records}</p>
          <p style={{ margin: '0.35rem 0 0', color: '#80868b', fontSize: '0.825rem' }}>From 13k+ raw Play/App Store reviews</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.5rem', borderRadius: '14px', border: '1px solid #e0e2e6', boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Highest Failure Rate</h3>
          <p style={{ margin: '0.4rem 0 0', fontSize: '2.35rem', fontWeight: 800, color: '#d93025', letterSpacing: '-0.03em' }}>{failureDistribution[0].percentage}%</p>
          <p style={{ margin: '0.35rem 0 0', color: '#3c4043', fontSize: '0.85rem', fontWeight: 500 }}>{failureDistribution[0].name}</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '1.6rem 1.5rem', borderRadius: '14px', border: '1px solid #e0e2e6', boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Top Co-occurring Failure</h3>
          <p style={{ margin: '0.4rem 0 0', fontSize: '2.35rem', fontWeight: 800, color: '#f29900', letterSpacing: '-0.03em' }}>27%</p>
          <p style={{ margin: '0.35rem 0 0', color: '#3c4043', fontSize: '0.85rem', fontWeight: 500 }}>Search Recovery (F) + Abandonment (G)</p>
        </div>
      </div>

      {/* ── Tabs Navigation ─────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid #e0e2e6', paddingBottom: '0.85rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '24px',
              border: activeTab === tab.id ? '1px solid #1a73e8' : '1px solid #dadce0',
              fontWeight: 600,
              fontSize: '0.925rem',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#e8f0fe' : '#ffffff',
              color: activeTab === tab.id ? '#1a73e8' : '#5f6368',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content Box ─────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '14px', border: '1px solid #e0e2e6', boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)' }}>
        
        {/* FAILURES TAB */}
        {activeTab === 'failures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#202124', margin: 0 }}>
                Failure Point Frequency Across Corpus
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#5f6368', margin: '0.35rem 0 0' }}>
                Percentage of journeys where each retrieval failure point occurred
              </p>
            </div>
            
            <div style={{ height: '360px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failureDistribution} margin={{ top: 20, right: 30, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} tick={{ fill: '#5f6368', fontSize: 12, fontWeight: 500 }} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#5f6368', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Percentage']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #dadce0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {failureDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={GOOGLE_COLORS[index % GOOGLE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              {failureDistribution.map((f: any, idx: number) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem', backgroundColor: '#f8fafd', borderRadius: '10px', border: '1px solid #e0e2e6' }}>
                  <div style={{ padding: '0.65rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getFailureIcon(f.id)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#202124', fontSize: '0.95rem' }}>{f.id} – {f.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 800, color: GOOGLE_COLORS[idx % GOOGLE_COLORS.length], fontSize: '1.15rem' }}>{f.percentage}%</span>
                      <span style={{ color: '#5f6368', fontSize: '0.825rem' }}>({f.count} journeys)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEGMENTS TAB */}
        {activeTab === 'segments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#202124', margin: 0 }}>
                Discovered User Segments
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#5f6368', margin: '0.35rem 0 0' }}>
                Clustered mental models and retrieval patterns identified by LLM
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
              <div style={{ height: '320px', flex: '1 1 360px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segments}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {segments.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={GOOGLE_COLORS[index % GOOGLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dadce0', fontSize: '0.85rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {segments.map((seg: any, idx: number) => (
                  <div key={seg.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderLeft: `4px solid ${GOOGLE_COLORS[idx % GOOGLE_COLORS.length]}`, backgroundColor: '#f8fafd', borderRadius: '0 8px 8px 0', border: '1px solid #e0e2e6', borderLeftWidth: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#202124', fontSize: '0.95rem' }}>{seg.name}</span>
                    <span style={{ fontWeight: 800, color: GOOGLE_COLORS[idx % GOOGLE_COLORS.length], fontSize: '1.1rem' }}>{seg.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* THEMES TAB */}
        {activeTab === 'themes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#202124', margin: 0 }}>
                Synthesized Behavioral Themes
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#5f6368', margin: '0.35rem 0 0' }}>
                Core underlying drivers of search friction and abandonment
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {themes.map((theme: any, idx: number) => (
                <div key={theme.theme_id} style={{ display: 'flex', gap: '1.35rem', padding: '1.4rem', border: '1px solid #e0e2e6', borderRadius: '12px', backgroundColor: '#f8fafd', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#e8f0fe', border: '1px solid #d2e3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0 }}>
                    {theme.theme_id}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#202124' }}>{theme.theme_name}</h4>
                    <p style={{ margin: '0.45rem 0 0.85rem', color: '#3c4043', lineHeight: 1.6, fontSize: '0.95rem' }}>{theme.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {theme.related_failure_points.map((fp: string) => (
                        <span key={fp} style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.75rem', backgroundColor: '#ffffff', border: '1px solid #dadce0', color: '#202124', borderRadius: '16px' }}>
                          Failure Point {fp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
