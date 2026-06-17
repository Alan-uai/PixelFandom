import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['src'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // Performance: Enable AVIF for better compression
    formats: ['image/avif', 'image/webp'],
  },
  // Performance: Enable compression and caching
  compress: true,
  productionBrowserSourceMaps: false,
  // Performance: Optimize bundle
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/icon-:size(192|512).png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      const backend = process.env.PSYCHO_BACKEND_URL || 'http://localhost:8000';
      return [
        { source: '/api/token', destination: `${backend}/api/token` },
        { source: '/api/rag/:path*', destination: `${backend}/api/rag/:path*` },
        { source: '/api/session/:path*', destination: `${backend}/api/session/:path*` },
        { source: '/api/sessions/:path*', destination: `${backend}/api/sessions/:path*` },
        { source: '/api/mood/:path*', destination: `${backend}/api/mood/:path*` },
        { source: '/api/goals/:path*', destination: `${backend}/api/goals/:path*` },
        { source: '/api/profile/:path*', destination: `${backend}/api/profile/:path*` },
        { source: '/api/profiles/:path*', destination: `${backend}/api/profiles/:path*` },
        { source: '/api/settings/:path*', destination: `${backend}/api/settings/:path*` },
        { source: '/api/agents', destination: `${backend}/api/agents` },
        { source: '/api/wellington/:path*', destination: `${backend}/api/wellington/:path*` },
      ];
    }
    return [];
  },
};

export default withNextIntl(nextConfig);
