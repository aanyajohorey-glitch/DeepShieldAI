import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server (node_modules pruned to only
  // what's needed at runtime) — this is what frontend/Dockerfile copies in
  // for self-hosted deployments. Vercel ignores this setting and uses its
  // own build output, so it's safe to leave on for either deployment target.
  output: "standalone",
};

export default nextConfig;
