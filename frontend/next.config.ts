import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conditionally enable static export for Firebase
  output: process.env.FIREBASE_BUILD === '1' ? 'export' : undefined,
  // Required for groq-sdk and other Node.js-native packages used in API routes
  serverExternalPackages: ["groq-sdk"],
  // Allow reading files from parent directory (Docs/, data/) in API routes
  experimental: {},
};

export default nextConfig;
