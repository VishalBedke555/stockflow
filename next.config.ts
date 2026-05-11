import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disable Turbopack for production (optional)
  turbopack: false,
  
  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Images configuration (if using external images)
  images: {
    domains: [], // Add domains if you load external images
  },
}

export default nextConfig