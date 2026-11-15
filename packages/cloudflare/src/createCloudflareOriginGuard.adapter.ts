import {
  type IAssertTrustedOriginParams,
  type IOriginGuardPort,
  type IOriginGuardResult,
  OriginGuardReasonEnum
} from '@app/core'

import { CF_ORIGIN_SECRET_HEADER } from '#src/cloudflare.constant'
import { isConstantTimeEqual } from '#src/constantTimeEqual.helper'

export interface ICreateCloudflareOriginGuardParams {
  originSecret?: string
}

export const createCloudflareOriginGuard = ({
  originSecret = process.env.CF_ORIGIN_SECRET
}: ICreateCloudflareOriginGuardParams = {}): IOriginGuardPort => ({
  assertTrustedOrigin: ({
    headers
  }: IAssertTrustedOriginParams): IOriginGuardResult => {
    if (!originSecret) {
      return {
        reason: OriginGuardReasonEnum.NOT_CONFIGURED,
        trusted: true
      }
    }

    const presented = headers.get(CF_ORIGIN_SECRET_HEADER)
    if (!presented) {
      return {
        reason: OriginGuardReasonEnum.MISSING_HEADER,
        trusted: false
      }
    }

    if (!isConstantTimeEqual({ expected: originSecret, presented })) {
      return {
        reason: OriginGuardReasonEnum.MISMATCH,
        trusted: false
      }
    }

    return { trusted: true }
  }
})
