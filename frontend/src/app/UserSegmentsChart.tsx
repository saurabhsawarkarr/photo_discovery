'use client';

import React from 'react';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const SEGMENT_COLORS = ['#1a73e8', '#8430ce', '#188038', '#f29900', '#d93025'];

export default function UserSegmentsChart({ segments }: { segments: any[] }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '1.75rem',
        borderRadius: '14px',
        border: '1px solid #e0e2e6',
        boxShadow: '0 1px 3px rgba(60, 64, 67, 0.06)',
      }}
    >
      <div style={{ borderBottom: '1px solid #f1f3f4', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#202124', margin: 0 }}>
          User Segment Share
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#5f6368', margin: '0.25rem 0 0' }}>
          Corpus distribution across behavioral personas
        </p>
      </div>

      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="percentage"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {segments.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value}% of journeys`, 'Size']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #dadce0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem', borderTop: '1px solid #f1f3f4', paddingTop: '1rem' }}>
        {segments.map((seg, idx) => (
          <div key={seg.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ color: '#202124', fontWeight: 500 }}>{seg.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: '#202124' }}>{seg.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
