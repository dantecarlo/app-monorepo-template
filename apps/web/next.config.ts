import { readdirSync } from 'node:fs'
import { join } from 'node:path'

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

// An optional capability changes the config from a file of its own beside
// this one, `next-<capability>.config.ts` (Sentry's is next-sentry.config.ts),
// whose default export takes the config and returns it changed. /init deletes
// that file with its capability, so this file names none of them.
const CONFIG_PLUGIN_FILE = /^next-[a-z0-9-]+\.config\.ts$/u

type NextConfigPluginType = (params: { config: NextConfig }) => NextConfig

type LoadConfigPluginType = (params: {
  path: string
}) => Promise<NextConfigPluginType>

const importConfigPlugin: LoadConfigPluginType = async ({ path }) => {
  const plugin = (await import(path)) as { default: NextConfigPluginType }
  return plugin.default
}

/** Applies the default export of every capability file in `dir`, by name. */
export const applyConfigPlugins = async ({
  config,
  dir,
  load = importConfigPlugin
}: {
  config: NextConfig
  dir: string
  load?: LoadConfigPluginType
}): Promise<NextConfig> => {
  const paths = readdirSync(dir)
    .filter((name) => CONFIG_PLUGIN_FILE.test(name))
    .sort()
    .map((name) => join(dir, name))
  const plugins = await Promise.all(paths.map((path) => load({ path })))
  return plugins.reduce(
    (applied, plugin) => plugin({ config: applied }),
    config
  )
}

const buildNextConfig = (): Promise<NextConfig> =>
  applyConfigPlugins({ config: withNextIntl(nextConfig), dir: __dirname })

export default buildNextConfig
