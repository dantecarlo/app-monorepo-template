import { expect, test } from 'vitest'

import { createPermissiveBotProtection } from './createPermissiveBotProtection.helper'

test('verifyToken resolves success regardless of the token', async () => {
  const adapter = createPermissiveBotProtection()
  const result = await adapter.verifyToken({ token: 'anything' })
  expect(result.success).toBe(true)
})

test('verifyToken resolves success even with an empty token', async () => {
  const adapter = createPermissiveBotProtection()
  const result = await adapter.verifyToken({ token: '' })
  expect(result.success).toBe(true)
})
