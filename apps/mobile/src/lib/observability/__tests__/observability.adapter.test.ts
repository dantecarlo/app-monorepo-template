import { afterEach, expect, test, vi } from 'vitest'

import { observability } from '@/lib/observability/observability.adapter'

afterEach(() => {
  vi.unstubAllEnvs()
})

test('observability adapter satisfies the IObservabilityPort contract', () => {
  expect(typeof observability.captureError).toBe('function')
})

test('captureError does not throw', () => {
  expect(() =>
    observability.captureError({ error: new Error('test') })
  ).not.toThrow()
})

test('binds the PostHog adapter by default', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', 'phc_contract_key')
  vi.resetModules()
  // The package is the shared stand-in of vitest.config.ts, loaded in the
  // registry the adapter loads in next.
  const { PostHog } = await import('posthog-react-native')
  const captureException = vi.spyOn(PostHog.prototype, 'captureException')
  const { observability: bound } =
    await import('@/lib/observability/observability.adapter')
  const error = new Error('boom')

  bound.captureError({ error })

  expect(captureException).toHaveBeenCalledExactlyOnceWith(
    error,
    undefined
  )
})
