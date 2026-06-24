import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Generates .next/types with a statically-typed Routes union so Link
  // href and router.push() calls are checked at compile time.
  typedRoutes: true
}

export default nextConfig
