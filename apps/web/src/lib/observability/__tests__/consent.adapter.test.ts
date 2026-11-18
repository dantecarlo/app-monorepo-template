import { afterEach, expect, test, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  opt_in_capturing: vi.fn()
}))

vi.mock('posthog-js', () => ({ default: sdk }))

afterEach(() => {
  vi.unstubAllEnvs()
})

test('binds the PostHog consent by default', async () => {
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_contract_key')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_CONSENT', 'opt-in')
  vi.resetModules()
  const { consent } = await import('@/lib/observability')

  await consent.grant()

  expect(sdk.opt_in_capturing).toHaveBeenCalledOnce()
})
