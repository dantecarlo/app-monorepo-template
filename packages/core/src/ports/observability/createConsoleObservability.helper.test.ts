import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createConsoleObservability } from './createConsoleObservability.helper'
import { ObservabilityLevelEnum } from './observabilityLevel.type'

let errorSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
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
  const payload = errorSpy.mock.calls[0][1] as {
    context: Record<string, unknown>
  }
  expect(payload.context.email).toBe('[redacted]')
  expect(payload.context.source).toBe('queryCache')
})

test('captureError calls console.error', () => {
  const adapter = createConsoleObservability()
  adapter.captureError({ error: new Error('failed') })
  expect(errorSpy).toHaveBeenCalledOnce()
})

test('captureError is suppressed when isEnabled is false', () => {
  const adapter = createConsoleObservability({ isEnabled: false })
  adapter.captureError({ error: new Error('test') })
  expect(errorSpy).not.toHaveBeenCalled()
})

test('captureMessage is suppressed when isEnabled is false', () => {
  const adapter = createConsoleObservability({ isEnabled: false })
  adapter.captureMessage?.({ message: 'hello' })
  expect(warnSpy).not.toHaveBeenCalled()
  expect(errorSpy).not.toHaveBeenCalled()
})

test('captureMessage with ERROR level calls console.error', () => {
  const adapter = createConsoleObservability()
  adapter.captureMessage?.({
    level: ObservabilityLevelEnum.ERROR,
    message: 'err'
  })
  expect(errorSpy).toHaveBeenCalledOnce()
  expect(warnSpy).not.toHaveBeenCalled()
})

test('captureMessage with INFO level calls console.warn', () => {
  const adapter = createConsoleObservability()
  adapter.captureMessage?.({
    level: ObservabilityLevelEnum.INFO,
    message: 'info'
  })
  expect(warnSpy).toHaveBeenCalledOnce()
  expect(errorSpy).not.toHaveBeenCalled()
})

test('captureMessage scrubs PII from context', () => {
  const adapter = createConsoleObservability()
  adapter.captureMessage?.({
    context: { token: 'secret', userId: 'abc' },
    message: 'test'
  })
  const payload = warnSpy.mock.calls[0][1] as {
    context: Record<string, unknown>
  }
  expect(payload.context.token).toBe('[redacted]')
  expect(payload.context.userId).toBe('abc')
})
