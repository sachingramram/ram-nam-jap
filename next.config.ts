import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    experimental: {
    optimizePackageImports: ["bcryptjs", "jsonwebtoken"]
  }
};

export default nextConfig;
