import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Each parallel session runs its own dev server with a separate build dir (npm run dev:a … dev:d).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
