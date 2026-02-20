import { resolve } from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    CESIUM_BASE_URL: "/cesium",
  },
  serverExternalPackages: ["cesium"],
  turbopack: {
    root: resolve(import.meta.dirname),
  },
};

export default nextConfig;
