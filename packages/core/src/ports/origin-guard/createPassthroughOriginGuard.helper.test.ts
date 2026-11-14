import { expect, test } from 'vitest'

import { createPassthroughOriginGuard } from '#src/ports/origin-guard/createPassthroughOriginGuard.helper'
import { OriginGuardReasonEnum } from '#src/ports/origin-guard/originGuardReason.type'

const makeHeaders = (value: string | null) => ({
  get: () => value
})

test('assertTrustedOrigin always trusts regardless of headers', () => {
  const guard = createPassthroughOriginGuard()
  const result = guard.assertTrustedOrigin({ headers: makeHeaders(null) })
  expect(result.trusted).toBe(true)
})

test('assertTrustedOrigin reports the NOT_CONFIGURED reason', () => {
  const guard = createPassthroughOriginGuard()
  const result = guard.assertTrustedOrigin({
    headers: makeHeaders('whatever')
  })
  expect(result.reason).toBe(OriginGuardReasonEnum.NOT_CONFIGURED)
})
