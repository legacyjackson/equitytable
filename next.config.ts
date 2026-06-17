import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ========================================
  // IMAGE OPTIMIZATION
  // ========================================
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
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ========================================
  // PWA HEADERS - Critical for offline support
  // ========================================
  headers: async () => {
    return [
      // Service worker should never be cached
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
      // Manifest file
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      // Cache static assets for long time
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // ========================================
  // PWA REWRITES - Route PWA files correctly
  // ========================================
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
      {
        source: '/offline.html',
        destination: '/offline.html',
      },
    ]
  },

  // ========================================
  // REDIRECTS - Optional: Clean URLs
  // ========================================
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        permanent: true,
      },
    ]
  },

  // ========================================
  // ENVIRONMENT VARIABLES
  // ========================================
  env: {
    // These should also be in .env.local
    // Just defaults, actual values come from env files
  },

  // ========================================
  // WEBPACK CONFIG - Optional optimizations
  // ========================================
  webpack: (config, { isServer }) => {
    // You can add custom webpack config here if needed
    return config
  },

  // ========================================
  // EXPERIMENTAL FEATURES
  // ========================================
  experimental: {
    // Optimize package imports for faster builds
    // optimizePackageImports: ['@supabase/supabase-js'],
  },

  // ========================================
  // PRODUCTION OPTIMIZATIONS
  // ========================================
  swcMinify: true,
  compress: true,

  // ========================================
  // REACT STRICT MODE
  // ========================================
  reactStrictMode: true,

  // ========================================
  // TYPESCRIPT
  // ========================================
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // ========================================
  // TRAILING SLASH
  // ========================================
  trailingSlash: false,

  // ========================================
  // STRICT MODE for catching errors
  // ========================================
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
