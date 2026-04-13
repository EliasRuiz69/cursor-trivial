import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Permitir imágenes de avatares de Google
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
