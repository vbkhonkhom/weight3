import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. We'll catch and fix them iteratively.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
