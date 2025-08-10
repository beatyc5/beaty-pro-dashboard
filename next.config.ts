import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || `${Date.now()}`,
  },
  typescript: {
    // !! WARN !!
    // Ignoring TypeScript errors for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Ignoring ESLint errors for deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
