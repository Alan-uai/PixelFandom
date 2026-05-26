import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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

export default nextConfig;
