import { afterEach, expect, test, vi } from 'vitest'

const { optIn } = vi.hoisted(() => ({
  optIn: vi.fn(async () => undefined)
}))

vi.mock('posthog-react-native', () => ({
  PostHog: class {
    optIn = optIn
  }
}))

afterEach(() => {
  vi.unstubAllEnvs()
})

test('binds the PostHog consent by default', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', 'phc_contract_key')
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', 'opt-in')
  vi.resetModules()
  const { consent } = await import('@/lib/observability')

  await consent.grant()

  expect(optIn).toHaveBeenCalledOnce()
})
