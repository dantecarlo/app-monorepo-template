import { afterEach, expect, test, vi } from 'vitest'

import { createTurnstileBotProtection } from './createTurnstileBotProtection.adapter'

const SECRET = 'cf-secret'

afterEach(() => {
  vi.restoreAllMocks()
})

test('verifyToken no-ops to success when no secret is configured', async () => {
  const adapter = createTurnstileBotProtection({ secretKey: undefined })
  const result = await adapter.verifyToken({ token: 'any' })
  expect(result.success).toBe(true)
})

test('verifyToken maps a successful siteverify response', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: async () => ({
      challenge_ts: '2026-01-01T00:00:00Z',
      hostname: 'example.com',
      success: true
    })
  } as Response)

  const adapter = createTurnstileBotProtection({ secretKey: SECRET })
  const result = await adapter.verifyToken({ token: 'valid-token' })

  expect(fetchMock).toHaveBeenCalledOnce()
  expect(result.success).toBe(true)
  expect(result.hostname).toBe('example.com')
  expect(result.challengeTs).toBe('2026-01-01T00:00:00Z')
})

test('verifyToken maps a failed siteverify response with error codes', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: async () => ({
      'error-codes': ['invalid-input-response'],
      success: false
    })
  } as Response)

  const adapter = createTurnstileBotProtection({ secretKey: SECRET })
  const result = await adapter.verifyToken({ token: 'bad-token' })

  expect(result.success).toBe(false)
  expect(result.errorCodes).toEqual(['invalid-input-response'])
})

test('verifyToken posts the secret and token to siteverify', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: async () => ({ success: true })
  } as Response)

  const adapter = createTurnstileBotProtection({ secretKey: SECRET })
  await adapter.verifyToken({ remoteIp: '203.0.113.1', token: 'tok' })

  const [, init] = fetchMock.mock.calls[0]
  const body = (init?.body as URLSearchParams).toString()
  expect(body).toContain('secret=cf-secret')
  expect(body).toContain('response=tok')
  expect(body).toContain('remoteip=203.0.113.1')
})
