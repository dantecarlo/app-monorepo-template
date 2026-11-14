import type { OriginGuardReasonType } from '#src/ports/origin-guard/originGuardReason.type'

export interface IHeaderReader {
  get(name: string): string | null
}

export interface IAssertTrustedOriginParams {
  headers: IHeaderReader
}

export interface IOriginGuardResult {
  reason?: OriginGuardReasonType
  trusted: boolean
}

export interface IOriginGuardPort {
  assertTrustedOrigin(
    params: IAssertTrustedOriginParams
  ): IOriginGuardResult
}
