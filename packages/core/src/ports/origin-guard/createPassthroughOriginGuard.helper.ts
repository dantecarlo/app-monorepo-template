import type { IOriginGuardPort } from './IOriginGuardPort.type'
import { OriginGuardReasonEnum } from './originGuardReason.type'

export const createPassthroughOriginGuard = (): IOriginGuardPort => ({
  assertTrustedOrigin: () => ({
    reason: OriginGuardReasonEnum.NOT_CONFIGURED,
    trusted: true
  })
})
