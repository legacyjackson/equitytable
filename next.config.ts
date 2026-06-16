import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      // DigitalOcean Spaces (Phase 2+)
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
      },
      // Mux (Phase 3)
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
    ],
  },
  // Allow Stripe to be loaded in the browser
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
