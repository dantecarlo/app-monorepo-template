import { expect, test } from 'vitest'

import { botProtection } from '@/lib/bot-protection/botProtection.adapter'

test('botProtection adapter satisfies the IBotProtectionPort contract', () => {
  expect(typeof botProtection.verifyToken).toBe('function')
})

test('verifyToken degrades to success when no secret is configured', async () => {
  const result = await botProtection.verifyToken({ token: 'any' })
  expect(result.success).toBe(true)
})
