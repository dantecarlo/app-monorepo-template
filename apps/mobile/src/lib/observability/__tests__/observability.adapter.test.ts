import { afterEach, expect, test, vi } from 'vitest'

import { observability } from '@/lib/observability/observability.adapter'

const sdk = vi.hoisted(() => ({ captureException: vi.fn() }))

// The real package cannot load under the test environment.
vi.mock('posthog-react-native', () => ({
  PostHog: class {
    captureException = sdk.captureException
  }
}))

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
  const { observability: bound } =
    await import('@/lib/observability/observability.adapter')
  const error = new Error('boom')

  bound.captureError({ error })

  expect(sdk.captureException).toHaveBeenCalledExactlyOnceWith(
    error,
    undefined
  )
})
