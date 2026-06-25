import { OriginGuardReasonEnum } from '@app/core'
import { expect, test } from 'vitest'

import { createCloudflareOriginGuard } from './createCloudflareOriginGuard.adapter'

const SECRET = 'origin-secret'

const makeHeaders = (value: string | null) => ({
  get: () => value
})

test('assertTrustedOrigin passes through when no secret is configured', () => {
  const guard = createCloudflareOriginGuard({ originSecret: undefined })
  const result = guard.assertTrustedOrigin({ headers: makeHeaders(null) })
  expect(result.trusted).toBe(true)
  expect(result.reason).toBe(OriginGuardReasonEnum.NOT_CONFIGURED)
})

test('assertTrustedOrigin trusts when the header matches the secret', () => {
  const guard = createCloudflareOriginGuard({ originSecret: SECRET })
  const result = guard.assertTrustedOrigin({
    headers: makeHeaders(SECRET)
  })
  expect(result.trusted).toBe(true)
  expect(result.reason).toBeUndefined()
})

test('assertTrustedOrigin rejects a missing header', () => {
  const guard = createCloudflareOriginGuard({ originSecret: SECRET })
  const result = guard.assertTrustedOrigin({ headers: makeHeaders(null) })
  expect(result.trusted).toBe(false)
  expect(result.reason).toBe(OriginGuardReasonEnum.MISSING_HEADER)
})

test('assertTrustedOrigin rejects a mismatched header', () => {
  const guard = createCloudflareOriginGuard({ originSecret: SECRET })
  const result = guard.assertTrustedOrigin({
    headers: makeHeaders('wrong')
  })
  expect(result.trusted).toBe(false)
  expect(result.reason).toBe(OriginGuardReasonEnum.MISMATCH)
})

test('assertTrustedOrigin rejects an equal-length mismatch via constant-time compare', () => {
  const guard = createCloudflareOriginGuard({ originSecret: SECRET })
  const sameLengthWrong = 'x'.repeat(SECRET.length)
  const result = guard.assertTrustedOrigin({
    headers: makeHeaders(sameLengthWrong)
  })
  expect(result.trusted).toBe(false)
  expect(result.reason).toBe(OriginGuardReasonEnum.MISMATCH)
})
