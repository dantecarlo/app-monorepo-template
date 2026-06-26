import {
  type IAssertTrustedOriginParams,
  type IOriginGuardPort,
  type IOriginGuardResult,
  OriginGuardReasonEnum
} from '@app/core'

import { CF_ORIGIN_SECRET_HEADER } from './cloudflare.constant'

/**
 * Edge-safe constant-time secret comparison.
 *
 * This adapter runs in the Next.js EDGE runtime (via `apps/web` middleware),
 * where `node:crypto` and `Buffer` are unavailable — importing them crashes
 * the request. The comparison is therefore implemented with primitives the
 * edge runtime supports: an equal-length guard (a length mismatch is, by
 * definition, not a match) followed by an XOR accumulation over every char
 * code, so the loop always runs the full length and never short-circuits on
 * the first differing character.
 */
const isSecretMatch = ({
  expected,
  presented
}: {
  expected: string
  presented: string
}): boolean => {
  if (presented.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= presented.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return mismatch === 0
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
