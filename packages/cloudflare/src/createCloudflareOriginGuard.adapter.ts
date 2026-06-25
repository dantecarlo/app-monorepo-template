import { timingSafeEqual } from 'node:crypto'

import {
  type IAssertTrustedOriginParams,
  type IOriginGuardPort,
  type IOriginGuardResult,
  OriginGuardReasonEnum
} from '@app/core'

import { CF_ORIGIN_SECRET_HEADER } from './cloudflare.constant'

/**
 * Constant-time secret comparison. `timingSafeEqual` THROWS when the two
 * buffers differ in length, so unequal byte-lengths are rejected up front
 * (a length mismatch is, by definition, not a match).
 */
const isSecretMatch = ({
  expected,
  presented
}: {
  expected: string
  presented: string
}): boolean => {
  const presentedBytes = Buffer.from(presented)
  const expectedBytes = Buffer.from(expected)
  if (presentedBytes.length !== expectedBytes.length) return false
  return timingSafeEqual(presentedBytes, expectedBytes)
}

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

    if (!isSecretMatch({ expected: originSecret, presented })) {
      return {
        reason: OriginGuardReasonEnum.MISMATCH,
        trusted: false
      }
    }

    return { trusted: true }
  }
})
