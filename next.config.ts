import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Your existing config stays here...
  
  // Add these PWA configurations:
  headers: async () => {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },

  // Rewrites for PWA files
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/manifest.json',
      },
      {
        source: '/service-worker.js',
        destination: '/service-worker.js',
      },
    ]
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.digitaloceanspaces.com',
      },
    ],
  },

  // Experimental features (optional, for better PWA support)
  experimental: {
    // optimizePackageImports: ['@supabase/supabase-js'],
  },
}

export default nextConfig
