import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.config.ts')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    viewTransition: true
  },
  headers: async () => [{ headers: securityHeaders, source: '/:path*' }],
  reactCompiler: true,
  reactStrictMode: true,
  typedRoutes: true
}

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }
})
