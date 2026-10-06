'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GooglePhotosLogo from './GooglePhotosLogo';
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Users2,
  Lightbulb,
  FileText,
  Database,
  Cpu,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/failures', label: 'Failure Themes', icon: AlertTriangle },
  { href: '/segments', label: 'User Segments', icon: Users2 },
  { href: '/insights', label: 'Behavioural Insights', icon: Lightbulb },
  { href: '/findings', label: 'Research Findings', icon: FileText },
  { href: '/evidence', label: 'Evidence Explorer', icon: Database },
  { href: '/pipeline', label: 'Pipeline Status', icon: Cpu },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand-link">
          <GooglePhotosLogo size={30} />
          <div className="sidebar-brand-text">
            <span className="brand-title">Google Photos</span>
            <span className="brand-subtitle">Discovery Engine</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Research & Analysis</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '0.75rem' }}>Interactive AI</div>
        <Link
          href="/ask"
          className={`sidebar-link sidebar-link-cta ${pathname === '/ask' ? 'active' : ''}`}
        >
          <MessageSquare size={18} className="sidebar-icon" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>RAG Assistant</span>
            <span className="cta-chip">
              <Sparkles size={11} /> AI
            </span>
          </div>
        </Link>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="corpus-badge">
          <span className="corpus-dot"></span>
          <div className="corpus-info">
            <span className="corpus-title">Corpus Size</span>
            <span className="corpus-meta">13,252 Reviews · 111 Journeys</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
