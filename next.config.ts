import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking already runs in CI via `tsc --noEmit`.
    // Skip the redundant check during `next build` to speed up Vercel deploys.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
