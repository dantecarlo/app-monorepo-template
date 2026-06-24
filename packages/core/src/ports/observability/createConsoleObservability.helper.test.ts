import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createConsoleObservability } from './createConsoleObservability.helper'
import { ObservabilityLevelEnum } from './observabilityLevel.type'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('captureError scrubs PII fields from context', () => {
  const adapter = createConsoleObservability()
  adapter.captureError({
    context: { email: 'user@example.com', source: 'queryCache' },
    error: new Error('network')
  })
  const args = (console.error as ReturnType<typeof vi.spyOn>).mock.calls[0]
  const payload = args[1] as { context: Record<string, unknown> }
  expect(payload.context.email).toBe('[redacted]')
  expect(payload.context.source).toBe('queryCache')
})

test('captureError calls console.error', () => {
  const adapter = createConsoleObservability()
  adapter.captureError({ error: new Error('failed') })
  expect(console.error).toHaveBeenCalledOnce()
})

test('captureError is suppressed when isEnabled is false', () => {
  const adapter = createConsoleObservability({ isEnabled: false })
  adapter.captureError({ error: new Error('test') })
  expect(console.error).not.toHaveBeenCalled()
})

test('captureMessage is suppressed when isEnabled is false', () => {
  const adapter = createConsoleObservability({ isEnabled: false })
  adapter.captureMessage?.({ message: 'hello' })
  expect(console.warn).not.toHaveBeenCalled()
  expect(console.error).not.toHaveBeenCalled()
})

test('captureMessage with ERROR level calls console.error', () => {
  const adapter = createConsoleObservability()
  adapter.captureMessage?.({
    level: ObservabilityLevelEnum.ERROR,
    message: 'err'
  })
  expect(console.error).toHaveBeenCalledOnce()
  expect(console.warn).not.toHaveBeenCalled()
})

test('captureMessage with INFO level calls console.warn', () => {
  const adapter = createConsoleObservability()
  adapter.captureMessage?.({
    level: ObservabilityLevelEnum.INFO,
    message: 'info'
  })
  expect(console.warn).toHaveBeenCalledOnce()
  expect(console.error).not.toHaveBeenCalled()
})

test('captureMessage scrubs PII from context', () => {
  const adapter = createConsoleObservability()
  adapter.captureMessage?.({
    context: { token: 'secret', userId: 'abc' },
    message: 'test'
  })
  const args = (console.warn as ReturnType<typeof vi.spyOn>).mock.calls[0]
  const payload = args[1] as { context: Record<string, unknown> }
  expect(payload.context.token).toBe('[redacted]')
  expect(payload.context.userId).toBe('abc')
})
