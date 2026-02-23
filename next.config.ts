import { resolve } from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  env: {
    CESIUM_BASE_URL: "/cesium",
  },
  serverExternalPackages: ["cesium"],
  turbopack: {
    root: resolve(import.meta.dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "zustand"],
  },
};

export default nextConfig;
