import { expect, test } from 'vitest'

import { originGuard } from '@/lib/origin-guard/originGuard.adapter'

const makeHeaders = (value: string | null) => ({
  get: () => value
})

test('originGuard adapter satisfies the IOriginGuardPort contract', () => {
  expect(typeof originGuard.assertTrustedOrigin).toBe('function')
})

test('assertTrustedOrigin passes through when no secret is configured', () => {
  const result = originGuard.assertTrustedOrigin({
    headers: makeHeaders(null)
  })
  expect(result.trusted).toBe(true)
})
