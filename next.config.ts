import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize package imports for faster builds
    optimizePackageImports: ['lucide-react', 'framer-motion', '@supabase/ssr'],
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression (enabled by default in production)
  compress: true,

  // Faster compilation
  reactStrictMode: true,
};

export default nextConfig;
