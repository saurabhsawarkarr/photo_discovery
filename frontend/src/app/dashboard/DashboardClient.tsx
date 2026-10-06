'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Search, Brain, SearchX, Frown, Compass, ArrowRight } from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16'];

export default function DashboardClient({ failureDistribution, segments, stats, themes }: any) {
  const [activeTab, setActiveTab] = useState('failures');

  const getFailureIcon = (id: string) => {
    switch (id) {
      case 'A': return <Brain size={24} className="text-purple-500" />;
      case 'B': return <Search size={24} className="text-blue-500" />;
      case 'C': return <SearchX size={24} className="text-red-500" />;
      case 'G': return <Frown size={24} className="text-orange-500" />;
      case 'F': return <Compass size={24} className="text-teal-500" />;
      default: return <Search size={24} />;
    }
  };

  const tabs = [
    { id: 'failures', label: 'Failure Points' },
    { id: 'segments', label: 'User Segments' },
    { id: 'themes', label: 'Common Themes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Total Journeys Analyzed</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{stats.total_records}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Highest Failure Rate</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 800, color: '#ef4444' }}>{failureDistribution[0].percentage}%</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{failureDistribution[0].name}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Top Co-occurring Failure</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>27%</p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Search Recovery (F) + Abandonment (G)</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        
        {/* FAILURES TAB */}
        {activeTab === 'failures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Failure Point Distribution</h2>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failureDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {failureDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              {failureDistribution.map((f: any, idx: number) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                    {getFailureIcon(f.id)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{f.id} - {f.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 800, color: COLORS[idx % COLORS.length], fontSize: '1.25rem' }}>{f.percentage}%</span>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>({f.count} occurrences)</span>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>User Segments</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
              <div style={{ height: '350px', flex: '1 1 400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segments}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={130}
                      paddingAngle={5}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {segments.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {segments.map((seg: any, idx: number) => (
                  <div key={seg.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`, backgroundColor: '#f8fafc', borderRadius: '0 0.5rem 0.5rem 0' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{seg.name}</span>
                    <span style={{ fontWeight: 700, color: COLORS[idx % COLORS.length] }}>{seg.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* THEMES TAB */}
        {activeTab === 'themes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Common Themes Discovered</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {themes.map((theme: any, idx: number) => (
                <div key={theme.theme_id} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS[idx % COLORS.length], fontWeight: 800, fontSize: '1.5rem', flexShrink: 0 }}>
                    {theme.theme_id}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{theme.theme_name}</h4>
                    <p style={{ margin: '0.5rem 0 1rem', color: '#475569', lineHeight: 1.6 }}>{theme.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {theme.related_failure_points.map((fp: string) => (
                        <span key={fp} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '9999px' }}>
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
