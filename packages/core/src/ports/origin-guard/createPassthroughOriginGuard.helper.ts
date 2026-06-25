/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import type { IOriginGuardPort } from './IOriginGuardPort.type'
import { OriginGuardReasonEnum } from './originGuardReason.type'
/* eslint-enable no-relative-import-paths/no-relative-import-paths */

export const createPassthroughOriginGuard = (): IOriginGuardPort => ({
  assertTrustedOrigin: () => ({
    reason: OriginGuardReasonEnum.NOT_CONFIGURED,
    trusted: true
  })
})
