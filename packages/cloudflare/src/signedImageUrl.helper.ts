import { isConstantTimeEqual } from '#src/constantTimeEqual.helper'
import { hmacHexSignature } from '#src/hmacHexSignature.helper'
import {
  HMAC_HEX_SIGNATURE_PATTERN,
  SECONDS_TO_MILLISECONDS,
  SIGNED_URL_EXPIRY_QUERY_KEY,
  SIGNED_URL_SIGNATURE_QUERY_KEY,
  UNIX_SECONDS_PATTERN
} from '#src/imageDelivery.constant'
import {
  type ISignedImageUrlVerification,
  type ISignImageUrlParams,
  type IVerifySignedImageUrlParams,
  SignedImageUrlRejectionEnum,
  type SignedImageUrlRejectionType
} from '#src/signedImageUrl.type'

// The string both adapters sign: the URL path and its query, `exp` included
// and `sig` not yet appended.
const toCanonicalMessage = ({ url }: { url: URL }): string =>
  `${url.pathname}?${url.searchParams.toString()}`

const currentUnixSeconds = (): number =>
  Math.floor(Date.now() / SECONDS_TO_MILLISECONDS)

/**
 * Adds `exp` (now, in Unix seconds, plus `expiresInSeconds`) to `url`, then
 * `sig`, the HMAC-SHA256 hex of the canonical message keyed by `secret`.
 */
export const signImageUrl = async ({
  expiresInSeconds,
  secret,
  url
}: ISignImageUrlParams): Promise<string> => {
  const signed = new URL(url)
  signed.searchParams.set(
    SIGNED_URL_EXPIRY_QUERY_KEY,
    String(currentUnixSeconds() + expiresInSeconds)
  )
  const signature = await hmacHexSignature({
    message: toCanonicalMessage({ url: signed }),
    secret
  })
  signed.searchParams.set(SIGNED_URL_SIGNATURE_QUERY_KEY, signature)
  return signed.toString()
}

const reject = ({
  reason
}: {
  reason: SignedImageUrlRejectionType
}): ISignedImageUrlVerification => ({ reason, valid: false })

const parseUrl = ({ url }: { url: string }): URL | null => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

// The one `exp` and the one `sig` of a URL, when each appears exactly once
// and has its shape: whole Unix seconds, and 64 lowercase hex characters.
const readSignedParams = ({
  url
}: {
  url: URL
}): { expiry: number; signature: string } | null => {
  const expiries = url.searchParams.getAll(SIGNED_URL_EXPIRY_QUERY_KEY)
  const signatures = url.searchParams.getAll(
    SIGNED_URL_SIGNATURE_QUERY_KEY
  )
  if (expiries.length !== 1 || signatures.length !== 1) return null
  const [expiry] = expiries
  const [signature] = signatures
  if (!UNIX_SECONDS_PATTERN.test(expiry)) return null
  if (!HMAC_HEX_SIGNATURE_PATTERN.test(signature)) return null
  const seconds = Number(expiry)
  return Number.isSafeInteger(seconds)
    ? { expiry: seconds, signature }
    : null
}

/**
 * Verifies a URL `signImageUrl` signed: its `sig` must equal, compared in
 * constant time, the HMAC-SHA256 hex of the canonical message keyed by
 * `secret`, and its `exp` must be later than `nowInSeconds` (the current Unix
 * time by default). Reads no environment variable and does no I/O.
 */
export const verifySignedImageUrl = async ({
  nowInSeconds = currentUnixSeconds(),
  secret,
  url
}: IVerifySignedImageUrlParams): Promise<ISignedImageUrlVerification> => {
  if (!secret) {
    return reject({ reason: SignedImageUrlRejectionEnum.NOT_CONFIGURED })
  }
  const parsed = parseUrl({ url })
  const params = parsed && readSignedParams({ url: parsed })
  if (!parsed || !params) {
    return reject({ reason: SignedImageUrlRejectionEnum.MALFORMED })
  }

  parsed.searchParams.delete(SIGNED_URL_SIGNATURE_QUERY_KEY)
  const expected = await hmacHexSignature({
    message: toCanonicalMessage({ url: parsed }),
    secret
  })
  if (!isConstantTimeEqual({ expected, presented: params.signature })) {
    return reject({
      reason: SignedImageUrlRejectionEnum.SIGNATURE_MISMATCH
    })
  }
  if (params.expiry <= nowInSeconds) {
    return reject({ reason: SignedImageUrlRejectionEnum.EXPIRED })
  }
  return { valid: true }
}
