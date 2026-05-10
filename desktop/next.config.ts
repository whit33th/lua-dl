import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: "./",
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    optimizeCss: true,
  },
  images: {
    loader: "custom",
    loaderFile: "/loader.js",
  },
  reactCompiler: true,
  trailingSlash: true,
};

export default nextConfig;
