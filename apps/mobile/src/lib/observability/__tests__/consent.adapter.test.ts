import { afterEach, expect, test, vi } from 'vitest'

// The device storage is replaced at the project module that owns it.
vi.mock('@/lib/storage', async () => {
  const { createMemoryKeyValueStorage } = await import('@app/core')
  return { keyValueStorage: createMemoryKeyValueStorage() }
})

// The client is built from the shared stand-in of vitest.config.ts, taken
// from the same module registry as the consent it binds.
const loadConsent = async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', 'phc_contract_key')
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', 'opt-in')
  vi.resetModules()
  const { PostHog } = await import('posthog-react-native')
  const { consent } = await import('@/lib/observability')
  return { PostHog, consent }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

test('binds the PostHog consent by default', async () => {
  const { PostHog, consent } = await loadConsent()
  const optIn = vi.spyOn(PostHog.prototype, 'optIn')

  await consent.grant()

  expect(optIn).toHaveBeenCalledOnce()
})

// A revoke empties the client's queues and shuts it down, so the shared
// stand-in carries those calls too.
test('revokes through the barrel and shuts the client down on the shared stand-in', async () => {
  const { PostHog, consent } = await loadConsent()
  const shutdown = vi.spyOn(PostHog.prototype, 'shutdown')
  await consent.grant()

  await consent.revoke()

  expect(shutdown).toHaveBeenCalledOnce()
  expect(await consent.getStatus()).toBe('denied')
})
