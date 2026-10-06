import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Google Photos Research | AI Discovery Engine",
  description:
    "AI-powered analysis and structured insights for Google Photos retrieval failures across 13,000+ user reviews.",
  icons: {
    icon: "/google-photos.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/google-photos.svg" type="image/svg+xml" />
      </head>
      <body>
        <div className="dashboard-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
