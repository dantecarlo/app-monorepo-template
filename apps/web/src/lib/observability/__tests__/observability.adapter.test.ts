import { afterEach, expect, test, vi } from 'vitest'

import { observability } from '@/lib/observability/observability.adapter'

const sdk = vi.hoisted(() => ({
  captureException: vi.fn(),
  init: vi.fn()
}))

vi.mock('posthog-js', () => ({ default: sdk }))

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
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_contract_key')
  vi.resetModules()
  const { observability: bound } =
    await import('@/lib/observability/observability.adapter')
  const error = new Error('boom')

  bound.captureError({ error })

  // The SDK loads on demand; the capture reaches it once it has.
  await vi.waitFor(() =>
    expect(sdk.captureException).toHaveBeenCalledExactlyOnceWith(
      error,
      undefined
    )
  )
})
