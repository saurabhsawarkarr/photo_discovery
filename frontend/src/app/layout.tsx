import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Google Photos Research | Discovery Engine",
  description:
    "Research findings, user interviews, and AI-powered Q&A for Google Photos photo retrieval failures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <nav className="global-nav">
          <div className="nav-inner">
            <Link href="/" className="nav-brand">
              <span className="nav-brand-icon">📸</span>
              <span>GP Discovery</span>
            </Link>
            <div className="nav-links">
              <Link href="/findings" className="nav-link">
                📋 Findings
              </Link>
              <Link href="/ask" className="nav-link nav-link-cta">
                💬 Ask Research
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
