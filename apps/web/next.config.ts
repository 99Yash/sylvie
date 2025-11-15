import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  // Don't externalize jsdom - let Next.js bundle it to avoid path resolution issues
  // This is needed for isomorphic-dompurify to work during SSR/build
};

export default nextConfig;
