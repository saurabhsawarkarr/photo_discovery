import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for groq-sdk and other Node.js-native packages used in API routes
  serverExternalPackages: ["groq-sdk"],
  // Allow reading files from parent directory (Docs/, data/) in API routes
  experimental: {},
};

export default nextConfig;
