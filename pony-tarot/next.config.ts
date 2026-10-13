import type { NextConfig } from 'next';
const config: NextConfig = { output: 'standalone', images: { unoptimized: true }, trailingSlash: true, devIndicators: false };
export default config;
