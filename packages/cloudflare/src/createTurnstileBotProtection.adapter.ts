import type {
  IBotProtectionPort,
  IBotVerificationResult,
  IVerifyTokenParams
} from '@app/core'

import {
  TURNSTILE_REMOTE_IP_FIELD,
  TURNSTILE_RESPONSE_FIELD,
  TURNSTILE_SECRET_FIELD,
  TURNSTILE_SITEVERIFY_URL
} from './cloudflare.constant'

const PRODUCTION_ENV = 'production'

const MISSING_SECRET_PRODUCTION_ERROR = 'turnstile-secret-not-configured'

interface ISiteverifyResponse {
  challenge_ts?: string
  'error-codes'?: string[]
  hostname?: string
  success: boolean
}

export interface ICreateTurnstileBotProtectionParams {
  secretKey?: string
}

const toResult = (dto: ISiteverifyResponse): IBotVerificationResult => ({
  challengeTs: dto.challenge_ts,
  errorCodes: dto['error-codes'],
  hostname: dto.hostname,
  success: dto.success
})

export const createTurnstileBotProtection = ({
  secretKey = process.env.TURNSTILE_SECRET_KEY
}: ICreateTurnstileBotProtectionParams = {}): IBotProtectionPort => ({
  verifyToken: async ({
    remoteIp,
    token
  }: IVerifyTokenParams): Promise<IBotVerificationResult> => {
    if (!secretKey) {
      // Dev/CI may run without a secret. Production must NOT silently allow
      // every request through — fail CLOSED and surface the misconfiguration.
      if (process.env.NODE_ENV === PRODUCTION_ENV) {
        console.error(
          '[turnstile] TURNSTILE_SECRET_KEY is not configured in production; failing closed.'
        )
        return {
          errorCodes: [MISSING_SECRET_PRODUCTION_ERROR],
          success: false
        }
      }
      return { success: true }
    }

    const body = new URLSearchParams()
    body.set(TURNSTILE_SECRET_FIELD, secretKey)
    body.set(TURNSTILE_RESPONSE_FIELD, token)
    if (remoteIp) body.set(TURNSTILE_REMOTE_IP_FIELD, remoteIp)

    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      body,
      method: 'POST'
    })
    const dto = (await response.json()) as ISiteverifyResponse
    return toResult(dto)
  }
})
