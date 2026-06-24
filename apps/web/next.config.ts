import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.config.ts')

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    viewTransition: true
  },
  reactCompiler: true,
  reactStrictMode: true,
  typedRoutes: true
}

export default withNextIntl(nextConfig)
