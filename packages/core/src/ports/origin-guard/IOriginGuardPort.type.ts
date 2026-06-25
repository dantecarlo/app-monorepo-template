// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type { OriginGuardReasonType } from './originGuardReason.type'

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
