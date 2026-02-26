import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/scoring-crediticio',
  assetPrefix: '/scoring-crediticio/',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
