import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

import {
  CACHE_CONTROL_HEADER,
  IMAGE_CACHE_CONTROL_VALUE
} from '@/lib/image-delivery/imageCacheHeaders.constant'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.config.ts')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
]

const imageHeaders = [
  { key: CACHE_CONTROL_HEADER, value: IMAGE_CACHE_CONTROL_VALUE }
]

const imageSource = '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)'

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    viewTransition: true
  },
  headers: async () => [
    { headers: securityHeaders, source: '/:path*' },
    { headers: imageHeaders, source: imageSource }
  ],
  reactCompiler: true,
  reactStrictMode: true,
  typedRoutes: true
}

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }
})
