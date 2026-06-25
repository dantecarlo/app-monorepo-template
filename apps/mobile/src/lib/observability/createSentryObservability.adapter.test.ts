import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const captureException = vi.fn()
const captureMessage = vi.fn()
const setUser = vi.fn()
const addBreadcrumb = vi.fn()
const init = vi.fn()

vi.mock('@sentry/react-native', () => ({
  addBreadcrumb: (...args: unknown[]) => addBreadcrumb(...args),
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  init: (...args: unknown[]) => init(...args),
  setUser: (...args: unknown[]) => setUser(...args)
}))

const loadAdapter = async () => {
  const module =
    await import('@/lib/observability/createSentryObservability.adapter')
  return module.createSentryObservability()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/2'
})

afterEach(() => {
  delete process.env.EXPO_PUBLIC_SENTRY_DSN
})

test('captureError scrubs PII from the context', async () => {
  const adapter = await loadAdapter()
  adapter.captureError({
    context: { email: 'user@example.com', screen: 'Home' },
    error: new Error('boom')
  })
  const [, options] = captureException.mock.calls[0]
  expect(options.extra.email).toBe('[redacted]')
  expect(options.extra.screen).toBe('Home')
})

test('setUser scrubs PII from the user payload', async () => {
  const adapter = await loadAdapter()
  adapter.setUser?.({ user: { email: 'user@example.com', id: 'u1' } })
  const [payload] = setUser.mock.calls[0]
  expect(payload.email).toBe('[redacted]')
  expect(payload.id).toBe('u1')
})

test('methods no-op when the DSN is absent', async () => {
  vi.resetModules()
  delete process.env.EXPO_PUBLIC_SENTRY_DSN
  const adapter = await loadAdapter()
  adapter.captureError({ error: new Error('x') })
  adapter.setUser?.({ user: { id: 'u1' } })
  expect(captureException).not.toHaveBeenCalled()
  expect(setUser).not.toHaveBeenCalled()
})
