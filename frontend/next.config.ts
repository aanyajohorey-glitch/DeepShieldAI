import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server (node_modules pruned to only
  // what's needed at runtime) — this is what backend/Dockerfile copies in.
  output: "standalone",
};

export default nextConfig;
