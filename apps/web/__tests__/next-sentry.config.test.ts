import { afterEach, expect, test, vi } from 'vitest'

import buildNextConfig from '../next.config'
import withSentry from '../next-sentry.config'

const { withSentryConfig } = vi.hoisted(() => ({
  withSentryConfig: vi.fn((config: object) => config)
}))

vi.mock('@sentry/nextjs', () => ({ withSentryConfig }))

afterEach(() => {
  vi.unstubAllEnvs()
  withSentryConfig.mockClear()
})

test('wraps the config with Sentry, uploading source maps only with a token', () => {
  const config = { reactStrictMode: true }

  vi.stubEnv('SENTRY_AUTH_TOKEN', undefined)
  expect(withSentry({ config })).toBe(config)
  vi.stubEnv('SENTRY_AUTH_TOKEN', 'sntrys_contract_token')
  withSentry({ config })

  expect(withSentryConfig.mock.calls).toEqual([
    [config, { silent: true, sourcemaps: { disable: true } }],
    [config, { silent: true, sourcemaps: { disable: false } }]
  ])
})

// This test goes with the capability: next.config.ts names no capability, and
// a project whose /init dropped Sentry has no file here to apply.
test("next.config.ts applies the Sentry capability's file of the web app", async () => {
  const config = await buildNextConfig()

  expect(withSentryConfig).toHaveBeenCalledOnce()
  expect(withSentryConfig.mock.calls[0]?.[0]).toMatchObject({
    reactStrictMode: true
  })
  expect(config).toBe(withSentryConfig.mock.results[0]?.value)
})
