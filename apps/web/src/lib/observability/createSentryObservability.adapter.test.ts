import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createSentryObservability } from '@/lib/observability/createSentryObservability.adapter'

const captureException = vi.fn()
const captureMessage = vi.fn()
const setUser = vi.fn()
const addBreadcrumb = vi.fn()

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: (...args: unknown[]) => addBreadcrumb(...args),
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  setUser: (...args: unknown[]) => setUser(...args)
}))

const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1'
})

afterEach(() => {
  process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn
})

test('captureError forwards the exception to Sentry', () => {
  const adapter = createSentryObservability()
  const error = new Error('boom')
  adapter.captureError({ error })
  expect(captureException).toHaveBeenCalledWith(error, {
    extra: undefined
  })
})

test('captureError scrubs PII from the context before sending', () => {
  const adapter = createSentryObservability()
  adapter.captureError({
    context: { email: 'user@example.com', source: 'query' },
    error: new Error('boom')
  })
  expect(captureException).toHaveBeenCalledWith(expect.anything(), {
    extra: { email: '[redacted]', source: 'query' }
  })
})

test('setUser scrubs PII from the user payload', () => {
  const adapter = createSentryObservability()
  adapter.setUser?.({ user: { email: 'user@example.com', id: 'u1' } })
  expect(setUser).toHaveBeenCalledWith({ email: '[redacted]', id: 'u1' })
})

test('addBreadcrumb scrubs PII from breadcrumb data', () => {
  const adapter = createSentryObservability()
  adapter.addBreadcrumb?.({
    data: { email: 'user@example.com' },
    message: 'nav'
  })
  expect(addBreadcrumb).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { email: '[redacted]' }
    })
  )
})

test('all methods no-op when the DSN is absent', () => {
  delete process.env.NEXT_PUBLIC_SENTRY_DSN
  const adapter = createSentryObservability()
  adapter.captureError({ error: new Error('x') })
  adapter.captureMessage?.({ message: 'm' })
  adapter.setUser?.({ user: { id: 'u1' } })
  adapter.addBreadcrumb?.({ message: 'b' })
  expect(captureException).not.toHaveBeenCalled()
  expect(captureMessage).not.toHaveBeenCalled()
  expect(setUser).not.toHaveBeenCalled()
  expect(addBreadcrumb).not.toHaveBeenCalled()
})
