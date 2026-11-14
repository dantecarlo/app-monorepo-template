import type { IOriginGuardPort } from '#src/ports/origin-guard/IOriginGuardPort.type'
import { OriginGuardReasonEnum } from '#src/ports/origin-guard/originGuardReason.type'

export const createPassthroughOriginGuard = (): IOriginGuardPort => ({
  assertTrustedOrigin: () => ({
    reason: OriginGuardReasonEnum.NOT_CONFIGURED,
    trusted: true
  })
})
